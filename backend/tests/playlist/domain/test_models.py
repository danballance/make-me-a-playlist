"""Tests for playlist domain models."""

import pytest
from pydantic import ValidationError

from api.playlist.domain.models import (
    AgentMessage,
    CreateSessionRequest,
    PlaylistData,
    ReplyRequest,
    SessionInfo,
    VideoData,
)


# --- CreateSessionRequest ---


def test_create_session_request_valid() -> None:
    request = CreateSessionRequest(topic="advanced vim motions")
    assert request.topic == "advanced vim motions"


def test_create_session_request_rejects_empty_topic() -> None:
    with pytest.raises(ValidationError):
        CreateSessionRequest(topic="")


def test_create_session_request_strips_whitespace() -> None:
    request = CreateSessionRequest(topic="  advanced vim motions  ")
    assert request.topic == "advanced vim motions"


# --- ReplyRequest ---


def test_reply_request_valid() -> None:
    request = ReplyRequest(message="I like tiny.nvim plugins")
    assert request.message == "I like tiny.nvim plugins"


def test_reply_request_rejects_empty_message() -> None:
    with pytest.raises(ValidationError):
        ReplyRequest(message="")


# --- VideoData ---


def test_video_data_all_fields() -> None:
    video = VideoData(
        video_id="abc123",
        url="https://youtube.com/watch?v=abc123",
        title="Vim Tips",
        channel="Neovim Craft",
        duration_secs=1182,
        view_count=6400,
        reason="Great overview of tiny.nvim",
        what_makes_it_interesting="Deep technical breakdown",
    )
    assert video.video_id == "abc123"
    assert video.title == "Vim Tips"
    assert video.duration_secs == 1182
    assert video.view_count == 6400


def test_video_data_optional_fields_default_to_none() -> None:
    video = VideoData(
        video_id="abc123",
        url="https://youtube.com/watch?v=abc123",
        title="Vim Tips",
        channel="Neovim Craft",
        reason="Great overview",
        what_makes_it_interesting="Deep breakdown",
    )
    assert video.duration_secs is None
    assert video.view_count is None


# --- PlaylistData ---


def test_playlist_data_valid() -> None:
    video = VideoData(
        video_id="abc123",
        url="https://youtube.com/watch?v=abc123",
        title="Vim Tips",
        channel="Neovim Craft",
        reason="Great overview",
        what_makes_it_interesting="Deep breakdown",
    )
    playlist = PlaylistData(
        topic="advanced vim motions",
        videos=[video],
        overall_rationale="Focused on lesser-known creators.",
    )
    assert playlist.topic == "advanced vim motions"
    assert len(playlist.videos) == 1
    assert playlist.overall_rationale == "Focused on lesser-known creators."


# --- AgentMessage ---


def test_agent_message_question() -> None:
    msg = AgentMessage(kind="question", message="What plugins interest you?")
    assert msg.kind == "question"
    assert msg.message == "What plugins interest you?"
    assert msg.playlist is None


def test_agent_message_result() -> None:
    video = VideoData(
        video_id="abc123",
        url="https://youtube.com/watch?v=abc123",
        title="Vim Tips",
        channel="Neovim Craft",
        reason="Great overview",
        what_makes_it_interesting="Deep breakdown",
    )
    playlist = PlaylistData(
        topic="vim",
        videos=[video],
        overall_rationale="Curated for you.",
    )
    msg = AgentMessage(kind="result", playlist=playlist)
    assert msg.kind == "result"
    assert msg.playlist is not None
    assert msg.playlist.topic == "vim"


def test_agent_message_rejects_invalid_kind() -> None:
    with pytest.raises(ValidationError):
        AgentMessage(kind="invalid", message="hello")  # type: ignore[arg-type]


# --- SessionInfo ---


def test_session_info_conversing() -> None:
    agent_msg = AgentMessage(kind="question", message="Tell me more")
    info = SessionInfo(
        session_id="sess-1",
        state="conversing",
        topic="vim motions",
        response=agent_msg,
    )
    assert info.session_id == "sess-1"
    assert info.state == "conversing"
    assert info.topic == "vim motions"
    assert info.response.kind == "question"


def test_session_info_completed() -> None:
    video = VideoData(
        video_id="abc123",
        url="https://youtube.com/watch?v=abc123",
        title="Vim Tips",
        channel="Neovim Craft",
        reason="Great overview",
        what_makes_it_interesting="Deep breakdown",
    )
    playlist = PlaylistData(
        topic="vim",
        videos=[video],
        overall_rationale="Curated.",
    )
    agent_msg = AgentMessage(kind="result", playlist=playlist)
    info = SessionInfo(
        session_id="sess-1",
        state="completed",
        topic="vim",
        response=agent_msg,
    )
    assert info.state == "completed"
    assert info.response.playlist is not None


def test_session_info_rejects_invalid_state() -> None:
    agent_msg = AgentMessage(kind="question", message="hello")
    with pytest.raises(ValidationError):
        SessionInfo(
            session_id="sess-1",
            state="invalid",  # type: ignore[arg-type]
            topic="vim",
            response=agent_msg,
        )
