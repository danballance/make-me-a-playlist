"""Playlist application protocols."""

from typing import Protocol, runtime_checkable

from api.playlist.domain.models import SessionDetailResponse, SessionResponse


@runtime_checkable
class PlaylistServiceProtocol(Protocol):
    async def create_session(self, topic: str) -> SessionResponse: ...

    async def reply(self, session_id: str, message: str) -> SessionResponse: ...

    async def get_session(self, session_id: str) -> SessionDetailResponse: ...
