# OpenAPI

## Overview

Litestar auto-generates OpenAPI 3.1.0 schemas from route handler type annotations. This project uses the schema to drive frontend codegen -- changes to handler signatures directly affect the frontend contract.

## App-level config

```python
from litestar.openapi import OpenAPIConfig

app = Litestar(
    openapi_config=OpenAPIConfig(
        title="My API",
        version="1.0.0",
    )
)
```

## Per-handler customization

Decorator kwargs control how each handler appears in the schema:

```python
class ItemController(Controller):
    @get(
        "/items/{pk:int}",
        tags=["items"],
        summary="Retrieve an item",
        description="Fetches a single item by primary key.",
        operation_id="getItem",
        responses={
            404: ResponseSpec(
                data_container=ItemNotFound,
                description="Item not found",
            )
        },
    )
    async def get_item(self, pk: int) -> Item: ...
```

Key decorator kwargs:

| Kwarg | Effect |
|-------|--------|
| `tags` | List of strings for grouping operations |
| `summary` / `description` | Documentation text shown in the schema |
| `operation_id` | Explicit ID (otherwise auto-generated from handler name) |
| `responses` | Additional response schemas via `ResponseSpec` |
| `include_in_schema=False` | Exclude the handler from the schema entirely |
| `deprecated=True` | Mark the operation as deprecated |

## ResponseSpec for error schemas

Use `ResponseSpec` to document error responses with typed data containers:

```python
from litestar.openapi import ResponseSpec

responses={404: ResponseSpec(data_container=ErrorModel, description="Not found")}
```

The `data_container` must be a Pydantic model or dataclass. Litestar generates the JSON Schema from its fields automatically.

## Accessing schema programmatically

After app initialization, the full schema object is available at `app.openapi_schema`. This is useful for exporting or validating the schema in tests.

## This project's workflow

The schema served at `/schema` is exported and consumed by Hey API for TypeScript client codegen. Because handler return types and parameter annotations drive the schema, any change to a handler signature updates the frontend client. See the system guide (`docs/system-guide.md`) for the full codegen pipeline.

## Docs

<https://docs.litestar.dev/2/usage/openapi/schema_generation.html>
