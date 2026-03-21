from litestar import Litestar, get
from litestar.di import Provide
from litestar.logging import LoggingConfig
from litestar.plugins.pydantic import PydanticInitPlugin

from api.todo.application.services import TodoService
from api.todo.infrastructure.memory_repo import InMemoryTodoRepository
from api.todo.presentation.controllers import TodoController


@get("/health", exclude_from_auth=True)
async def health_check() -> dict[str, str]:
    return {"status": "ok"}


def create_app() -> Litestar:
    repository = InMemoryTodoRepository()
    service = TodoService(repository=repository)

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
        route_handlers=[TodoController, health_check],
        dependencies={"service": Provide(lambda: service, sync_to_thread=False)},
        plugins=[PydanticInitPlugin(validate_strict=True)],
        logging_config=logging_config,
    )


app = create_app()
