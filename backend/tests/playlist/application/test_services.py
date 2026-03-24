"""Tests for the PlaylistService."""

import asyncio
from typing import Literal

import pytest

from api.playlist.application.services import PlaylistService
from api.playlist.domain.exceptions import SessionCompleteError, SessionNotFoundError
from api.playlist.domain.models import ChatMessage, SessionState
from api.playlist.domain.protocols import (
    RecommenderSessionFactoryProtocol,
    RecommenderSessionProtocol,
    SessionRepositoryProtocol,
)
from recommender.models import (
    PlaylistResult,
    RecommendedVideo,
)
from recommender.models import (
    SessionResponse as RecommenderResponse,
)


def _make_video(index: int) -> RecommendedVideo:
    return RecommendedVideo(
        video_id=f"vid-{index}",
        url=f"https://youtube.com/watch?v=vid-{index}",
        title=f"Video {index}",
        channel=f"Channel {index}",
        duration_secs=600,
        view_count=1000,
        reason=f"Reason {index}",
        what_makes_it_interesting=f"Interesting {index}",
    )


def _make_playlist_result() -> PlaylistResult:
    return PlaylistResult(
        kind="result",
        topic="vim motions",
        videos=[_make_video(i) for i in range(1, 6)],
        overall_rationale="Great selection of vim content.",
    )


class FakeRecommenderSession:
    """Fake recommender session for testing."""

    def __init__(
        self,
        responses: list[RecommenderResponse],
    ) -> None:
        self._responses = list(responses)
        self._call_index = 0
        self.closed = False

    async def start(self) -> RecommenderResponse:
        response = self._responses[self._call_index]
        self._call_index += 1
        return response

    async def reply(self, answer: str) -> RecommenderResponse:
        response = self._responses[self._call_index]
        self._call_index += 1
        return response

    async def close(self) -> None:
        self.closed = True


class FakeRecommenderSessionFactory:
    """Fake factory that returns preconfigured sessions."""

    def __init__(self, session: FakeRecommenderSession) -> None:
        self._session = session

    async def create(self, topic: str) -> FakeRecommenderSession:
        return self._session


class FakeSessionRepository:
    """In-memory fake for testing."""

    def __init__(self) -> None:
        self._store: dict[str, SessionState] = {}

    def create(self, session_id: str, state: SessionState) -> None:
        self._store[session_id] = state

    def get(self, session_id: str) -> SessionState | None:
        return self._store.get(session_id)

    def update(self, session_id: str, state: SessionState) -> None:
        self._store[session_id] = state

    def delete(self, session_id: str) -> None:
        self._store.pop(session_id, None)


def _run(coro):  # noqa: ANN001, ANN202
    return asyncio.run(coro)


def _make_service(
    responses: list[RecommenderResponse],
) -> tuple[PlaylistService, FakeSessionRepository, FakeRecommenderSession]:
    fake_session = FakeRecommenderSession(responses)
    factory = FakeRecommenderSessionFactory(fake_session)
    repo = FakeSessionRepository()
    service = PlaylistService(repository=repo, session_factory=factory)
    return service, repo, fake_session


# --- create_session ---


def test_create_session_returns_session_id_and_question() -> None:
    question_response = RecommenderResponse(
        kind="question",
        message="What kind of vim content?",
    )
    service, repo, _ = _make_service([question_response])

    result = _run(service.create_session("vim motions"))

    assert result.session_id is not None
    assert len(result.session_id) > 0
    assert result.message.role == "agent"
    assert result.message.content == "What kind of vim content?"
    assert result.status == "conversing"
    assert result.playlist is None


def test_create_session_stores_state_in_repo() -> None:
    question_response = RecommenderResponse(
        kind="question",
        message="What do you prefer?",
    )
    service, repo, _ = _make_service([question_response])

    result = _run(service.create_session("vim motions"))

    state = repo.get(result.session_id)
    assert state is not None
    assert state.topic == "vim motions"
    assert state.status == "conversing"
    assert len(state.messages) == 1
    assert state.messages[0].role == "agent"


# --- reply (question response) ---


def test_reply_with_question_response() -> None:
    responses = [
        RecommenderResponse(kind="question", message="First question"),
        RecommenderResponse(kind="question", message="Follow-up question"),
    ]
    service, repo, _ = _make_service(responses)

    create_result = _run(service.create_session("vim"))
    reply_result = _run(service.reply(create_result.session_id, "I like plugins"))

    assert reply_result.status == "conversing"
    assert reply_result.message.role == "agent"
    assert reply_result.message.content == "Follow-up question"
    assert reply_result.playlist is None


def test_reply_adds_user_and_agent_messages_to_state() -> None:
    responses = [
        RecommenderResponse(kind="question", message="First question"),
        RecommenderResponse(kind="question", message="Second question"),
    ]
    service, repo, _ = _make_service(responses)

    create_result = _run(service.create_session("vim"))
    _run(service.reply(create_result.session_id, "I like plugins"))

    state = repo.get(create_result.session_id)
    assert state is not None
    assert len(state.messages) == 3  # agent, user, agent
    assert state.messages[0].role == "agent"
    assert state.messages[1].role == "user"
    assert state.messages[1].content == "I like plugins"
    assert state.messages[2].role == "agent"


# --- reply (result response) ---


def test_reply_with_result_response() -> None:
    playlist = _make_playlist_result()
    responses = [
        RecommenderResponse(kind="question", message="What kind?"),
        RecommenderResponse(kind="result", playlist=playlist),
    ]
    service, repo, fake_session = _make_service(responses)

    create_result = _run(service.create_session("vim"))
    reply_result = _run(service.reply(create_result.session_id, "Everything"))

    assert reply_result.status == "complete"
    assert reply_result.playlist is not None
    assert len(reply_result.playlist.videos) == 5


def test_reply_with_result_sets_state_complete() -> None:
    playlist = _make_playlist_result()
    responses = [
        RecommenderResponse(kind="question", message="What kind?"),
        RecommenderResponse(kind="result", playlist=playlist),
    ]
    service, repo, _ = _make_service(responses)

    create_result = _run(service.create_session("vim"))
    _run(service.reply(create_result.session_id, "Everything"))

    state = repo.get(create_result.session_id)
    assert state is not None
    assert state.status == "complete"
    assert state.playlist is not None


def test_reply_with_result_closes_recommender_session() -> None:
    playlist = _make_playlist_result()
    responses = [
        RecommenderResponse(kind="question", message="What kind?"),
        RecommenderResponse(kind="result", playlist=playlist),
    ]
    service, repo, fake_session = _make_service(responses)

    create_result = _run(service.create_session("vim"))
    _run(service.reply(create_result.session_id, "Everything"))

    assert fake_session.closed is True


# --- reply error cases ---


def test_reply_to_nonexistent_session_raises() -> None:
    service, _, _ = _make_service([])

    with pytest.raises(SessionNotFoundError):
        _run(service.reply("nonexistent-id", "hello"))


def test_reply_to_completed_session_raises() -> None:
    playlist = _make_playlist_result()
    responses = [
        RecommenderResponse(kind="question", message="What kind?"),
        RecommenderResponse(kind="result", playlist=playlist),
    ]
    service, repo, _ = _make_service(responses)

    create_result = _run(service.create_session("vim"))
    _run(service.reply(create_result.session_id, "Everything"))

    with pytest.raises(SessionCompleteError):
        _run(service.reply(create_result.session_id, "More please"))


# --- get_session ---


def test_get_session_returns_detail() -> None:
    responses = [
        RecommenderResponse(kind="question", message="What kind?"),
    ]
    service, _, _ = _make_service(responses)

    create_result = _run(service.create_session("vim motions"))
    detail = _run(service.get_session(create_result.session_id))

    assert detail.session_id == create_result.session_id
    assert detail.topic == "vim motions"
    assert len(detail.messages) == 1
    assert detail.status == "conversing"


def test_get_session_nonexistent_raises() -> None:
    service, _, _ = _make_service([])

    with pytest.raises(SessionNotFoundError):
        _run(service.get_session("nonexistent"))
