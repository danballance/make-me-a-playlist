from api.todo.domain.models import TodoItem
from api.todo.infrastructure.memory_repo import InMemoryTodoRepository


def test_get_all_empty() -> None:
    repo = InMemoryTodoRepository()
    assert repo.get_all() == []


def test_add_item() -> None:
    repo = InMemoryTodoRepository()
    result = repo.add(TodoItem(title="Buy milk", done=False))
    assert len(result) == 1
    assert result[0].title == "Buy milk"
    assert result[0].done is False


def test_add_multiple_items() -> None:
    repo = InMemoryTodoRepository()
    repo.add(TodoItem(title="First", done=False))
    result = repo.add(TodoItem(title="Second", done=True))
    assert len(result) == 2


def test_get_all_filter_done() -> None:
    repo = InMemoryTodoRepository()
    repo.add(TodoItem(title="Done task", done=True))
    repo.add(TodoItem(title="Pending task", done=False))
    done_items = repo.get_all(done=True)
    assert len(done_items) == 1
    assert done_items[0].title == "Done task"


def test_get_all_filter_not_done() -> None:
    repo = InMemoryTodoRepository()
    repo.add(TodoItem(title="Done task", done=True))
    repo.add(TodoItem(title="Pending task", done=False))
    pending_items = repo.get_all(done=False)
    assert len(pending_items) == 1
    assert pending_items[0].title == "Pending task"


def test_get_all_no_filter_returns_all() -> None:
    repo = InMemoryTodoRepository()
    repo.add(TodoItem(title="One", done=True))
    repo.add(TodoItem(title="Two", done=False))
    assert len(repo.get_all()) == 2


def test_update_item() -> None:
    repo = InMemoryTodoRepository()
    repo.add(TodoItem(title="Buy milk", done=False))
    result = repo.update("Buy milk", TodoItem(title="Buy milk", done=True))
    assert len(result) == 1
    assert result[0].done is True


def test_update_item_title() -> None:
    repo = InMemoryTodoRepository()
    repo.add(TodoItem(title="Old title", done=False))
    result = repo.update("Old title", TodoItem(title="New title", done=False))
    assert len(result) == 1
    assert result[0].title == "New title"


def test_update_nonexistent_item_raises() -> None:
    import pytest

    repo = InMemoryTodoRepository()
    with pytest.raises(KeyError):
        repo.update("Nonexistent", TodoItem(title="X", done=False))


def test_returned_list_is_a_copy() -> None:
    """Mutating the returned list should not affect internal state."""
    repo = InMemoryTodoRepository()
    repo.add(TodoItem(title="Item", done=False))
    result = repo.get_all()
    result.clear()
    assert len(repo.get_all()) == 1
