# Testing

## Overview

Litestar provides `TestClient` (sync) and `AsyncTestClient` (async), both wrapping httpx. This project uses the sync `TestClient` with fakes injected via DI to test controllers in isolation.

## TestClient setup (this project's pattern)

```python
from litestar import Litestar
from litestar.di import Provide
from litestar.testing import TestClient

class FakeService:
    """Minimal fake — must match the Protocol's full signature."""
    def get_all(self, done: bool | None = None) -> list[Item]:
        return []

def _create_test_client() -> TestClient[Litestar]:
    fake = FakeService()
    app = Litestar(
        route_handlers=[MyController],
        dependencies={"service": Provide(lambda: fake, sync_to_thread=False)},
    )
    return TestClient(app, raise_server_exceptions=True)  # surfaces errors as exceptions
```

## Writing tests

Function-style only (no `TestClass`). Use the client as a context manager:

```python
def test_get_empty_list() -> None:
    with _create_test_client() as client:
        response = client.get("/")
        assert response.status_code == 200
        assert response.json() == []

def test_create_item() -> None:
    with _create_test_client() as client:
        response = client.post("/", json={"name": "Task", "done": False})
        assert response.status_code == 201
```

## Request patterns

| Action | Code |
|--------|------|
| Query params | `client.get("/", params={"done": True})` |
| Path params | `client.get("/items/42")` |
| JSON body | `client.post("/", json={...})` |
| Headers | `client.get("/", headers={"X-Token": "abc"})` |

## create_test_client shortcut

This project prefers the explicit `Litestar()` + `TestClient()` pattern above. For simpler one-off tests:

```python
from litestar.testing import create_test_client

with create_test_client(route_handlers=[handler], dependencies={...}) as client:
    ...
```

## RequestFactory

For unit testing guards, middleware, or anything that needs a raw `Request` object without spinning up a full test server:

```python
from litestar.testing import RequestFactory
request = RequestFactory().get("/")
```

## This project's conventions

- **Fakes over mocks** -- hand-written fakes that satisfy Protocol interfaces, never `unittest.mock`.
- **Each layer tested in isolation** -- controllers get fake services, services get fake repositories.
- **Test structure mirrors source structure** -- `tests/todo/presentation/` mirrors `api/todo/presentation/`.
- See `docs/api-architecture.md` section "Testing Conventions" for the full policy.

## Docs

<https://docs.litestar.dev/2/usage/testing.html>
