from api.todo.domain.models import TodoItem
from api.todo.application.services import TodoService


class FakeRepository:
    """Minimal fake satisfying TodoRepositoryProtocol."""

    def __init__(self) -> None:
        self._items: list[TodoItem] = []

    def get_all(self, done: bool | None = None) -> list[TodoItem]:
        if done is None:
            return list(self._items)
        return [i for i in self._items if i.done is done]

    def add(self, todo: TodoItem) -> list[TodoItem]:
        self._items.append(todo)
        return list(self._items)

    def update(self, todo_title: str, todo: TodoItem) -> list[TodoItem]:
        for idx, existing in enumerate(self._items):
            if existing.title == todo_title:
                self._items[idx] = todo
                return list(self._items)
        raise KeyError(f"Todo item '{todo_title}' not found")

    def clear(self) -> None:
        self._items.clear()


def test_service_get_all_delegates_to_repository() -> None:
    repo = FakeRepository()
    repo.add(TodoItem(title="Task", done=False))
    service = TodoService(repository=repo)
    result = service.get_all()
    assert len(result) == 1
    assert result[0].title == "Task"


def test_service_get_all_with_filter() -> None:
    repo = FakeRepository()
    repo.add(TodoItem(title="Done", done=True))
    repo.add(TodoItem(title="Pending", done=False))
    service = TodoService(repository=repo)
    assert len(service.get_all(done=True)) == 1


def test_service_add_delegates_to_repository() -> None:
    repo = FakeRepository()
    service = TodoService(repository=repo)
    result = service.add(TodoItem(title="New", done=False))
    assert len(result) == 1
    assert result[0].title == "New"


def test_service_update_delegates_to_repository() -> None:
    repo = FakeRepository()
    repo.add(TodoItem(title="Old", done=False))
    service = TodoService(repository=repo)
    result = service.update("Old", TodoItem(title="Old", done=True))
    assert result[0].done is True
