"""Playlist presentation controllers."""

from litestar import Controller, get, post
from litestar.exceptions import HTTPException, NotFoundException
from litestar.status_codes import HTTP_200_OK, HTTP_201_CREATED

from api.playlist.application.protocols import PlaylistServiceProtocol
from api.playlist.domain.exceptions import SessionCompleteError, SessionNotFoundError
from api.playlist.domain.models import (
    CreateSessionRequest,
    ReplyRequest,
    SessionDetailResponse,
    SessionResponse,
)

CONFLICT_STATUS = 409


class PlaylistController(Controller):
    path = "/sessions"

    @post(status_code=HTTP_201_CREATED)
    async def create_session(
        self,
        playlist_service: PlaylistServiceProtocol,
        data: CreateSessionRequest,  # noqa: WPS110
    ) -> SessionResponse:
        return await playlist_service.create_session(data.topic)

    @post("/{session_id:str}/reply", status_code=HTTP_200_OK)
    async def reply(
        self,
        playlist_service: PlaylistServiceProtocol,
        session_id: str,
        data: ReplyRequest,  # noqa: WPS110
    ) -> SessionResponse:
        try:
            return await playlist_service.reply(session_id, data.message)
        except SessionNotFoundError as err:
            raise NotFoundException(detail=str(err)) from err
        except SessionCompleteError as err:
            raise HTTPException(
                status_code=CONFLICT_STATUS,
                detail=str(err),
            ) from err

    @get("/{session_id:str}")
    async def get_session(
        self,
        playlist_service: PlaylistServiceProtocol,
        session_id: str,
    ) -> SessionDetailResponse:
        try:
            return await playlist_service.get_session(session_id)
        except SessionNotFoundError as err:
            raise NotFoundException(detail=str(err)) from err
