"""Playlist domain models."""

from typing import Literal

from pydantic import BaseModel, Field, field_validator
from recommender.models import PlaylistResult


class ChatMessage(BaseModel, frozen=True):
    role: Literal["agent", "user"]
    content: str  # noqa: WPS110


class CreateSessionRequest(BaseModel, frozen=True):
    topic: str = Field(min_length=1)

    @field_validator("topic")
    @classmethod
    def topic_not_blank(cls, raw_topic: str) -> str:
        if not raw_topic.strip():
            raise ValueError("Topic must not be blank")
        return raw_topic


class ReplyRequest(BaseModel, frozen=True):
    message: str = Field(min_length=1)

    @field_validator("message")
    @classmethod
    def message_not_blank(cls, raw_message: str) -> str:
        if not raw_message.strip():
            raise ValueError("Message must not be blank")
        return raw_message


class SessionState(BaseModel):
    session_id: str
    topic: str
    messages: list[ChatMessage]
    status: Literal["conversing", "searching", "complete"]
    playlist: PlaylistResult | None = None


class SessionResponse(BaseModel, frozen=True):
    session_id: str
    message: ChatMessage
    status: Literal["conversing", "searching", "complete"]
    playlist: PlaylistResult | None = None


class SessionDetailResponse(BaseModel, frozen=True):
    session_id: str
    topic: str
    messages: list[ChatMessage]
    status: Literal["conversing", "searching", "complete"]
    playlist: PlaylistResult | None = None
