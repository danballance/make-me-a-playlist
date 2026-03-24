# ADR-001: Session-Based Recommender API

## Status

Accepted

## Date

2026-03-24

## Context

The `recommender` library provides a `RecommendationSession` class that maintains conversation state internally. The session is an async context manager with `start()` and `reply()` methods. The agent asks 2-4 clarifying questions before performing a YouTube search and returning results.

We needed a way to expose this stateful, multi-turn conversation over a stateless HTTP API for the React frontend.

## Decision

We use an in-memory session store where the backend holds active `RecommendationSession` instances keyed by UUID. Three REST endpoints manage the lifecycle:

- **POST `/sessions`** — Creates a new session, calls `session.start()`, returns the first agent question with a `session_id`.
- **POST `/sessions/{session_id}/reply`** — Forwards a user reply to the stored session, returns the next question or final results.
- **GET `/sessions/{session_id}`** — Retrieves the full conversation history and current state for re-rendering.

The `RecommenderSessionProtocol` and `RecommenderSessionFactoryProtocol` abstract the recommender library behind domain protocols, allowing the service layer to be tested with fakes without making real API calls.

## Consequences

### Positive

- Simple to implement — no database, WebSocket, or SSE infrastructure needed for MVP.
- Clean separation between the recommender library and the HTTP API via protocol abstractions.
- Service is fully testable with fake sessions.

### Negative

- Sessions are stored in memory — lost on server restart.
- No horizontal scaling (sessions are pinned to a single process).
- Long-running sessions may leak memory if the user abandons the conversation.

### Future Considerations

- Add a TTL/cleanup mechanism for abandoned sessions.
- Consider persisting session state to a database for durability.
- Consider SSE or WebSocket for streaming progress events during the search phase.
