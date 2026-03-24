"""Playlist application service."""

import uuid

from api.playlist.domain.exceptions import SessionCompleteError, SessionNotFoundError
from api.playlist.domain.models import (
    ChatMessage,
    SessionDetailResponse,
    SessionResponse,
    SessionState,
)
from api.playlist.domain.protocols import (
    RecommenderSessionFactoryProtocol,
    RecommenderSessionProtocol,
    SessionRepositoryProtocol,
)


class PlaylistService:
    def __init__(
        self,
        repository: SessionRepositoryProtocol,
        session_factory: RecommenderSessionFactoryProtocol,
    ) -> None:
        self._repository = repository
        self._session_factory = session_factory
        self._active_sessions: dict[str, RecommenderSessionProtocol] = {}

    async def create_session(self, topic: str) -> SessionResponse:
        session_id = str(uuid.uuid4())
        recommender_session = await self._session_factory.create(topic)
        self._active_sessions[session_id] = recommender_session

        recommender_response = await recommender_session.start()

        agent_message = ChatMessage(
            role="agent",
            content=recommender_response.message or "",
        )
        state = SessionState(
            session_id=session_id,
            topic=topic,
            messages=[agent_message],
            status="conversing",
        )
        self._repository.create(session_id, state)

        return SessionResponse(
            session_id=session_id,
            message=agent_message,
            status="conversing",
        )

    async def reply(self, session_id: str, message: str) -> SessionResponse:
        state = self._repository.get(session_id)
        if state is None:
            raise SessionNotFoundError(f"Session '{session_id}' not found")

        if state.status == "complete":
            raise SessionCompleteError(f"Session '{session_id}' is already complete")

        user_message = ChatMessage(role="user", content=message)
        state.messages.append(user_message)

        recommender_session = self._active_sessions.get(session_id)
        if recommender_session is None:
            raise SessionNotFoundError(
                f"Active recommender session '{session_id}' not found"
            )

        recommender_response = await recommender_session.reply(message)

        if recommender_response.kind == "question":
            agent_message = ChatMessage(
                role="agent",
                content=recommender_response.message or "",
            )
            state.messages.append(agent_message)
            self._repository.update(session_id, state)

            return SessionResponse(
                session_id=session_id,
                message=agent_message,
                status="conversing",
            )

        state.status = "complete"
        state.playlist = recommender_response.playlist
        self._repository.update(session_id, state)

        await recommender_session.close()
        self._active_sessions.pop(session_id, None)

        agent_message = ChatMessage(
            role="agent",
            content="Here are your results",
        )

        return SessionResponse(
            session_id=session_id,
            message=agent_message,
            status="complete",
            playlist=recommender_response.playlist,
        )

    async def get_session(self, session_id: str) -> SessionDetailResponse:
        state = self._repository.get(session_id)
        if state is None:
            raise SessionNotFoundError(f"Session '{session_id}' not found")

        return SessionDetailResponse(
            session_id=state.session_id,
            topic=state.topic,
            messages=state.messages,
            status=state.status,
            playlist=state.playlist,
        )
