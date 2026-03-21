from litestar import Litestar
from litestar.di import Provide
from litestar.testing import TestClient

from api.todo.domain.models import TodoItem
from api.todo.presentation.controllers import TodoController


class FakeService:
    """Minimal fake satisfying TodoService Protocol."""

    def __init__(self) -> None:
        self._items: list[TodoItem] = []

    def get_all(self, done: bool | None = None) -> list[TodoItem]:
        if done is None:
            return list(self._items)
        return [i for i in self._items if i.done is done]

    def add(self, item: TodoItem) -> list[TodoItem]:
        self._items.append(item)
        return list(self._items)

    def update(self, item_title: str, item: TodoItem) -> list[TodoItem]:
        for idx, existing in enumerate(self._items):
            if existing.title == item_title:
                self._items[idx] = item
                return list(self._items)
        raise KeyError(f"Todo item '{item_title}' not found")

    def clear(self) -> None:
        self._items.clear()


def _create_test_client() -> TestClient[Litestar]:
    fake_service = FakeService()
    app = Litestar(
        route_handlers=[TodoController],
        dependencies={"service": Provide(lambda: fake_service, sync_to_thread=False)},
    )
    return TestClient(app, raise_server_exceptions=True)


def test_get_list_empty() -> None:
    with _create_test_client() as client:
        response = client.get("/")
        assert response.status_code == 200
        assert response.json() == []


def test_add_item() -> None:
    with _create_test_client() as client:
        response = client.post("/", json={"title": "Buy milk", "done": False})
        assert response.status_code == 201
        data = response.json()
        assert len(data) == 1
        assert data[0]["title"] == "Buy milk"
        assert data[0]["done"] is False


def test_get_list_after_add() -> None:
    with _create_test_client() as client:
        client.post("/", json={"title": "Task 1", "done": False})
        client.post("/", json={"title": "Task 2", "done": True})
        response = client.get("/")
        assert response.status_code == 200
        assert len(response.json()) == 2


def test_get_list_filter_done() -> None:
    with _create_test_client() as client:
        client.post("/", json={"title": "Done", "done": True})
        client.post("/", json={"title": "Pending", "done": False})
        response = client.get("/", params={"done": True})
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["title"] == "Done"


def test_update_item() -> None:
    with _create_test_client() as client:
        client.post("/", json={"title": "Buy milk", "done": False})
        response = client.put("/Buy milk", json={"title": "Buy milk", "done": True})
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["done"] is True


def test_update_nonexistent_item_returns_404() -> None:
    with _create_test_client() as client:
        response = client.put(
            "/nonexistent", json={"title": "nonexistent", "done": False}
        )
        assert response.status_code == 404
