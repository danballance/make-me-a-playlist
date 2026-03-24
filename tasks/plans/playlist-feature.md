# Implementation Plan: Make Me A Playlist

## Summary

Build a fullstack "Make Me A Playlist" feature across three screens: **Topic Input** (landing page where users enter a topic), **Conversation** (chat interface where the AI agent clarifies preferences), and **Results** (curated video playlist display). The backend exposes a stateful session API via Litestar that wraps the `recommender` library's `RecommendationSession`. The frontend is a React SPA with three TanStack Router routes, using Zustand for conversation state and TanStack Query for API communication. E2E tests use playwright-bdd with the provided Gherkin feature files.

## Architecture Decisions

### Backend: Session-based API

The `RecommendationSession` is stateful (it holds agent conversation history). The backend will manage sessions in-memory, keyed by a UUID session ID. Three endpoints:

- `POST /sessions` — create session with a topic, returns session ID + first agent question
- `POST /sessions/{session_id}/reply` — send user reply, returns next question or final results
- `GET /sessions/{session_id}` — get current session state (for reconnection/polling)

### Frontend: Client-side conversation state

The conversation messages (for display) are managed in a Zustand store since they're purely UI state — the backend doesn't return message history, only the latest response. The route structure:

- `/` — Topic Input page
- `/conversation/$sessionId` — Conversation page
- `/results/$sessionId` — Results page

### Data flow

1. User submits topic → `POST /sessions` → backend creates `RecommendationSession`, calls `session.start()`, returns `{session_id, kind, message}`
2. User replies → `POST /sessions/{id}/reply` → backend calls `session.reply()`, returns `{kind, message}` or `{kind, playlist}`
3. When `kind="result"` → frontend navigates to results page, playlist data stored in Zustand

---

## Tasks

### Phase 1: Backend — Domain & Application Layer

#### Task 1: Create playlist domain models
- **What**: Create Pydantic models for the playlist domain: `SessionId`, `CreateSessionRequest`, `ReplyRequest`, `SessionResponse` (wrapping the recommender's response types for the API boundary)
- **Where**: `backend/api/playlist/domain/models.py`
- **How**: 
  - `CreateSessionRequest`: `topic: str`
  - `ReplyRequest`: `message: str`
  - `SessionState` (literal: `"conversing"` | `"completed"`)
  - `AgentMessage`: `kind: Literal["question", "result"]`, `message: str | None`, `playlist: PlaylistData | None`
  - `PlaylistData`: `topic: str`, `videos: list[VideoData]`, `overall_rationale: str`
  - `VideoData`: `video_id: str`, `url: str`, `title: str`, `channel: str`, `duration_secs: int | None`, `view_count: int | None`, `reason: str`, `what_makes_it_interesting: str`
  - `SessionInfo`: `session_id: str`, `state: SessionState`, `topic: str`, `response: AgentMessage`
- **Verify**: `cd backend && uv run python -c "from api.playlist.domain.models import CreateSessionRequest, ReplyRequest, SessionInfo, AgentMessage, PlaylistData, VideoData"`

#### Task 2: Create playlist domain protocols
- **What**: Define Protocol interfaces for session management
- **Where**: `backend/api/playlist/domain/protocols.py`
- **How**:
  - `SessionRepositoryProtocol`: `async create(topic: str) -> SessionInfo`, `async reply(session_id: str, message: str) -> SessionInfo`, `async get(session_id: str) -> SessionInfo`
- **Verify**: `cd backend && uv run python -c "from api.playlist.domain.protocols import SessionRepositoryProtocol"`

#### Task 3: Create playlist application layer
- **What**: Define application service protocol and implementation
- **Where**: 
  - `backend/api/playlist/application/protocols.py`
  - `backend/api/playlist/application/services.py`
- **How**:
  - `PlaylistServiceProtocol`: mirrors repository methods (create, reply, get)
  - `PlaylistService`: thin delegation to `SessionRepositoryProtocol`
- **Verify**: `cd backend && uv run python -c "from api.playlist.application.services import PlaylistService"`

#### Task 4: Create playlist infrastructure — in-memory session repository
- **What**: Implement `SessionRepositoryProtocol` using a dict of `RecommendationSession` instances
- **Where**: `backend/api/playlist/infrastructure/session_repo.py`
- **How**:
  - Store sessions as `dict[str, RecommendationSession]` with UUID keys
  - `create()`: generate UUID, create `RecommendationSession` context manager, call `session.start()`, map response to domain models, return `SessionInfo`
  - `reply()`: look up session, call `session.reply()`, map response, return `SessionInfo`
  - `get()`: return last known state for the session (store latest `SessionInfo` alongside)
  - Use `ProviderConfig.anthropic()` (configurable later)
  - Handle session-not-found by raising `KeyError`
- **Verify**: Unit tests (Task 7)

#### Task 5: Create playlist presentation — Litestar controller
- **What**: Create a Litestar controller with three endpoints
- **Where**: `backend/api/playlist/presentation/controllers.py`
- **How**:
  - `POST /sessions` → accepts `CreateSessionRequest`, returns `SessionInfo` (201)
  - `POST /sessions/{session_id:str}/reply` → accepts `ReplyRequest`, returns `SessionInfo`
  - `GET /sessions/{session_id:str}` → returns `SessionInfo`
  - Depends on `PlaylistServiceProtocol` via DI
  - Raise `NotFoundException` for unknown session IDs
- **Verify**: Unit tests (Task 8)

#### Task 6: Wire playlist module into the Litestar app
- **What**: Register the playlist controller and dependencies in the composition root
- **Where**: `backend/api/main.py`
- **How**:
  - Import `PlaylistController`, `PlaylistService`, `InMemorySessionRepository`
  - Create repository and service instances
  - Add to `route_handlers` and `dependencies`
  - Keep existing todo routes (they'll be removed later per feature.md)
- **Verify**: `cd backend && uv run python -c "from api.main import create_app; app = create_app()"`

#### Task 7: Unit tests — domain models, application service, infrastructure
- **What**: Write pytest tests for domain models, service, and repository
- **Where**: 
  - `backend/tests/playlist/domain/test_models.py`
  - `backend/tests/playlist/application/test_services.py`
  - `backend/tests/playlist/infrastructure/test_session_repo.py`
- **How**:
  - Model tests: validate Pydantic model construction and validation
  - Service tests: mock repository, verify delegation
  - Repository tests: mock `RecommendationSession`, test create/reply/get flows, test session-not-found
- **Verify**: `cd backend && uv run pytest tests/playlist/ -v`

#### Task 8: Unit tests — presentation controller
- **What**: Write pytest tests for the controller using Litestar's test client
- **Where**: `backend/tests/playlist/presentation/test_controllers.py`
- **How**:
  - Test POST /sessions with valid topic returns 201 + SessionInfo
  - Test POST /sessions with empty topic returns validation error
  - Test POST /sessions/{id}/reply returns next question or result
  - Test GET /sessions/{id} returns session state
  - Test GET /sessions/{unknown_id} returns 404
  - Mock the `PlaylistServiceProtocol` to avoid real API calls
- **Verify**: `cd backend && uv run pytest tests/playlist/presentation/ -v`

#### Task 9: Update import-linter contracts
- **What**: Add architectural contracts for the new `playlist` module
- **Where**: `backend/pyproject.toml`
- **How**:
  - Add `playlist-layers` contract (presentation → application → infrastructure → domain)
  - Add `playlist-infra-isolation` contract
  - Add `playlist` to the `domain-independence` contract modules list
  - Add `playlist` domain/application to the no-framework contracts
- **Verify**: `cd backend && uv run lint-imports`

#### Task 10: Export updated OpenAPI schema and run frontend codegen
- **What**: Regenerate the OpenAPI schema and frontend types
- **Where**: `schema/openapi.json`, `ui/src/api/generated/`
- **How**:
  - `cd backend && uv run python export_schema.py`
  - `cd ui && pnpm codegen`
- **Verify**: Check that `ui/src/api/generated/types.gen.ts` contains `SessionInfo`, `CreateSessionRequest`, etc.

### Phase 2: Frontend — Routes & Components

#### Task 11: Create playlist feature module with Zustand store
- **What**: Create the conversation state store
- **Where**: `ui/src/features/playlist/store.ts`
- **How**:
  - `useConversationStore` with state:
    - `messages: Array<{role: "agent" | "user", text: string}>` 
    - `playlist: PlaylistData | null`
    - `topic: string`
    - `sessionId: string | null`
    - `isThinking: boolean`
  - Actions: `addAgentMessage`, `addUserMessage`, `setPlaylist`, `setTopic`, `setSessionId`, `setThinking`, `reset`
- **Verify**: Store unit tests (Task 17)

#### Task 12: Create playlist feature queries
- **What**: Re-export generated query options and mutation factories
- **Where**: `ui/src/features/playlist/queries.ts`
- **How**: Re-export the codegen'd `createSession`, `replyToSession`, and `getSession` query/mutation options with readable names
- **Verify**: TypeScript compiles: `cd ui && pnpm exec tsc --noEmit`

#### Task 13: Build Topic Input page
- **What**: Create the landing page route with topic form
- **Where**: `ui/src/routes/index.tsx`
- **How**:
  - Replace the todo page content
  - Match the mock-up: centered layout, heading "Make me a playlist", description mentioning YouTube and hidden gems, text input with placeholder `e.g. "advanced vim motions"`, "Find my playlist" button
  - Use react-hook-form + Zod for validation (topic must not be empty)
  - On submit: call `POST /sessions` mutation, on success navigate to `/conversation/$sessionId`
  - Store the first agent message and topic in Zustand
  - Use the IBM Plex Sans font and the red color palette from the mock-ups (configure in CSS)
  - Use Tailwind classes matching the mock-up styles
- **Verify**: Visual inspection + E2E tests (Task 18)

#### Task 14: Build Conversation page
- **What**: Create the chat interface route
- **Where**: 
  - `ui/src/routes/conversation/$sessionId.tsx`
  - `ui/src/features/playlist/components/chat-message.tsx`
  - `ui/src/features/playlist/components/thinking-indicator.tsx`
- **How**:
  - Top bar with back arrow (navigates to `/`) and topic text
  - Chat area showing messages from Zustand store: agent messages left-aligned with "Playlist Agent" label, user messages right-aligned
  - Thinking indicator (animated dots + "Agent is thinking...") shown when `isThinking` is true
  - Reply input bar at bottom with "Type your reply..." placeholder and send button
  - On send: add user message to store, set `isThinking=true`, call `POST /sessions/{id}/reply`, on response add agent message to store, set `isThinking=false`
  - If response `kind="result"`: store playlist in Zustand, navigate to `/results/$sessionId`
  - Enter key submits, empty input is ignored
  - Auto-scroll chat to bottom on new messages
- **Verify**: Visual inspection + E2E tests (Task 19)

#### Task 15: Build Results page
- **What**: Create the results display route
- **Where**:
  - `ui/src/routes/results/$sessionId.tsx`
  - `ui/src/features/playlist/components/video-card.tsx`
- **How**:
  - Header with "Make me a playlist" title, topic tag, "New playlist" button
  - "Your curated playlist" heading with video count subtitle
  - Overall rationale box with sparkle icon
  - Video cards (matching mock-up layout): thumbnail area (left, with duration overlay), rank number, title, channel/views/year metadata, rationale section
  - Thumbnail: use YouTube thumbnail URL (`https://img.youtube.com/vi/{video_id}/mqdefault.jpg`), show placeholder bg on error
  - Duration: format `duration_secs` to `MM:SS` or `H:MM:SS`
  - View count: format with approximate suffix (e.g. "6.4K views")
  - Year: extract from URL or use current year (note: `RecommendedVideo` doesn't have a published date — we may need to omit or show "—")
  - "New playlist" button: call `reset()` on Zustand store and navigate to `/`
  - Read playlist from Zustand store; if not present, redirect to `/`
- **Verify**: Visual inspection + E2E tests (Task 20)

#### Task 16: Update global styles for the playlist theme
- **What**: Configure the red/warm color palette and IBM Plex Sans font
- **Where**: `ui/src/index.css`, possibly `ui/index.html` for font link
- **How**:
  - Add Google Fonts import for IBM Plex Sans (400, 500, 600)
  - Set body font-family
  - Update CSS variables or use direct Tailwind classes for the red palette (`#DC2626`, `#FEF2F2`, `#FECACA`, etc.)
  - The `bg-[#FEF2F2]` background from mock-ups should be applied to the root layout
- **Verify**: Visual inspection

#### Task 17: Unit tests — Zustand store
- **What**: Test the conversation store
- **Where**: `ui/tests/components/playlist/store.test.ts`
- **How**:
  - Test `addAgentMessage` / `addUserMessage` append to messages array
  - Test `setPlaylist` stores playlist data
  - Test `reset` clears all state
  - Test `setThinking` toggles isThinking flag
- **Verify**: `cd ui && pnpm test`

### Phase 3: E2E Tests (playwright-bdd)

#### Task 18: E2E tests — Topic Input
- **What**: Create playwright-bdd feature and step definitions for topic input
- **Where**:
  - `ui/tests/e2e/features/topic-input.feature` (copy from `tasks/research/feature-descriptions/01_topic_input.feature`)
  - `ui/tests/e2e/steps/topic-input.ts`
- **How**:
  - Set up `playwright-bdd.config.ts` if not present
  - Implement step definitions using Playwright locators
  - Steps: navigate to page, verify heading/description/input/button, type topic, click submit, verify navigation, verify empty validation
- **Verify**: `cd ui && pnpm test:bdd`

#### Task 19: E2E tests — Conversation
- **What**: Create playwright-bdd feature and step definitions for conversation
- **Where**:
  - `ui/tests/e2e/features/conversation.feature` (adapted from `tasks/research/feature-descriptions/02_conversation.feature`)
  - `ui/tests/e2e/steps/conversation.ts`
- **How**:
  - Background: submit a topic to navigate to conversation page
  - Test: top bar with back arrow and topic, chat area with agent message, reply input, send button
  - Test: sending a reply, enter key submit, empty reply ignored
  - Test: thinking indicator appears/disappears
  - Note: multi-turn conversation and "agent decides it has enough context" scenarios will need mocking at the network level (intercept API calls with Playwright route handlers) to avoid real AI calls in tests
- **Verify**: `cd ui && pnpm test:bdd`

#### Task 20: E2E tests — Results
- **What**: Create playwright-bdd feature and step definitions for results
- **Where**:
  - `ui/tests/e2e/features/results.feature` (adapted from `tasks/research/feature-descriptions/03_results.feature`)
  - `ui/tests/e2e/steps/results.ts`
- **How**:
  - Background: need to mock the full flow (submit topic → conversation → results) via API intercepts
  - Test: header with title, topic tag, "New playlist" button
  - Test: video cards with all fields (thumbnail, duration, rank, title, channel, views, rationale)
  - Test: videos numbered 1-5, sequential
  - Test: "New playlist" navigates to topic input, clears state
  - Test: fewer than 5 videos renders correctly
  - Test: thumbnail error shows placeholder
- **Verify**: `cd ui && pnpm test:bdd`

### Phase 4: Cleanup

#### Task 21: Remove todo example code
- **What**: Remove the todo application code that shipped with the template
- **Where**: 
  - Delete `backend/api/todo/` directory
  - Delete `backend/tests/todo/` directory  
  - Delete `ui/src/features/todo/` directory
  - Delete `ui/tests/components/todo/` directory
  - Delete `ui/tests/e2e/todo.spec.ts`
  - Remove todo-related imports and wiring from `backend/api/main.py`
  - Remove todo-related import-linter contracts from `backend/pyproject.toml`
  - Remove todo mock handlers from `ui/tests/mocks/handlers.ts`
- **How**: Delete files/directories, clean up imports, re-run all tests to ensure nothing breaks
- **Verify**: `cd backend && uv run pytest` and `cd ui && pnpm test` both pass with no todo references

---

## Testing Strategy

### Backend (pytest, functional style)
| Test file | What it covers |
|-----------|---------------|
| `tests/playlist/domain/test_models.py` | Pydantic model validation and construction |
| `tests/playlist/application/test_services.py` | Service delegates to repository correctly |
| `tests/playlist/infrastructure/test_session_repo.py` | Session lifecycle (create → reply → get), error cases |
| `tests/playlist/presentation/test_controllers.py` | HTTP endpoint behavior via Litestar test client |

All infrastructure tests mock `RecommendationSession` to avoid real AI/API calls.

### Frontend (Zustand store unit tests)
| Test file | What it covers |
|-----------|---------------|
| `tests/components/playlist/store.test.ts` | Zustand store state transitions |

### E2E (playwright-bdd)
| Feature file | Gherkin source | Coverage |
|-------------|---------------|----------|
| `tests/e2e/features/topic-input.feature` | `01_topic_input.feature` | Landing page, form validation, navigation |
| `tests/e2e/features/conversation.feature` | `02_conversation.feature` | Chat UI, messaging, thinking indicator, back navigation |
| `tests/e2e/features/results.feature` | `03_results.feature` | Video cards, playlist display, new playlist flow |

E2E tests will use Playwright route interception to mock API responses, avoiding real AI calls.

---

## Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| `RecommendationSession` is async context manager — must be kept alive across multiple HTTP requests | High | High | Store active sessions in a dict, enter context on create, exit on timeout/cleanup. Document that this is in-memory only (no persistence across server restarts). |
| No `published_date` / year field on `RecommendedVideo` | Certain | Low | The results mock-up shows a year — we'll either omit it or show "—". The mock-up is aspirational, not a strict contract. |
| E2E tests require mocking the AI agent responses | High | Medium | Use Playwright's `page.route()` to intercept `/api/sessions*` calls and return canned responses. Define fixtures with realistic mock data. |
| In-memory session store means no horizontal scaling | Medium | Low | Acceptable for MVP. Can be replaced with Redis/DB-backed store later (Protocol-based design makes this easy). |
| Session cleanup / memory leaks from abandoned sessions | Medium | Medium | Implement a simple TTL-based cleanup (e.g., sessions expire after 30 minutes). Can be a background task or lazy cleanup on access. |
