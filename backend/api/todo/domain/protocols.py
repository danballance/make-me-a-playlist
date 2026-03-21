from typing import Protocol, runtime_checkable

from api.todo.domain.models import TodoItem


@runtime_checkable
class TodoRepositoryProtocol(Protocol):
    def get_all(self, done: bool | None = None) -> list[TodoItem]: ...

    def add(self, todo: TodoItem) -> list[TodoItem]: ...

    def update(self, todo_title: str, todo: TodoItem) -> list[TodoItem]: ...

    def clear(self) -> None: ...
