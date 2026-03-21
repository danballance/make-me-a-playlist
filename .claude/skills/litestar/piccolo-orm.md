# Piccolo ORM Integration

## Overview

Piccolo is an async-first ORM with native Litestar support via `PiccoloDTO`. Models extend `Table` with typed columns.

## Model Definition

```python
from piccolo.columns import Varchar, Boolean
from piccolo.table import Table

class TaskTable(Table, tablename="tasks"):
    # Piccolo auto-creates `id = Serial(primary_key=True)`
    name = Varchar()
    completed = Boolean(default=False)
```

## PiccoloDTO for Serialization

```python
from litestar.contrib.piccolo import PiccoloDTO

@get("/tasks", return_dto=PiccoloDTO[TaskTable])
async def list_tasks() -> list[TaskTable]:
    return await TaskTable.select().order_by(TaskTable.id)
```

- `dto=PiccoloDTO[Model]` -- deserialize request body
- `return_dto=PiccoloDTO[Model]` -- serialize response

## DTOConfig for Partial Updates

```python
from litestar import patch
from litestar.dto import DTOConfig, DTOData
from litestar.exceptions import NotFoundException

class PatchDTO(PiccoloDTO[TaskTable]):
    config = DTOConfig(exclude={"id"}, partial=True)

@patch("/tasks/{task_id:int}", dto=PatchDTO, return_dto=PiccoloDTO[TaskTable])
async def update_task(task_id: int, data: DTOData[TaskTable]) -> TaskTable:
    task = await TaskTable.objects().get(TaskTable.id == task_id)
    if not task:
        raise NotFoundException(detail=f"Task {task_id} not found")
    result = data.update_instance(task)
    await result.save()
    return result
```

## Common CRUD Operations

| Operation | Code |
|-----------|------|
| Select all | `await Model.select()` |
| Select filtered | `await Model.select().where(Model.col == val)` |
| Get one | `await Model.objects().get(Model.id == pk)` |
| Insert | `await instance.save()` |
| Update | `instance.col = val; await instance.save()` |
| Delete | `await instance.remove()` |
| Refresh | `await instance.refresh()` |

## Startup Hook

Register table creation at application startup:

```python
from piccolo.table import create_db_tables

async def on_startup():
    await create_db_tables(TaskTable, if_not_exists=True)

app = Litestar(on_startup=[on_startup])
```

## Repository Pattern Integration

Piccolo models live in the **infrastructure layer**. The repository protocol (domain layer) remains ORM-agnostic. The concrete repository in infrastructure uses Piccolo queries internally and converts to/from domain Pydantic models. `PiccoloDTO` is used only in the presentation layer if bypassing the service layer for simple CRUD. Upper layers never import Piccolo directly.

## Docs

<https://docs.litestar.dev/2/usage/databases/piccolo.html>
