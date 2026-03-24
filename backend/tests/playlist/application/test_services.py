"""Tests for playlist application service."""

from unittest.mock import AsyncMock

import pytest

from api.playlist.application.services import PlaylistService
from api.playlist.domain.models import AgentMessage, SessionInfo


def _make_session_info(
    session_id: str = "sess-1",
    state: str = "conversing",
    topic: str = "vim motions",
    kind: str = "question",
    message: str = "Tell me more",
) -> SessionInfo:
    return SessionInfo(
        session_id=session_id,
        state=state,  # type: ignore[arg-type]
        topic=topic,
        response=AgentMessage(kind=kind, message=message),  # type: ignore[arg-type]
    )


@pytest.fixture()
def mock_repository() -> AsyncMock:
    repo = AsyncMock()
    return repo


@pytest.fixture()
def service(mock_repository: AsyncMock) -> PlaylistService:
    return PlaylistService(repository=mock_repository)


@pytest.mark.anyio()
async def test_create_delegates_to_repository(
    service: PlaylistService,
    mock_repository: AsyncMock,
) -> None:
    expected = _make_session_info()
    mock_repository.create.return_value = expected

    result = await service.create(topic="vim motions")

    mock_repository.create.assert_awaited_once_with("vim motions")
    assert result == expected


@pytest.mark.anyio()
async def test_reply_delegates_to_repository(
    service: PlaylistService,
    mock_repository: AsyncMock,
) -> None:
    expected = _make_session_info()
    mock_repository.reply.return_value = expected

    result = await service.reply(session_id="sess-1", message="I like plugins")

    mock_repository.reply.assert_awaited_once_with("sess-1", "I like plugins")
    assert result == expected


@pytest.mark.anyio()
async def test_get_delegates_to_repository(
    service: PlaylistService,
    mock_repository: AsyncMock,
) -> None:
    expected = _make_session_info()
    mock_repository.get.return_value = expected

    result = await service.get(session_id="sess-1")

    mock_repository.get.assert_awaited_once_with("sess-1")
    assert result == expected
