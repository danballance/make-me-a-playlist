---
name: recommender
description: Use when working on the recommender library — modifying the recommendation agent, search providers, CLI, or session API
---

## Overview

The recommender is an AI-powered YouTube playlist builder. Given a topic, it uses an LLM agent (via PydanticAI) to search multiple video providers, evaluate results, and curate a 5-video playlist. It can be used as an interactive CLI or as an imported Python library.

## Architecture

| Concept | Implementation |
|---------|---------------|
| Entry point (CLI) | `recommender/cli.py` — `recommend` command |
| Entry point (library) | `RecommendationSession` context manager |
| Agent | `PydanticAIAgent` — drives the LLM conversation and tool calls |
| LLM configuration | `ProviderConfig` factory methods (`.anthropic()`, `.openai()`, `.google()`, `.local()`) |
| Capability interfaces | `Protocol` classes in `recommender.protocols` — `VideoSearcher`, `WebSearcher`, `VideoEnricher`, `PageReader` |
| Search providers | Serper, SerpAPI, Brave, Exa — all normalise to `VideoResult` |
| Metadata enrichment | Supadata — fills missing duration/views for Exa results |
| Composite search | `CompositeVideoSearcher` — runs all searchers concurrently, deduplicates by video ID |
| Service wiring | `ServiceFactory` — creates HTTP client and agent with all built-in implementations |

## Key types

| Type | Module | Purpose |
|------|--------|---------|
| `ProviderConfig` | `recommender.providers` | LLM provider selection and configuration |
| `RecommendationSession` | `recommender.session` | High-level async session (start/reply loop) |
| `SessionResponse` | `recommender.models` | Response envelope (`kind="question"` or `kind="result"`) |
| `PlaylistResult` | `recommender.models` | Final playlist with topic, videos, and rationale |
| `RecommendedVideo` | `recommender.models` | Single video recommendation with reason |
| `VideoResult` | `recommender.sources.models` | Normalised search result from any provider |
| `ProgressEvent` | `recommender.models` | Search/evaluation progress callback payload |
| `PydanticAIAgent` | `recommender.agent` | Core agent accepting custom Protocol implementations |

## Sub-skills index

| Topic | File | When to use |
|-------|------|-------------|
| CLI | `cli.md` | Running the interactive terminal tool, options, output formats |
| Library API | `library.md` | Programmatic usage, custom implementations, wiring |
| Search Providers | `providers.md` | Provider internals, API shapes, field mapping, enrichment |

## Key docs links

- PydanticAI: <https://ai.pydantic.dev/>
- Serper: <https://serper.dev/api>
- SerpAPI: <https://serpapi.com/youtube-search-api>
- Brave Search: <https://api.search.brave.com/app/#/documentation>
- Exa: <https://docs.exa.ai/>
- Supadata: <https://supadata.ai/docs>
