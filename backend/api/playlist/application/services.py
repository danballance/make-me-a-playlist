"""Playlist application services — stubs for test creation phase."""

from api.playlist.domain.models import SessionInfo
from api.playlist.domain.protocols import SessionRepositoryProtocol


class PlaylistService:
    """Stub — not yet implemented."""

    def __init__(self, repository: SessionRepositoryProtocol) -> None:
        raise NotImplementedError

    async def create(self, topic: str) -> SessionInfo:
        raise NotImplementedError

    async def reply(self, session_id: str, message: str) -> SessionInfo:
        raise NotImplementedError

    async def get(self, session_id: str) -> SessionInfo:
        raise NotImplementedError
