# Implementation Plan: Make Me A Playlist

## Summary

Build a fullstack "Make Me A Playlist" feature that lets a user enter a topic, have a multi-turn conversation with an AI agent to clarify preferences, and receive a curated playlist of 5 YouTube videos. The backend exposes a session-based REST API that wraps the `recommender` library's `RecommendationSession`. The frontend has 3 routes: topic input (`/`), conversation (`/conversation/$sessionId`), and results (`/results/$sessionId`). The backend manages sessions in-memory, keyed by UUID. The frontend uses TanStack Router for navigation, TanStack Query for API calls, and Zustand for conversation UI state.

## Prior Artifacts

- **Feature doc**: `tasks/feature.md`
- **Mock-ups**: `tasks/research/mock-ups/topic-input.html`, `conversation.html`, `results.html`
- **Feature descriptions**: `tasks/research/feature-descriptions/01_topic_input.feature`, `02_conversation.feature`, `03_results.feature`

---

## Architecture Decisions

### Backend API Design

The `RecommendationSession` is stateful and async — it maintains conversation history internally. We need to keep sessions alive across multiple HTTP requests. Design:

- **POST `/sessions`** — Create a new session (accepts `topic`), calls `session.start()`, returns `session_id` + first agent question.
- **POST `/sessions/{session_id}/reply`** — Send a user reply, calls `session.reply()`, returns the next agent response (either another question or the final result).
- **GET `/sessions/{session_id}`** — Retrieve the current session state (conversation history and/or results) for re-rendering after navigation.

Sessions are stored in-memory via a `SessionRepository` (dict of UUID → session data). No database needed for MVP.

### Frontend Routing

- `/` — Topic input page
- `/conversation/$sessionId` — Conversation page (receives sessionId from session creation)
- `/results/$sessionId` — Results page (navigated to when agent response has `kind="result"`)

### Data Flow

1. User enters topic on `/` → POST `/sessions` → receive `session_id` + first question → navigate to `/conversation/$sessionId`
2. On conversation page, user sees messages, types reply → POST `/sessions/{id}/reply` → receive next question or result
3. When response `kind="result"` → navigate to `/results/$sessionId`
4. Results page fetches session data via GET `/sessions/{id}` to display playlist

---

## Tasks

### Backend

#### Task 1: Define playlist domain models

- **What**: Create Pydantic models for the playlist feature's domain layer.
- **Where**: `backend/api/playlist/domain/models.py`
- **How**:
  - `SessionId` — NewType wrapping `str` (UUID)
  - `ChatMessage` — `BaseModel` with fields: `role: Literal["agent", "user"]`, `content: str`
  - `SessionState` — `BaseModel` with fields: `session_id: str`, `topic: str`, `messages: list[ChatMessage]`, `status: Literal["conversing", "searching", "complete"]`, `playlist: PlaylistResult | None` (import from `recommender.models`)
  - `CreateSessionRequest` — `BaseModel` with field: `topic: str` (with min_length=1 validator)
  - `ReplyRequest` — `BaseModel` with field: `message: str` (with min_length=1 validator)
  - `SessionResponse` — `BaseModel` with fields: `session_id: str`, `message: ChatMessage`, `status: Literal["conversing", "searching", "complete"]`, `playlist: PlaylistResult | None`
  - `SessionDetailResponse` — `BaseModel` with fields: `session_id: str`, `topic: str`, `messages: list[ChatMessage]`, `status: Literal["conversing", "searching", "complete"]`, `playlist: PlaylistResult | None`
- **Verify**: `cd backend && uv run python -c "from api.playlist.domain.models import SessionState, ChatMessage, CreateSessionRequest, ReplyRequest, SessionResponse, SessionDetailResponse"` succeeds.

#### Task 2: Define playlist domain protocols

- **What**: Create Protocol interfaces for the session repository and the playlist service.
- **Where**: `backend/api/playlist/domain/protocols.py`
- **How**:
  - `SessionRepositoryProtocol` — Protocol with methods:
    - `async def create(self, session_id: str, state: SessionState) -> None`
    - `async def get(self, session_id: str) -> SessionState | None`
    - `async def update(self, session_id: str, state: SessionState) -> None`
    - `async def delete(self, session_id: str) -> None`
- **Verify**: Import succeeds.

#### Task 3: Define playlist application protocols

- **What**: Create the application service protocol.
- **Where**: `backend/api/playlist/application/protocols.py`
- **How**:
  - `PlaylistServiceProtocol` — Protocol with methods:
    - `async def create_session(self, topic: str) -> SessionResponse`
    - `async def reply(self, session_id: str, message: str) -> SessionResponse`
    - `async def get_session(self, session_id: str) -> SessionDetailResponse`
- **Verify**: Import succeeds.

#### Task 4: Implement in-memory session repository

- **What**: Create an in-memory implementation of `SessionRepositoryProtocol`.
- **Where**: `backend/api/playlist/infrastructure/memory_repo.py`
- **How**:
  - `InMemorySessionRepository` class implementing the protocol.
  - Uses `dict[str, SessionState]` as storage.
  - `create` stores the state; `get` returns it or None; `update` replaces it; `delete` removes it.
- **Verify**: Unit tests pass.

#### Task 5: Define domain exceptions

- **What**: Create domain exceptions for the playlist feature.
- **Where**: `backend/api/playlist/domain/exceptions.py`
- **How**:
  - `SessionNotFoundError(Exception)` — raised when session_id doesn't exist.
  - `SessionCompleteError(Exception)` — raised when trying to reply to a completed session.
- **Verify**: Import succeeds.

#### Task 6: Implement playlist application service

- **What**: Create the `PlaylistService` that orchestrates the recommender library.
- **Where**: `backend/api/playlist/application/services.py`
- **How**:
  - `PlaylistService` implements `PlaylistServiceProtocol`.
  - Constructor takes `SessionRepositoryProtocol` and `ProviderConfig` (from recommender).
  - Manages a dict of active `RecommendationSession` context managers keyed by session_id.
  - `create_session(topic)`:
    1. Generate UUID.
    2. Create `RecommendationSession(topic, provider)`, enter context (`__aenter__`).
    3. Call `session.start()` → get first `SessionResponse` from recommender.
    4. Build `ChatMessage(role="agent", content=response.message)`.
    5. Create `SessionState` with status="conversing", store in repo.
    6. Store the live `RecommendationSession` object internally for future replies.
    7. Return `SessionResponse` model with session_id, message, status.
  - `reply(session_id, message)`:
    1. Get session state from repo (raise `SessionNotFoundError` if missing).
    2. Raise `SessionCompleteError` if status is "complete".
    3. Add user `ChatMessage` to state.
    4. Call `session.reply(message)` on the stored `RecommendationSession`.
    5. If response.kind == "question": add agent message, update state, return.
    6. If response.kind == "result": update state with playlist, set status="complete", close the recommender session, return.
  - `get_session(session_id)`:
    1. Get session state from repo (raise `SessionNotFoundError` if missing).
    2. Return `SessionDetailResponse`.
- **Verify**: Unit tests pass (using fake repository and a mock/fake recommender session).

#### Task 7: Create a recommender session factory protocol and implementation

- **What**: Abstract the creation of `RecommendationSession` behind a protocol so the service can be tested without real API calls.
- **Where**: `backend/api/playlist/domain/protocols.py` (add to existing), `backend/api/playlist/infrastructure/recommender_factory.py`
- **How**:
  - Add `RecommenderSessionProtocol` to domain protocols — Protocol with:
    - `async def start(self) -> recommender.models.SessionResponse`
    - `async def reply(self, answer: str) -> recommender.models.SessionResponse`
    - `async def close(self) -> None`
  - Add `RecommenderSessionFactoryProtocol` — Protocol with:
    - `async def create(self, topic: str) -> RecommenderSessionProtocol`
  - In `infrastructure/recommender_factory.py`: `DefaultRecommenderSessionFactory` that wraps `RecommendationSession`:
    - `create(topic)` → creates and enters the async context manager, returns a wrapper implementing `RecommenderSessionProtocol`.
  - Update `PlaylistService` constructor to depend on `RecommenderSessionFactoryProtocol` instead of `ProviderConfig`.
- **Verify**: Unit tests with a fake factory pass.

#### Task 8: Create playlist presentation controller

- **What**: Build the Litestar controller for the playlist API endpoints.
- **Where**: `backend/api/playlist/presentation/controllers.py`
- **How**:
  - `PlaylistController(Controller)` with `path = "/sessions"`:
    - `@post(status_code=HTTP_201_CREATED)` `create_session(self, service, data: CreateSessionRequest) -> SessionResponse`
    - `@post("/{session_id:str}/reply")` `reply(self, service, session_id: str, data: ReplyRequest) -> SessionResponse`
    - `@get("/{session_id:str}")` `get_session(self, service, session_id: str) -> SessionDetailResponse`
  - Map domain exceptions to HTTP exceptions:
    - `SessionNotFoundError` → `NotFoundException`
    - `SessionCompleteError` → `HTTPException(status_code=409, detail="Session already complete")`
- **Verify**: Controller unit tests pass with fake service.

#### Task 9: Wire up composition root

- **What**: Register the playlist controller and dependencies in `api/main.py`.
- **Where**: `backend/api/main.py`
- **How**:
  - Import and instantiate `InMemorySessionRepository`.
  - Import and instantiate `DefaultRecommenderSessionFactory` with `ProviderConfig.anthropic()`.
  - Instantiate `PlaylistService` with the repository and factory.
  - Add `PlaylistController` to `route_handlers`.
  - Add `"playlist_service"` to dependencies via `Provide`.
  - Update the controller to use `playlist_service` as the DI parameter name.
- **Verify**: `cd backend && uv run python -c "from api.main import create_app; app = create_app()"` succeeds.

#### Task 10: Create `__init__.py` files for playlist module

- **What**: Create empty `__init__.py` files for all new packages.
- **Where**: 
  - `backend/api/playlist/__init__.py`
  - `backend/api/playlist/domain/__init__.py`
  - `backend/api/playlist/application/__init__.py`
  - `backend/api/playlist/infrastructure/__init__.py`
  - `backend/api/playlist/presentation/__init__.py`
- **How**: Create empty files.
- **Verify**: All module imports work.

#### Task 11: Export updated OpenAPI schema

- **What**: Export the OpenAPI schema so the frontend codegen picks up the new endpoints.
- **Where**: `schema/openapi.json`
- **How**: `cd backend && uv run python export_schema.py`
- **Verify**: `schema/openapi.json` contains `/sessions` paths.

### Frontend

#### Task 12: Run frontend codegen

- **What**: Regenerate the TypeScript API client from the updated OpenAPI schema.
- **Where**: `ui/src/api/generated/`
- **How**: `cd ui && pnpm codegen`
- **Verify**: Generated files include session-related types and SDK functions.

#### Task 13: Create playlist feature folder structure

- **What**: Set up the feature folder for the playlist feature.
- **Where**: `ui/src/features/playlist/`
- **How**: Create directories:
  - `ui/src/features/playlist/components/`
  - Create `ui/src/features/playlist/queries.ts` — re-export relevant generated query options for session creation, reply, and fetching session details.
  - Create `ui/src/features/playlist/store.ts` — Zustand store for conversation UI state:
    - `messages: ChatMessage[]` (local optimistic display)
    - `isAgentThinking: boolean`
    - `addMessage(msg)`, `setAgentThinking(bool)`, `reset()`
- **Verify**: Files exist and TypeScript compiles.

#### Task 14: Build Topic Input page (route `/`)

- **What**: Replace the existing todo index page with the topic input landing page.
- **Where**: `ui/src/routes/index.tsx`, `ui/src/features/playlist/components/topic-input-form.tsx`
- **How**:
  - Create `TopicInputForm` component:
    - Text input with placeholder `e.g. "advanced vim motions"`.
    - "Find my playlist" submit button.
    - Zod validation: topic must be non-empty string.
    - Use react-hook-form for form handling.
    - On submit: call POST `/sessions` mutation with the topic.
    - On success: navigate to `/conversation/$sessionId` with the returned session_id.
    - Display validation error if topic is empty.
  - Update `ui/src/routes/index.tsx`:
    - Render the `TopicInputForm` centered on page.
    - Match styling from `tasks/research/mock-ups/topic-input.html` (bg-[#FEF2F2], red-themed, IBM Plex Sans font).
  - The page shows heading "Make me a playlist" and description text.
- **Verify**: Route renders, form submits, navigation works. Matches mock-up layout.

#### Task 15: Build Conversation page (route `/conversation/$sessionId`)

- **What**: Create the conversation page with chat interface.
- **Where**: `ui/src/routes/conversation/$sessionId.tsx`, plus components in `ui/src/features/playlist/components/`
- **How**:
  - Create route file `ui/src/routes/conversation/$sessionId.tsx`:
    - `createFileRoute("/conversation/$sessionId")` with loader that fetches session details via GET `/sessions/{id}`.
    - Renders `ConversationPage` component.
  - Create components:
    - `ChatMessage` — renders a single message bubble. Agent messages: left-aligned, white bg, red border, "Playlist Agent" label. User messages: right-aligned, red tinted bg.
    - `ThinkingIndicator` — animated dots + "Agent is thinking..." text (matches mock-up).
    - `ChatArea` — scrollable container rendering list of `ChatMessage` + optional `ThinkingIndicator`. Auto-scrolls to bottom on new messages.
    - `ReplyInput` — text input + send button. Submits on click or Enter key. Clears after send. Doesn't send empty messages.
    - `ConversationTopBar` — back arrow + topic text. Back arrow navigates to `/`.
    - `ConversationPage` — orchestrates all above. Uses Zustand store for messages and thinking state.
  - Data flow:
    - On mount, seed messages from loader data (session detail response).
    - User types reply → optimistically add user message to store → set thinking=true → POST `/sessions/{id}/reply` → on response:
      - If `kind="question"`: add agent message to store, set thinking=false.
      - If `kind="result"`: navigate to `/results/$sessionId`.
  - Match styling from `tasks/research/mock-ups/conversation.html`.
- **Verify**: Route renders, messages display, reply works, thinking indicator shows/hides, auto-scroll works, back button navigates home.

#### Task 16: Build Results page (route `/results/$sessionId`)

- **What**: Create the results page displaying the curated playlist.
- **Where**: `ui/src/routes/results/$sessionId.tsx`, plus components in `ui/src/features/playlist/components/`
- **How**:
  - Create route file `ui/src/routes/results/$sessionId.tsx`:
    - `createFileRoute("/results/$sessionId")` with loader that fetches session via GET `/sessions/{id}`.
    - Renders `ResultsPage` component.
  - Create components:
    - `ResultsHeader` — "Make me a playlist" title, topic tag, "New playlist" button. "New playlist" navigates to `/` and resets store.
    - `PlaylistSummary` — "Your curated playlist" heading, subtitle with video count, overall rationale in styled box.
    - `VideoCard` — renders a single video with: thumbnail (with duration overlay and placeholder fallback), rank number, title, channel, view count, year, rationale bubble.
    - `VideoList` — renders list of `VideoCard` components.
    - `ResultsPage` — orchestrates header, summary, and video list.
  - Duration formatting: convert `duration_secs` to `MM:SS` or `H:MM:SS`.
  - View count formatting: abbreviate (e.g., "6.4K views").
  - Year extraction: not in the recommender model — may need to omit or derive from URL/metadata if not available. Show "—" if unavailable.
  - Thumbnail: Use `https://img.youtube.com/vi/{video_id}/mqdefault.jpg` as thumbnail URL. On error, show neutral placeholder bg.
  - Match styling from `tasks/research/mock-ups/results.html`.
- **Verify**: Route renders, videos display correctly, "New playlist" navigates home.

#### Task 17: Update root layout styling

- **What**: Update the root route and global CSS to match the app's design system.
- **Where**: `ui/src/routes/__root.tsx`, `ui/src/index.css`
- **How**:
  - Add IBM Plex Sans font import (Google Fonts link in `index.html` or CSS import).
  - Set body background to `#FEF2F2` (the warm rose bg from mock-ups).
  - Remove todo-specific content from root layout.
  - Keep `Outlet`, devtools.
- **Verify**: Background color and font match mock-ups across all pages.

#### Task 18: Clean up todo example code

- **What**: Remove the todo example code since the first feature is now implemented.
- **Where**: Multiple files
- **How**:
  - Remove `backend/api/todo/` directory.
  - Remove `backend/tests/todo/` directory.
  - Remove todo references from `backend/api/main.py`.
  - Remove `ui/src/features/todo/` directory.
  - Remove todo-related generated code will be overwritten by codegen.
  - Update any remaining imports.
- **Verify**: Backend starts without todo routes. Frontend builds without todo imports.

### Testing

#### Task 19: Write backend unit tests — domain models

- **What**: Test Pydantic model validation.
- **Where**: `backend/tests/playlist/domain/test_models.py`
- **How**:
  - Test `CreateSessionRequest` rejects empty topic.
  - Test `ReplyRequest` rejects empty message.
  - Test `ChatMessage` accepts valid roles.
  - Test `SessionState` serialization.
- **Verify**: `cd backend && uv run pytest tests/playlist/domain/test_models.py -v`

#### Task 20: Write backend unit tests — infrastructure

- **What**: Test the in-memory session repository.
- **Where**: `backend/tests/playlist/infrastructure/test_memory_repo.py`
- **How**:
  - Test `create` and `get` round-trip.
  - Test `get` returns None for unknown ID.
  - Test `update` replaces state.
  - Test `delete` removes state.
- **Verify**: `cd backend && uv run pytest tests/playlist/infrastructure/ -v`

#### Task 21: Write backend unit tests — application service

- **What**: Test `PlaylistService` with fake repository and fake recommender factory.
- **Where**: `backend/tests/playlist/application/test_services.py`
- **How**:
  - Create `FakeRecommenderSession` implementing `RecommenderSessionProtocol`:
    - `start()` returns a question response.
    - `reply()` returns either a question or result depending on test scenario.
  - Create `FakeRecommenderSessionFactory` implementing `RecommenderSessionFactoryProtocol`.
  - Test `create_session` creates a session, calls start, stores state, returns response with session_id.
  - Test `reply` with question response: adds messages, returns question.
  - Test `reply` with result response: sets status=complete, stores playlist.
  - Test `reply` to non-existent session raises `SessionNotFoundError`.
  - Test `reply` to completed session raises `SessionCompleteError`.
  - Test `get_session` returns full state.
  - Test `get_session` for unknown session raises `SessionNotFoundError`.
- **Verify**: `cd backend && uv run pytest tests/playlist/application/ -v`

#### Task 22: Write backend unit tests — presentation controller

- **What**: Test the controller with a fake service.
- **Where**: `backend/tests/playlist/presentation/test_controllers.py`
- **How**:
  - Create `FakePlaylistService` implementing `PlaylistServiceProtocol`.
  - Test POST `/sessions` returns 201 with session response.
  - Test POST `/sessions/{id}/reply` returns 200 with response.
  - Test GET `/sessions/{id}` returns 200 with detail response.
  - Test POST `/sessions` with empty topic returns 400.
  - Test POST `/sessions/{id}/reply` with unknown session returns 404.
  - Test POST `/sessions/{id}/reply` with completed session returns 409.
- **Verify**: `cd backend && uv run pytest tests/playlist/presentation/ -v`

#### Task 23: Write E2E tests with Playwright BDD

- **What**: Create Playwright BDD tests from the Gherkin feature files.
- **Where**: `ui/tests/e2e/`
- **How**:
  - Copy/adapt `.feature` files from `tasks/research/feature-descriptions/` to `ui/tests/e2e/features/`.
  - Write step definitions for each feature file.
  - Feature file mapping:
    - `01_topic_input.feature` → `topic-input.steps.ts`
    - `02_conversation.feature` → `conversation.steps.ts`
    - `03_results.feature` → `results.steps.ts`
  - Load the playwright-bdd skill for detailed implementation guidance.
- **Verify**: `cd ui && pnpm test:e2e` — tests run (some may need backend running).

---

## Testing Strategy

### Unit Tests (Backend — pytest)

| Layer | File | What's tested |
|-------|------|---------------|
| Domain models | `tests/playlist/domain/test_models.py` | Pydantic validation, serialization |
| Infrastructure | `tests/playlist/infrastructure/test_memory_repo.py` | Repository CRUD operations |
| Application | `tests/playlist/application/test_services.py` | Service orchestration with fakes |
| Presentation | `tests/playlist/presentation/test_controllers.py` | HTTP status codes, request/response shapes |

### E2E Tests (Frontend — Playwright BDD)

| Feature file | Coverage |
|-------------|----------|
| `01_topic_input.feature` | Landing page layout, form validation, navigation to conversation |
| `02_conversation.feature` | Chat UI, message sending, thinking indicator, navigation |
| `03_results.feature` | Results layout, video cards, "new playlist" flow |

---

## Risks

| Risk | Mitigation |
|------|------------|
| `RecommendationSession` is stateful and long-lived — could leak memory if sessions aren't cleaned up | Implement a TTL or max-sessions limit in the repository (future enhancement). For MVP, accept in-memory storage. |
| Agent takes a long time during search phase — user sees no feedback | The `on_progress` callback exists in the library. For MVP, show "Agent is thinking..." indicator. Progress events can be added later via SSE/WebSocket. |
| `RecommendationSession` requires real API keys for search providers | Backend tests use fakes. E2E tests will need a running backend with configured keys or a mock server. |
| The `duration_secs` and `view_count` fields on `RecommendedVideo` are optional (can be None) | UI handles None gracefully — show "—" for missing values. |
| No `published_year` field on `RecommendedVideo` | Show "—" or omit year column. The mock-up shows year but the model doesn't have it. |
| Concurrent session management — `RecommendationSession` async context managers held in service memory | The service holds refs to active sessions in a dict. Session cleanup on completion. For MVP, no horizontal scaling concern. |
