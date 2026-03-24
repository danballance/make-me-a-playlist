"""Playlist domain protocols."""

from typing import Protocol, runtime_checkable

from recommender.models import SessionResponse as RecommenderResponse

from api.playlist.domain.models import SessionState


@runtime_checkable
class SessionRepositoryProtocol(Protocol):
    def create(self, session_id: str, state: SessionState) -> None: ...

    def get(self, session_id: str) -> SessionState | None: ...

    def update(self, session_id: str, state: SessionState) -> None: ...

    def delete(self, session_id: str) -> None: ...


@runtime_checkable
class RecommenderSessionProtocol(Protocol):
    async def start(self) -> RecommenderResponse: ...

    async def reply(self, answer: str) -> RecommenderResponse: ...

    async def close(self) -> None: ...


@runtime_checkable
class RecommenderSessionFactoryProtocol(Protocol):
    async def create(self, topic: str) -> RecommenderSessionProtocol: ...
