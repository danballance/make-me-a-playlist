from litestar import Controller, delete, get, post, put
from litestar.exceptions import NotFoundException
from litestar.status_codes import HTTP_201_CREATED, HTTP_204_NO_CONTENT

from api.todo.application.protocols import TodoServiceProtocol
from api.todo.domain.models import TodoItem


class TodoController(Controller):
    path = "/"

    @get()
    async def get_list(
        self,
        service: TodoServiceProtocol,
        done: bool | None = None,
    ) -> list[TodoItem]:
        return service.get_all(done)

    @post(status_code=HTTP_201_CREATED)
    async def add_item(
        self,
        service: TodoServiceProtocol,
        data: TodoItem,  # noqa: WPS110
    ) -> list[TodoItem]:
        return service.add(data)

    @put("/{todo_title:str}", raises=[NotFoundException])
    async def update_item(
        self,
        service: TodoServiceProtocol,
        todo_title: str,
        data: TodoItem,  # noqa: WPS110
    ) -> list[TodoItem]:
        try:
            return service.update(todo_title, data)
        except KeyError as err:
            raise NotFoundException(detail=f"Todo '{todo_title}' not found") from err

    @delete(status_code=HTTP_204_NO_CONTENT)
    async def clear_items(
        self,
        service: TodoServiceProtocol,
    ) -> None:
        service.clear()
