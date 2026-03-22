---
name: harness-test-creation
description: Activated during the Test Creation phase of the Pi Development Harness. Write failing tests bottom-up across backend and frontend before any implementation code is written. This phase follows Planning and precedes Implementation.
---

# Test Creation Phase

You are in the **Test Creation** phase. Write failing tests that define the expected behavior before any implementation begins.

## Objective

Produce a comprehensive suite of **failing tests** that cover the feature end-to-end. These tests become the success criteria for the Implementation phase.

## Process

1. **Read the implementation plan** — Load the plan from `tasks/plans/<feature-slug>.md` and review the testing strategy section.

2. **Write backend tests bottom-up (pytest, functional-style):**

   Follow this order — each layer depends on the one above:

   a. **Domain model tests** → `backend/tests/{feature}/domain/test_models.py`
      - Validate Pydantic model construction, field constraints, serialization

   b. **Infrastructure tests** → `backend/tests/{feature}/infrastructure/test_{repo}.py`
      - Test repository implementations against real database (not mocks)

   c. **Application service tests** → `backend/tests/{feature}/application/test_services.py`
      - Test service orchestration logic

   d. **Presentation controller tests** → `backend/tests/{feature}/presentation/test_controllers.py`
      - Test HTTP endpoints, request/response shapes, status codes

3. **Write frontend tests:**

   a. **E2E step definitions** → `ui/tests/e2e/`
      - Implement Playwright BDD tests from the `.feature` files in `tasks/research/feature-descriptions/`

   b. **Component tests** → `ui/tests/components/{feature}/`
      - Test individual component rendering and interactions

4. **Confirm all tests fail** — Run the test suites to verify tests are written correctly but fail due to missing implementation:
   - Backend: `cd backend && uv run pytest tests/{feature}/ -v`
   - Frontend: `cd ui && pnpm test`

5. **Present to user** — Show the test inventory and get explicit approval before advancing.

6. **Advance** — Call `harness_advance` ONLY after the user has approved the test suite.

## Rules

- Do NOT write implementation code — only test code.
- All tests MUST fail (they define behavior that doesn't exist yet).
- Use pytest functional-style tests (not TestClass style).
- Use Playwright BDD with `.feature` files for E2E tests.
- Each step definition text must be unique across ALL step files. Shared steps (e.g., button assertions) should be defined once in a shared steps file (e.g., `common.ts`) and imported where needed.
- Do not define the same step text with different keywords (Given/When/Then) — playwright-bdd matches by text, not keyword.
- Each test should trace to a requirement in the plan.
- DO get explicit user approval before advancing.
