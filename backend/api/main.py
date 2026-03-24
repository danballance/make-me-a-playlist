from litestar import Litestar, get
from litestar.di import Provide
from litestar.logging import LoggingConfig
from litestar.plugins.pydantic import PydanticInitPlugin
from recommender.providers import ProviderConfig

from api.playlist.application.services import PlaylistService
from api.playlist.infrastructure.memory_repo import InMemorySessionRepository
from api.playlist.infrastructure.recommender_factory import (
    DefaultRecommenderSessionFactory,
)
from api.playlist.presentation.controllers import PlaylistController
from api.todo.application.services import TodoService
from api.todo.infrastructure.memory_repo import InMemoryTodoRepository
from api.todo.presentation.controllers import TodoController


@get("/health", exclude_from_auth=True)
async def health_check() -> dict[str, str]:
    return {"status": "ok"}


def _create_playlist_service() -> PlaylistService:
    return PlaylistService(
        repository=InMemorySessionRepository(),
        session_factory=DefaultRecommenderSessionFactory(
            provider=ProviderConfig.anthropic(),
        ),
    )


def create_app() -> Litestar:
    todo_service = TodoService(repository=InMemoryTodoRepository())
    playlist_service = _create_playlist_service()

    logging_config = LoggingConfig(
        root={"level": "DEBUG", "handlers": ["queue_listener"]},
        formatters={
            "standard": {
                "format": "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
            }
        },
        log_exceptions="always",
    )

    return Litestar(
        route_handlers=[TodoController, PlaylistController, health_check],
        dependencies={
            "service": Provide(lambda: todo_service, sync_to_thread=False),
            "playlist_service": Provide(
                lambda: playlist_service,
                sync_to_thread=False,
            ),
        },
        plugins=[PydanticInitPlugin(validate_strict=True)],
        logging_config=logging_config,
    )


app = create_app()
