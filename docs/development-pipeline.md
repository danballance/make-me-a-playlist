# Development Pipeline

The project uses a 3-layer code-generation pipeline where changes flow in one direction: backend code → schema file → frontend codegen.

```
┌─────────────────────┐      ┌───────────────────────┐      ┌──────────────────────┐
│  BACKEND (Python)   │      │  SCHEMA (Contract)    │      │  UI (React/TS)       │
│                     │      │                       │      │                      │
│  Pydantic models    │──▶   │  schema/openapi.json  │──▶   │  src/api/generated/  │
│  + Litestar routes  │export │  (OpenAPI 3.1.0)     │codegen│  (types + hooks)     │
│  = auto OpenAPI     │      │                       │      │                      │
└─────────────────────┘      └───────────────────────┘      └──────────────────────┘
```

## Layer 1: Backend → OpenAPI

Litestar reads type annotations from controller route handlers and Pydantic models to auto-generate an OpenAPI 3.1.0 schema. The schema is:
- Available programmatically via `app.openapi_schema`
- Served at `/schema/openapi.json` when the app runs

Key files:
- `backend/api/main.py` — app factory, controller registration
- `backend/api/{feature}/domain/models.py` — Pydantic models (drive schema components)
- `backend/api/{feature}/presentation/controllers.py` — route handlers (drive schema paths)

Architecture enforcement: `import-linter` contracts in `backend/pyproject.toml` enforce strict layering (domain → infrastructure → application → presentation). Only the presentation layer imports Litestar.

## Layer 2: Schema File (the contract)

`schema/openapi.json` is the static contract between backend and frontend. It is exported from the Litestar app using:

```shell
cd backend && uv run python export_schema.py
```

A CI guard test (`backend/tests/test_schema_currency.py`) asserts the file matches the app's generated schema. If it drifts, tests fail with a message pointing to the export command.

## Layer 3: Schema → UI Codegen

`@hey-api/openapi-ts` reads `../schema/openapi.json` (configured in `ui/openapi-ts.config.ts`) and generates:
- TypeScript types matching Pydantic models
- Typed fetch SDK for each endpoint
- TanStack Query hooks (queries + mutations)

Output goes to `ui/src/api/generated/` (gitignored). Feature code consumes via re-export wrappers (e.g., `ui/src/features/todo/queries.ts`). The client base URL is set in `ui/src/api/client.ts`.

```shell
cd ui && pnpm codegen
```

## Development Sequence (Harness Phases)

The pied-pi harness (`.pied-pi/harness.json`) defines 4 sequential phases. The pipeline dictates the order of work within each phase.

### Phase 1: Planning (confirm: yes)

1. Write feature spec in `tasks/`
2. Create Gherkin `.feature` files in `tasks/research/feature-descriptions/`
3. Create HTML mock-ups in `tasks/research/mock-ups/` (if UI screens involved)
4. Identify: new Pydantic models, API endpoints, UI routes/components
5. Save plan to `tasks/plans/`

### Phase 2: Test Creation (confirm: yes)

Write failing tests bottom-up across both services.

**Backend (pytest, functional-style):**
1. Domain model tests → `backend/tests/{feature}/domain/test_models.py`
2. Infrastructure tests → `backend/tests/{feature}/infrastructure/test_{repo}.py`
3. Application service tests → `backend/tests/{feature}/application/test_services.py`
4. Presentation controller tests → `backend/tests/{feature}/presentation/test_controllers.py`

**Frontend (Playwright BDD from `.feature` files):**
5. E2E step definitions → `ui/tests/e2e/`
6. Component tests → `ui/tests/components/{feature}/`

### Phase 3: Implementation (confirm: no)

Strict dependency order across the pipeline:

```
Backend domain models
    ↓
Backend infrastructure (repos)
    ↓
Backend application (services)
    ↓
Backend presentation (controllers + register in main.py)
    ↓
Export schema:   cd backend && uv run python export_schema.py
    ↓
Frontend codegen: cd ui && pnpm codegen
    ↓
Frontend feature code (queries wrapper, store, components, routes)
    ↓
E2E validation against running stack
```

**Verification gates** — stop and fix before proceeding to the next step:
- After backend: `cd backend && uv run pytest -m "not schemathesis" -v`
- After schema export: `cd backend && uv run pytest -m schemathesis -v`
- After codegen: `cd ui && pnpm exec tsc --noEmit`
- After UI code: `cd ui && pnpm test`
- Full stack: `docker compose up -d --wait api ui && docker compose --profile test run --rm playwright`

### Phase 4: Documentation (confirm: no)

1. Update ADRs in `docs/ADRs/` for significant decisions
2. Update `backend/slumber.yml` with new request examples
3. Update README if needed

## Command Reference

### Backend

| Purpose | Command |
|---------|---------|
| Install deps | `cd backend && uv sync` |
| Run unit tests | `cd backend && uv run pytest -m "not schemathesis" -v` |
| Run feature tests | `cd backend && uv run pytest tests/{feature}/ -v` |
| Run schema validation | `cd backend && uv run pytest -m schemathesis -v` |
| Export OpenAPI schema | `cd backend && uv run python export_schema.py` |
| Fast lint | `bash .claude/scripts/lint-py.sh fast ./backend` |
| Full lint | `bash .claude/scripts/lint-py.sh full ./backend` |
| Auto-format | `cd backend && uv run ruff format .` |
| Auto-fix lint | `cd backend && uv run ruff check --fix .` |

### Frontend

| Purpose | Command |
|---------|---------|
| Install deps | `cd ui && pnpm install` |
| Regenerate API client | `cd ui && pnpm codegen` |
| Type check | `cd ui && pnpm exec tsc --noEmit` |
| Run unit tests | `cd ui && pnpm test` |
| Run E2E tests | `cd ui && pnpm test:e2e` |
| Fast lint | `bash .claude/scripts/lint-ts.sh fast ./ui` |
| Full lint | `bash .claude/scripts/lint-ts.sh full ./ui` |
| Dev server | `cd ui && pnpm dev` |

### Full Pipeline

| Purpose | Command |
|---------|---------|
| Export + codegen | `cd backend && uv run python export_schema.py && cd ../ui && pnpm codegen` |
| Start stack | `docker compose up -d --wait api ui` |
| E2E against stack | `docker compose --profile test run --rm playwright` |
| Stop stack | `docker compose down -v --remove-orphans` |
