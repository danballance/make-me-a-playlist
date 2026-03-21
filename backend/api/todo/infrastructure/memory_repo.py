from api.todo.domain.models import TodoItem
from api.todo.domain.protocols import TodoRepositoryProtocol


class InMemoryTodoRepository(TodoRepositoryProtocol):
    def __init__(self) -> None:
        self._todos: list[TodoItem] = []

    def get_all(self, done: bool | None = None) -> list[TodoItem]:
        if done is None:
            return list(self._todos)
        return [todo for todo in self._todos if todo.done is done]

    def add(self, todo: TodoItem) -> list[TodoItem]:
        self._todos.append(todo)
        return list(self._todos)

    def update(self, todo_title: str, todo: TodoItem) -> list[TodoItem]:
        for index, existing in enumerate(self._todos):
            if existing.title == todo_title:
                self._todos[index] = todo
                return list(self._todos)
        raise KeyError(f"Todo '{todo_title}' not found")

    def clear(self) -> None:
        self._todos.clear()
