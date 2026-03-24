"""In-memory session repository."""

from api.playlist.domain.models import SessionState
from api.playlist.domain.protocols import SessionRepositoryProtocol


class InMemorySessionRepository(SessionRepositoryProtocol):
    def __init__(self) -> None:
        self._store: dict[str, SessionState] = {}

    def create(self, session_id: str, state: SessionState) -> None:
        self._store[session_id] = state

    def get(self, session_id: str) -> SessionState | None:
        return self._store.get(session_id)

    def update(self, session_id: str, state: SessionState) -> None:
        self._store[session_id] = state

    def delete(self, session_id: str) -> None:
        self._store.pop(session_id, None)
