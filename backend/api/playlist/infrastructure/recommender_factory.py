"""Default recommender session factory using the recommender library."""

from recommender.models import SessionResponse as RecommenderResponse
from recommender.providers import ProviderConfig
from recommender.session import RecommendationSession

from api.playlist.domain.protocols import RecommenderSessionProtocol


class DefaultRecommenderSession(RecommenderSessionProtocol):
    """Wraps a RecommendationSession to implement the protocol."""

    def __init__(self, session: RecommendationSession) -> None:
        self._session = session

    async def start(self) -> RecommenderResponse:
        return await self._session.start()

    async def reply(self, answer: str) -> RecommenderResponse:
        return await self._session.reply(answer)

    async def close(self) -> None:
        await self._session.__aexit__(None, None, None)


class DefaultRecommenderSessionFactory:
    """Creates recommender sessions with the configured LLM provider."""

    def __init__(self, provider: ProviderConfig) -> None:
        self._provider = provider

    async def create(self, topic: str) -> DefaultRecommenderSession:
        session = RecommendationSession(topic=topic, provider=self._provider)
        await session.__aenter__()
        return DefaultRecommenderSession(session)
