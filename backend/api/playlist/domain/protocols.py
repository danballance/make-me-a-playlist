"""Playlist domain protocols — stubs for test creation phase."""

from typing import Protocol, runtime_checkable

from api.playlist.domain.models import SessionInfo


@runtime_checkable
class SessionRepositoryProtocol(Protocol):
    async def create(self, topic: str) -> SessionInfo: ...

    async def reply(self, session_id: str, message: str) -> SessionInfo: ...

    async def get(self, session_id: str) -> SessionInfo: ...
