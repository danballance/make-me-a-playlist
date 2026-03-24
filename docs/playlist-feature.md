# Playlist Feature

## Overview

The "Make Me A Playlist" feature allows users to describe a topic, have a multi-turn conversation with an AI agent to clarify their preferences, and receive a curated playlist of 5 YouTube hidden gem videos.

## User Flow

1. **Topic Input** (`/`) — User enters a topic (e.g., "advanced vim motions") and clicks "Find my playlist".
2. **Conversation** (`/conversation/:sessionId`) — The AI agent asks 2-4 clarifying questions. User replies in a chat interface.
3. **Results** (`/results/:sessionId`) — Once the agent has enough context, it searches YouTube and presents 5 curated video recommendations with rationales.

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/sessions` | Create a new session with a topic. Returns the first agent question. |
| POST | `/sessions/{session_id}/reply` | Send a user reply. Returns next question or final results. |
| GET | `/sessions/{session_id}` | Retrieve full session state (conversation history + results). |

### Request/Response Examples

**Create Session:**
```json
// POST /sessions
{ "topic": "advanced vim motions" }

// 201 Response
{
  "session_id": "uuid",
  "message": { "role": "agent", "content": "What kind of vim content...?" },
  "status": "conversing",
  "playlist": null
}
```

**Reply:**
```json
// POST /sessions/{id}/reply
{ "message": "I like tiny.nvim plugins" }

// 200 Response (question)
{
  "session_id": "uuid",
  "message": { "role": "agent", "content": "Any specific plugins?" },
  "status": "conversing",
  "playlist": null
}

// 200 Response (result)
{
  "session_id": "uuid",
  "message": { "role": "agent", "content": "Here are your results" },
  "status": "complete",
  "playlist": { "topic": "...", "videos": [...], "overall_rationale": "..." }
}
```

## Architecture

The feature follows clean architecture with layered separation:

- **Domain** — Pydantic models, Protocol interfaces, domain exceptions
- **Infrastructure** — In-memory session repository, recommender library adapter
- **Application** — PlaylistService orchestrating the conversation lifecycle
- **Presentation** — Litestar controller mapping HTTP to service calls

See [ADR-001](ADRs/001-session-based-recommender-api.md) for the session management design decision.

## Frontend

- **TanStack Router** — File-based routes at `/`, `/conversation/$sessionId`, `/results/$sessionId`
- **TanStack Query** — Generated API client with mutation/query hooks
- **Zustand** — Client-side conversation state (messages, thinking indicator)
- **Components** — TopicInputForm, ChatMessage, ThinkingIndicator, ReplyInput, VideoCard
