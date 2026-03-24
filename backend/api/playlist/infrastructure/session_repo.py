"""Playlist infrastructure — stubs for test creation phase."""

from api.playlist.domain.models import SessionInfo


class InMemorySessionRepository:
    """Stub — not yet implemented."""

    async def create(self, topic: str) -> SessionInfo:
        raise NotImplementedError

    async def reply(self, session_id: str, message: str) -> SessionInfo:
        raise NotImplementedError

    async def get(self, session_id: str) -> SessionInfo:
        raise NotImplementedError
