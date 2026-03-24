"""Playlist domain models — stubs for test creation phase.

These stubs define field shapes so the type checker is satisfied,
but validation logic (e.g. reject empty strings, strip whitespace,
restrict Literal kinds) is not yet implemented. Tests targeting
that validation will fail until the Implementation phase.
"""

from typing import Literal

from pydantic import BaseModel


class CreateSessionRequest(BaseModel):
    topic: str


class ReplyRequest(BaseModel):
    message: str


class VideoData(BaseModel):
    video_id: str
    url: str
    title: str
    channel: str
    duration_secs: int | None = None
    view_count: int | None = None
    reason: str
    what_makes_it_interesting: str


class PlaylistData(BaseModel):
    topic: str
    videos: list[VideoData]
    overall_rationale: str


class AgentMessage(BaseModel):
    kind: Literal["question", "result"]
    message: str | None = None
    playlist: PlaylistData | None = None


class SessionInfo(BaseModel):
    session_id: str
    state: Literal["conversing", "completed"]
    topic: str
    response: AgentMessage
