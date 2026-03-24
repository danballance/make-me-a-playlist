"""Tests for playlist domain models."""

import pytest
from pydantic import ValidationError

from api.playlist.domain.models import (
    ChatMessage,
    CreateSessionRequest,
    ReplyRequest,
    SessionDetailResponse,
    SessionResponse,
    SessionState,
)


# --- ChatMessage ---


def test_chat_message_agent_role() -> None:
    msg = ChatMessage(role="agent", content="Hello!")
    assert msg.role == "agent"
    assert msg.content == "Hello!"


def test_chat_message_user_role() -> None:
    msg = ChatMessage(role="user", content="Hi there")
    assert msg.role == "user"
    assert msg.content == "Hi there"


def test_chat_message_invalid_role() -> None:
    with pytest.raises(ValidationError):
        ChatMessage(role="system", content="nope")  # type: ignore[arg-type]


# --- CreateSessionRequest ---


def test_create_session_request_valid() -> None:
    req = CreateSessionRequest(topic="advanced vim motions")
    assert req.topic == "advanced vim motions"


def test_create_session_request_empty_topic() -> None:
    with pytest.raises(ValidationError):
        CreateSessionRequest(topic="")


def test_create_session_request_whitespace_only_topic() -> None:
    with pytest.raises(ValidationError):
        CreateSessionRequest(topic="   ")


# --- ReplyRequest ---


def test_reply_request_valid() -> None:
    req = ReplyRequest(message="I like plugins")
    assert req.message == "I like plugins"


def test_reply_request_empty_message() -> None:
    with pytest.raises(ValidationError):
        ReplyRequest(message="")


def test_reply_request_whitespace_only_message() -> None:
    with pytest.raises(ValidationError):
        ReplyRequest(message="   ")


# --- SessionState ---


def test_session_state_conversing() -> None:
    state = SessionState(
        session_id="abc-123",
        topic="vim motions",
        messages=[ChatMessage(role="agent", content="What kind?")],
        status="conversing",
        playlist=None,
    )
    assert state.status == "conversing"
    assert state.playlist is None
    assert len(state.messages) == 1


def test_session_state_complete_without_playlist() -> None:
    """A complete session should still be valid without playlist for model flexibility."""
    state = SessionState(
        session_id="abc-123",
        topic="vim motions",
        messages=[],
        status="complete",
        playlist=None,
    )
    assert state.status == "complete"


def test_session_state_invalid_status() -> None:
    with pytest.raises(ValidationError):
        SessionState(
            session_id="abc-123",
            topic="vim motions",
            messages=[],
            status="invalid",  # type: ignore[arg-type]
            playlist=None,
        )


# --- SessionResponse ---


def test_session_response_question() -> None:
    resp = SessionResponse(
        session_id="abc-123",
        message=ChatMessage(role="agent", content="What kind of videos?"),
        status="conversing",
        playlist=None,
    )
    assert resp.status == "conversing"
    assert resp.message.role == "agent"


def test_session_response_serialization() -> None:
    resp = SessionResponse(
        session_id="abc-123",
        message=ChatMessage(role="agent", content="What kind?"),
        status="conversing",
        playlist=None,
    )
    data = resp.model_dump()
    assert data["session_id"] == "abc-123"
    assert data["message"]["role"] == "agent"
    assert data["message"]["content"] == "What kind?"
    assert data["status"] == "conversing"
    assert data["playlist"] is None


# --- SessionDetailResponse ---


def test_session_detail_response() -> None:
    detail = SessionDetailResponse(
        session_id="abc-123",
        topic="vim motions",
        messages=[
            ChatMessage(role="agent", content="What kind?"),
            ChatMessage(role="user", content="Plugins"),
        ],
        status="conversing",
        playlist=None,
    )
    assert detail.topic == "vim motions"
    assert len(detail.messages) == 2
    assert detail.messages[0].role == "agent"
    assert detail.messages[1].role == "user"


def test_session_detail_response_serialization() -> None:
    detail = SessionDetailResponse(
        session_id="abc-123",
        topic="vim",
        messages=[],
        status="conversing",
        playlist=None,
    )
    data = detail.model_dump()
    assert data["session_id"] == "abc-123"
    assert data["topic"] == "vim"
    assert data["messages"] == []
