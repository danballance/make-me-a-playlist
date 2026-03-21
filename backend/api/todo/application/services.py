from api.todo.application.protocols import TodoServiceProtocol
from api.todo.domain.models import TodoItem
from api.todo.domain.protocols import TodoRepositoryProtocol


class TodoService(TodoServiceProtocol):
    def __init__(self, repository: TodoRepositoryProtocol) -> None:
        self._repository: TodoRepositoryProtocol = repository

    def get_all(self, done: bool | None = None) -> list[TodoItem]:
        return self._repository.get_all(done)

    def add(self, todo: TodoItem) -> list[TodoItem]:
        return self._repository.add(todo)

    def update(self, todo_title: str, todo: TodoItem) -> list[TodoItem]:
        return self._repository.update(todo_title, todo)

    def clear(self) -> None:
        self._repository.clear()
