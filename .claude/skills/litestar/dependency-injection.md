# Dependency Injection

## Overview

Litestar's DI resolves handler parameters by name from a `dependencies` dict. Dependencies cascade through scopes: app -> router -> controller -> handler, where lower scopes override higher ones.

## Provide wrapper

```python
from litestar.di import Provide

# In the composition root (api/main.py)
dependencies={"service": Provide(lambda: my_service, sync_to_thread=False)}
```

Key `Provide` parameters:

| Parameter | Effect |
|-----------|--------|
| `sync_to_thread=True` | Run sync callable in a thread pool (use for blocking I/O) |
| `sync_to_thread=False` | Keep on event loop (use for fast/already-async callables) |
| `use_cache=True` | Memoize the result for the app lifetime (use cautiously) |

## Handler injection

The parameter name must match the dependency key:

```python
class ItemController(Controller):
    @get()
    async def get_items(self, service: MyServiceProtocol) -> list[Item]:
        #                       ^^^^^^^ matches "service" key
        return service.get_all()
```

## Generator dependencies (resource cleanup)

Use generator functions for dependencies that need teardown (e.g. DB sessions):

```python
async def db_session() -> AsyncGenerator[AsyncSession, None]:
    session = SessionFactory()
    try:
        yield session
    finally:
        await session.close()
```

Always wrap `yield` in `try/finally` to guarantee cleanup runs. Register like any other dependency:

```python
dependencies={"session": Provide(db_session)}
```

## This project's pattern

Dependencies are wired in the **composition root** (`api/main.py`). Controllers depend on **Protocol-typed parameters**, never concrete implementations:

```python
# Composition root — wire concrete -> abstract
def create_app() -> Litestar:
    repository = InMemoryTodoRepository()
    service = TodoService(repository=repository)
    return Litestar(
        route_handlers=[TodoController],
        dependencies={"service": Provide(lambda: service, sync_to_thread=False)},
    )
```

```python
# Controller — depends on Protocol, not concrete class
class TodoController(Controller):
    @get()
    async def get_list(self, service: TodoServiceProtocol, done: bool | None = None) -> list[TodoItem]:
        return service.get_all(done)
```

This keeps controllers testable and decoupled. See `docs/api-architecture.md` for the full Clean Architecture pattern.

## Docs

<https://docs.litestar.dev/2/usage/dependency-injection.html>
