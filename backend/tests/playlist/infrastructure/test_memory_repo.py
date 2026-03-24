"""Tests for the in-memory session repository."""

from api.playlist.domain.models import ChatMessage, SessionState
from api.playlist.infrastructure.memory_repo import InMemorySessionRepository


def _make_state(session_id: str = "sess-1", topic: str = "vim") -> SessionState:
    return SessionState(
        session_id=session_id,
        topic=topic,
        messages=[ChatMessage(role="agent", content="Hello!")],
        status="conversing",
        playlist=None,
    )


def test_create_and_get() -> None:
    repo = InMemorySessionRepository()
    state = _make_state()
    repo.create("sess-1", state)
    result = repo.get("sess-1")
    assert result is not None
    assert result.session_id == "sess-1"
    assert result.topic == "vim"


def test_get_returns_none_for_unknown_id() -> None:
    repo = InMemorySessionRepository()
    result = repo.get("nonexistent")
    assert result is None


def test_update_replaces_state() -> None:
    repo = InMemorySessionRepository()
    state = _make_state()
    repo.create("sess-1", state)

    updated = SessionState(
        session_id="sess-1",
        topic="vim",
        messages=[
            ChatMessage(role="agent", content="Hello!"),
            ChatMessage(role="user", content="Plugins please"),
        ],
        status="conversing",
        playlist=None,
    )
    repo.update("sess-1", updated)

    result = repo.get("sess-1")
    assert result is not None
    assert len(result.messages) == 2
    assert result.messages[1].content == "Plugins please"


def test_delete_removes_state() -> None:
    repo = InMemorySessionRepository()
    state = _make_state()
    repo.create("sess-1", state)
    repo.delete("sess-1")

    result = repo.get("sess-1")
    assert result is None


def test_delete_nonexistent_is_noop() -> None:
    repo = InMemorySessionRepository()
    repo.delete("nonexistent")  # Should not raise
