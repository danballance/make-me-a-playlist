# Exception Handling

## Overview

Litestar provides an `HTTPException` hierarchy that serializes to JSON automatically. Custom handlers can be registered at any layer (app, router, controller, route).

## Built-in exceptions

All live in `litestar.exceptions`:

| Exception | Status | Use when |
|-----------|--------|----------|
| `HTTPException` | any | Base class, specify `status_code` |
| `ValidationException` | 400 | Request validation failures |
| `NotAuthorizedException` | 401 | Authentication required |
| `PermissionDeniedException` | 403 | Insufficient permissions |
| `NotFoundException` | 404 | Resource not found |
| `MethodNotAllowedException` | 405 | Wrong HTTP method for route |
| `InternalServerException` | 500 | Unexpected server errors |

For other status codes, use `HTTPException(status_code=N, detail="msg")` directly.

## Raising exceptions

Generic Litestar pattern (for simple cases):

```python
from litestar.exceptions import NotFoundException

raise NotFoundException(detail=f"Item {item_id} not found")
```

Response body: `{"status_code": 404, "detail": "Item 42 not found"}`

In this project, prefer the domain exception mapping pattern below instead.

## Custom exception handlers

Register a callable that receives the request and exception, returns a `Response`:

```python
from litestar import Request, Response, MediaType

def custom_handler(request: Request, exc: Exception) -> Response:
    return Response(
        media_type=MediaType.JSON,
        content={"error": str(exc), "path": request.url.path},
        status_code=getattr(exc, "status_code", 500),
    )

app = Litestar(exception_handlers={HTTPException: custom_handler})
```

## Layered registration

Handlers can be set at route, controller, router, or app level. Lower layers override higher ones. ASGI-level errors (404 no route, 405 method not allowed) are always handled at app level.

## This project's pattern

Domain and application layers raise plain Python exceptions. The presentation layer catches these and maps them to the appropriate `HTTPException`. This keeps the domain layer framework-agnostic.

```python
# domain/exceptions.py
class ItemNotFoundError(Exception): ...

# presentation/controllers.py
class ItemController(Controller):
    @get("/{item_id:int}")
    async def get_item(self, item_id: int, service: ItemServiceProtocol) -> Item:
        try:
            return service.get(item_id)
        except ItemNotFoundError:
            raise NotFoundException(detail=f"Item {item_id} not found")
```

## Docs

<https://docs.litestar.dev/2/usage/exceptions.html>
