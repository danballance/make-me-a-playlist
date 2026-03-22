# Library Usage

Use the recommender package as an imported Python library to build curated YouTube playlists programmatically.

## Installation

```bash
pip install git+https://$GITHUB_TOKEN@github.com/danballance/recommender.git@v0.1.0
```

## Quick Start

```python
import asyncio
from recommender.providers import ProviderConfig
from recommender.session import RecommendationSession

async def main() -> None:
    async with RecommendationSession(
        topic="history of synthesizers",
        provider=ProviderConfig.anthropic(),
    ) as session:
        response = await session.start()

        while response.kind == "question":
            # The agent asks 2-4 clarifying questions before searching.
            # In a web app you'd return response.message to the client
            # and pass their answer back here.
            answer = input(f"{response.message} ")
            response = await session.reply(answer)

        # response.kind == "result"
        playlist = response.playlist
        for video in playlist.videos:
            print(f"{video.title} — {video.url}")
        print(playlist.overall_rationale)

asyncio.run(main())
```

## Configuration

### LLM Providers

Use `ProviderConfig` factory methods to select the backing LLM:

```python
from recommender.providers import ProviderConfig

ProviderConfig.anthropic(model="claude-opus-4-6", api_key="sk-...")  # default model
ProviderConfig.openai(model="gpt-4o")
ProviderConfig.google(model="gemini-2.0-flash")
ProviderConfig.local(model="llama3.2", base_url="http://localhost:11434")
```

API keys can be passed directly or read from environment variables:

| Provider | Env var |
|----------|---------|
| Anthropic | `ANTHROPIC_API_KEY` |
| OpenAI | `OPENAI_API_KEY` |
| Google | `GEMINI_API_KEY` |
| Local (Ollama) | _(none needed)_ |

### Search Provider API Keys

The search pipeline requires keys for the video search and enrichment providers. Set these as environment variables:

| Service | Env var | Purpose |
|---------|---------|---------|
| Serper | `SERPER_API_KEY` | Google Video SERP results |
| SerpAPI | `SERP_API_KEY` | YouTube search index |
| Brave | `BRAVE_API_KEY` | Video and web search |
| Exa | `EXA_API_KEY` | Semantic/neural search |
| Supadata | `SUPADATA_API_KEY` | YouTube metadata & transcripts |

All five are used concurrently by the default configuration. Missing keys will cause the corresponding provider to fail at search time.

### Debug Mode

Pass `debug=True` to `RecommendationSession` to log all HTTP requests and responses to stderr:

```python
RecommendationSession(topic="...", provider=provider, debug=True)
```

## Response Models

### SessionResponse

Every call to `session.start()` or `session.reply()` returns a `SessionResponse`:

```python
from recommender.models import SessionResponse

# kind="question" — the agent needs more information
response.kind      # "question"
response.message   # str — the question text

# kind="result" — the agent has built a playlist
response.kind      # "result"
response.playlist  # PlaylistResult
```

### PlaylistResult and RecommendedVideo

```python
from recommender.models import PlaylistResult, RecommendedVideo

playlist: PlaylistResult
playlist.topic               # str
playlist.videos              # list[RecommendedVideo] (exactly 5)
playlist.overall_rationale   # str

video: RecommendedVideo
video.video_id                 # str
video.url                      # str
video.title                    # str
video.channel                  # str
video.duration_secs            # int | None
video.view_count               # int | None
video.reason                   # str
video.what_makes_it_interesting  # str
```

### Progress Events

Track what the agent is doing by passing an `on_progress` callback:

```python
from recommender.models import ProgressEvent

def on_progress(event: ProgressEvent) -> None:
    # event.kind: "searching" | "reading_page" | "evaluating" | "reading_transcript"
    # event.detail: description of the current action
    print(f"[{event.kind}] {event.detail}")

response = await session.start(on_progress=on_progress)
response = await session.reply(answer, on_progress=on_progress)
```

## Extensibility — Custom Protocol Implementations

The package uses `Protocol` classes to define its capability interfaces. You can implement any of these to swap in your own providers.

### Protocol Interfaces

All protocols are defined in `recommender.protocols`:

```python
from recommender.protocols import VideoSearcher, WebSearcher, VideoEnricher, PageReader

class VideoSearcher(Protocol):
    async def search_videos(self, query: str, count: int = 20) -> list[VideoResult]: ...

class WebSearcher(Protocol):
    async def search_web(self, query: str, count: int = 10) -> list[WebResult]: ...

class VideoEnricher(Protocol):
    async def get_details(self, video_id: str) -> VideoDetails: ...
    async def get_transcript(self, video_id: str) -> str: ...

class PageReader(Protocol):
    async def read_page(self, url: str) -> str: ...
```

### Example: Custom Video Searcher

```python
from recommender.protocols import BaseService
from recommender.sources.models import VideoResult, Source

class MyCustomSearcher(BaseService):
    """Search videos using a custom data source."""

    async def search_videos(self, query: str, count: int = 20) -> list[VideoResult]:
        # Your implementation here.
        # Return a list of VideoResult instances.
        ...
```

`BaseService` is optional but gives you a per-instance `self._log` logger.

### Wiring Custom Implementations

Use `PydanticAIAgent` directly to inject your custom implementations:

```python
import httpx
from recommender.agent import PydanticAIAgent
from recommender.providers import ProviderConfig
from recommender.sources.providers.brave import BraveSearcher
from recommender.tools.supadata import SupadataEnricher
from recommender.tools.web import TrafilaturaReader

async def build_custom_agent() -> PydanticAIAgent:
    client = httpx.AsyncClient()
    return PydanticAIAgent(
        provider=ProviderConfig.anthropic(),
        video_searcher=MyCustomSearcher(),       # your custom searcher
        web_searcher=BraveSearcher(client),      # built-in
        video_enricher=SupadataEnricher(client),  # built-in
        page_reader=TrafilaturaReader(),          # built-in
    )
```

## Advanced: Direct Agent Usage

For full control over the dependency graph, bypass `RecommendationSession` and use `ServiceFactory` or construct the agent directly.

### Using ServiceFactory

```python
import httpx
from recommender.services import ServiceFactory
from recommender.providers import ProviderConfig

factory = ServiceFactory()
client = factory.create_client(debug=False)
agent = factory.create_agent(ProviderConfig.anthropic(), client)

# Use the agent directly — you manage conversation state yourself.
output = await agent.send("I want videos about jazz piano")
# output is QuestionResponse | PlaylistResult
```

Remember to close the client when done:

```python
await client.aclose()
```

### Built-in Implementations

| Class | Protocol(s) | Module |
|-------|-------------|--------|
| `SerperSearcher` | `VideoSearcher` | `recommender.sources.providers.serper` |
| `SerpAPISearcher` | `VideoSearcher` | `recommender.sources.providers.serpapi` |
| `BraveSearcher` | `VideoSearcher`, `WebSearcher` | `recommender.sources.providers.brave` |
| `ExaSearcher` | `VideoSearcher` | `recommender.sources.providers.exa` |
| `CompositeVideoSearcher` | `VideoSearcher` | `recommender.tools.search` |
| `SupadataEnricher` | `VideoEnricher` | `recommender.tools.supadata` |
| `TrafilaturaReader` | `PageReader` | `recommender.tools.web` |

All searchers except `ExaSearcher` take an `httpx.AsyncClient` as their constructor argument. `ExaSearcher` uses the Exa SDK internally. `CompositeVideoSearcher` takes a `list[VideoSearcher]` and runs them concurrently, deduplicating results by video ID.
