from api.todo.domain.models import TodoItem


def test_todo_item_creation() -> None:
    item = TodoItem(title="Buy milk", done=False)
    assert item.title == "Buy milk"
    assert item.done is False


def test_todo_item_done_flag() -> None:
    item = TodoItem(title="Walk dog", done=True)
    assert item.done is True


def test_todo_item_is_immutable() -> None:
    """TodoItem should be a frozen Pydantic model."""
    import pytest

    item = TodoItem(title="Test", done=False)
    with pytest.raises(Exception):
        item.title = "Changed"  # type: ignore[misc]
