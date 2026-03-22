---
name: litestar
description: Use when working on the Litestar backend — modifying controllers, routes, dependencies, or API configuration
---

## Overview

Litestar is the ASGI framework powering this project's backend. This skill covers framework-specific knowledge; for architecture and project conventions see `docs/api-architecture.md`.

## Controllers & Routing

| Concept | Litestar Pattern |
|---------|-----------------|
| Define controller | `class MyController(Controller): path = "/resource"` |
| GET handler | `@get()` or `@get("/sub-path")` on async method |
| POST handler | `@post(status_code=HTTP_201_CREATED)` |
| PUT/PATCH/DELETE | `@put("/{id:int}")`, `@patch()`, `@delete()` |
| Path parameter | `/{param_name:type}` in path, matching method param |
| Query parameter | Method param with default value (`done: bool \| None = None`) |
| Request body | Method param typed to Pydantic model (`data: MyModel`) |
| Return type | Annotate return — Litestar serializes automatically |
| Register controller | `Litestar(route_handlers=[MyController])` |

## Not FastAPI

Common FastAPI/Flask patterns mapped to their Litestar equivalents.

| FastAPI / Flask | Litestar equivalent |
|----------------|---------------------|
| `@app.get("/path")` | `@get("/path")` on Controller method |
| `Depends(fn)` | `Provide(fn)` in `dependencies={}` |
| `APIRouter` | `Router(path="/prefix", route_handlers=[...])` |
| `response_model=` | Return type annotation (automatic) |
| `HTTPException(status_code=N)` | `HTTPException(status_code=N, detail="msg")` from `litestar.exceptions` |
| `BackgroundTasks` | `BackgroundTask` / `BackgroundTasks` from `litestar.background_tasks` |

## Sub-skills index

| Topic | File | When to use |
|-------|------|-------------|
| Dependency Injection | `dependency-injection.md` | Wiring services, Provide, scopes |
| Testing | `testing.md` | Writing controller/route tests |
| OpenAPI | `openapi.md` | Configuring schema, tags, responses |
| Piccolo ORM | `piccolo-orm.md` | Database models, queries, DTOs |
| Exception Handling | `exception-handling.md` | Error responses, custom handlers |

## Key docs links

- Controllers: <https://docs.litestar.dev/2/usage/routing/overview.html>
- Handlers: <https://docs.litestar.dev/2/usage/routing/handlers.html>
