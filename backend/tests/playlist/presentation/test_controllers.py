"""Tests for playlist presentation controllers."""

from typing import Any
from unittest.mock import AsyncMock

import pytest
from litestar import Litestar
from litestar.di import Provide
from litestar.testing import AsyncTestClient

from api.playlist.domain.models import AgentMessage, SessionInfo
from api.playlist.presentation.controllers import PlaylistController


def _make_session_info(
    session_id: str = "sess-1",
    state: str = "conversing",
    topic: str = "vim motions",
    kind: str = "question",
    message: str = "Tell me more about your preferences",
) -> SessionInfo:
    return SessionInfo(
        session_id=session_id,
        state=state,  # type: ignore[arg-type]
        topic=topic,
        response=AgentMessage(kind=kind, message=message),  # type: ignore[arg-type]
    )


@pytest.fixture()
def mock_service() -> AsyncMock:
    return AsyncMock()


@pytest.fixture()
def app(mock_service: AsyncMock) -> Litestar:
    return Litestar(
        route_handlers=[PlaylistController],
        dependencies={
            "service": Provide(lambda: mock_service, sync_to_thread=False),
        },
    )


@pytest.fixture()
async def client(app: Litestar) -> Any:
    async with AsyncTestClient(app=app) as test_client:
        yield test_client


@pytest.mark.anyio()
async def test_create_session_returns_201(
    client: AsyncTestClient[Any],
    mock_service: AsyncMock,
) -> None:
    expected = _make_session_info()
    mock_service.create.return_value = expected

    response = await client.post(
        "/sessions",
        json={"topic": "vim motions"},
    )

    assert response.status_code == 201
    data = response.json()
    assert data["session_id"] == "sess-1"
    assert data["state"] == "conversing"
    assert data["response"]["kind"] == "question"


@pytest.mark.anyio()
async def test_create_session_rejects_empty_topic(
    client: AsyncTestClient[Any],
) -> None:
    response = await client.post(
        "/sessions",
        json={"topic": ""},
    )

    assert response.status_code == 400


@pytest.mark.anyio()
async def test_reply_returns_session_info(
    client: AsyncTestClient[Any],
    mock_service: AsyncMock,
) -> None:
    expected = _make_session_info()
    mock_service.reply.return_value = expected

    response = await client.post(
        "/sessions/sess-1/reply",
        json={"message": "I like tiny.nvim plugins"},
    )

    assert response.status_code == 200
    data = response.json()
    assert data["session_id"] == "sess-1"
    assert data["response"]["kind"] == "question"


@pytest.mark.anyio()
async def test_reply_unknown_session_returns_404(
    client: AsyncTestClient[Any],
    mock_service: AsyncMock,
) -> None:
    mock_service.reply.side_effect = KeyError("nonexistent")

    response = await client.post(
        "/sessions/nonexistent/reply",
        json={"message": "hello"},
    )

    assert response.status_code == 404


@pytest.mark.anyio()
async def test_get_session_returns_info(
    client: AsyncTestClient[Any],
    mock_service: AsyncMock,
) -> None:
    expected = _make_session_info()
    mock_service.get.return_value = expected

    response = await client.get("/sessions/sess-1")

    assert response.status_code == 200
    data = response.json()
    assert data["session_id"] == "sess-1"
    assert data["topic"] == "vim motions"


@pytest.mark.anyio()
async def test_get_unknown_session_returns_404(
    client: AsyncTestClient[Any],
    mock_service: AsyncMock,
) -> None:
    mock_service.get.side_effect = KeyError("nonexistent")

    response = await client.get("/sessions/nonexistent")

    assert response.status_code == 404
