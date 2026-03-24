"""Tests for the PlaylistController."""

from typing import Literal

from litestar import Litestar
from litestar.di import Provide
from litestar.testing import TestClient

from api.playlist.application.protocols import PlaylistServiceProtocol
from api.playlist.domain.exceptions import SessionCompleteError, SessionNotFoundError
from api.playlist.domain.models import (
    ChatMessage,
    SessionDetailResponse,
    SessionResponse,
)
from api.playlist.presentation.controllers import PlaylistController
from recommender.models import PlaylistResult, RecommendedVideo


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


def _make_playlist() -> PlaylistResult:
    return PlaylistResult(
        kind="result",
        topic="vim",
        videos=[_make_video(i) for i in range(1, 6)],
        overall_rationale="Great videos.",
    )


class FakePlaylistService:
    """Fake service for controller tests."""

    def __init__(self) -> None:
        self._create_response: SessionResponse | None = None
        self._reply_response: SessionResponse | None = None
        self._detail_response: SessionDetailResponse | None = None
        self._create_error: Exception | None = None
        self._reply_error: Exception | None = None
        self._detail_error: Exception | None = None

    def set_create_response(self, response: SessionResponse) -> None:
        self._create_response = response

    def set_reply_response(self, response: SessionResponse) -> None:
        self._reply_response = response

    def set_detail_response(self, response: SessionDetailResponse) -> None:
        self._detail_response = response

    def set_create_error(self, error: Exception) -> None:
        self._create_error = error

    def set_reply_error(self, error: Exception) -> None:
        self._reply_error = error

    def set_detail_error(self, error: Exception) -> None:
        self._detail_error = error

    async def create_session(self, topic: str) -> SessionResponse:
        if self._create_error:
            raise self._create_error
        assert self._create_response is not None
        return self._create_response

    async def reply(self, session_id: str, message: str) -> SessionResponse:
        if self._reply_error:
            raise self._reply_error
        assert self._reply_response is not None
        return self._reply_response

    async def get_session(self, session_id: str) -> SessionDetailResponse:
        if self._detail_error:
            raise self._detail_error
        assert self._detail_response is not None
        return self._detail_response


def _create_test_client(
    fake: FakePlaylistService,
) -> TestClient[Litestar]:
    app = Litestar(
        route_handlers=[PlaylistController],
        dependencies={
            "playlist_service": Provide(
                lambda: fake,
                sync_to_thread=False,
            ),
        },
    )
    return TestClient(app, raise_server_exceptions=False)


# --- POST /sessions ---


def test_create_session_returns_201() -> None:
    fake = FakePlaylistService()
    fake.set_create_response(
        SessionResponse(
            session_id="sess-1",
            message=ChatMessage(role="agent", content="What kind?"),
            status="conversing",
            playlist=None,
        ),
    )
    with _create_test_client(fake) as client:
        response = client.post("/sessions", json={"topic": "vim motions"})
        assert response.status_code == 201
        body = response.json()
        assert body["session_id"] == "sess-1"
        assert body["message"]["role"] == "agent"
        assert body["message"]["content"] == "What kind?"
        assert body["status"] == "conversing"


def test_create_session_empty_topic_returns_400() -> None:
    fake = FakePlaylistService()
    with _create_test_client(fake) as client:
        response = client.post("/sessions", json={"topic": ""})
        assert response.status_code == 400


# --- POST /sessions/{session_id}/reply ---


def test_reply_returns_200_with_question() -> None:
    fake = FakePlaylistService()
    fake.set_reply_response(
        SessionResponse(
            session_id="sess-1",
            message=ChatMessage(role="agent", content="Tell me more"),
            status="conversing",
            playlist=None,
        ),
    )
    with _create_test_client(fake) as client:
        response = client.post(
            "/sessions/sess-1/reply",
            json={"message": "I like plugins"},
        )
        assert response.status_code == 200
        body = response.json()
        assert body["message"]["content"] == "Tell me more"
        assert body["status"] == "conversing"


def test_reply_returns_200_with_result() -> None:
    playlist = _make_playlist()
    fake = FakePlaylistService()
    fake.set_reply_response(
        SessionResponse(
            session_id="sess-1",
            message=ChatMessage(role="agent", content="Here are your results"),
            status="complete",
            playlist=playlist,
        ),
    )
    with _create_test_client(fake) as client:
        response = client.post(
            "/sessions/sess-1/reply",
            json={"message": "Go ahead"},
        )
        assert response.status_code == 200
        body = response.json()
        assert body["status"] == "complete"
        assert body["playlist"] is not None
        assert len(body["playlist"]["videos"]) == 5


def test_reply_nonexistent_session_returns_404() -> None:
    fake = FakePlaylistService()
    fake.set_reply_error(SessionNotFoundError("not found"))
    with _create_test_client(fake) as client:
        response = client.post(
            "/sessions/nonexistent/reply",
            json={"message": "hello"},
        )
        assert response.status_code == 404


def test_reply_completed_session_returns_409() -> None:
    fake = FakePlaylistService()
    fake.set_reply_error(SessionCompleteError("already done"))
    with _create_test_client(fake) as client:
        response = client.post(
            "/sessions/sess-1/reply",
            json={"message": "more"},
        )
        assert response.status_code == 409


# --- GET /sessions/{session_id} ---


def test_get_session_returns_200() -> None:
    fake = FakePlaylistService()
    fake.set_detail_response(
        SessionDetailResponse(
            session_id="sess-1",
            topic="vim motions",
            messages=[
                ChatMessage(role="agent", content="What kind?"),
                ChatMessage(role="user", content="Plugins"),
            ],
            status="conversing",
            playlist=None,
        ),
    )
    with _create_test_client(fake) as client:
        response = client.get("/sessions/sess-1")
        assert response.status_code == 200
        body = response.json()
        assert body["session_id"] == "sess-1"
        assert body["topic"] == "vim motions"
        assert len(body["messages"]) == 2


def test_get_session_nonexistent_returns_404() -> None:
    fake = FakePlaylistService()
    fake.set_detail_error(SessionNotFoundError("not found"))
    with _create_test_client(fake) as client:
        response = client.get("/sessions/nonexistent")
        assert response.status_code == 404
