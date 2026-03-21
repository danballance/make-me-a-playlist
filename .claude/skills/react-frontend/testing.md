# Testing

## Overview

Vitest with Playwright browser provider for component testing. Tests run in a real browser (Chromium) for accurate DOM behavior. Store tests run as plain unit tests.

## Test file location

```
ui/tests/
├── setup.ts              # Global test setup
├── components/todo/
│   ├── todo-form.test.tsx
│   └── store.test.ts
└── e2e/
    └── todo.spec.ts      # Playwright E2E tests
```

Test directory mirrors source: `tests/components/todo/` tests `src/features/todo/`.

**Note**: MSW (Mock Service Worker) does not work with Vitest Browser Mode. Do not attempt to use MSW for API mocking in component tests.

## Component testing

Uses `vitest-browser-react` for rendering and `@vitest/browser-playwright` for browser execution:

```typescript
import { render } from "vitest-browser-react";
import { expect, test, vi } from "vitest";
import { TodoForm } from "@/features/todo/components/todo-form";

test("renders input and submit button", async () => {
  const screen = await render(<TodoForm onSubmit={vi.fn()} />);
  await expect
    .element(screen.getByPlaceholder("Add a new todo..."))
    .toBeVisible();
  await expect
    .element(screen.getByRole("button", { name: "Add" }))
    .toBeVisible();
});

test("calls onSubmit with title", async () => {
  const onSubmit = vi.fn();
  const screen = await render(<TodoForm onSubmit={onSubmit} />);

  await screen.getByPlaceholder("Add a new todo...").fill("New task");
  await screen.getByRole("button", { name: "Add" }).click();

  expect(onSubmit).toHaveBeenCalledWith("New task");
});
```

## Key patterns

- All interactions are **async** (`await screen.getBy...`)
- Use `expect.element()` for DOM assertions
- Use `vi.fn()` for callback spies
- `render()` returns a `screen` object with query methods

## Store testing

Test Zustand stores directly — no rendering needed:

```typescript
import { useTodoFilterStore } from "@/features/todo/store";

beforeEach(() => {
  useTodoFilterStore.setState({ filter: "all" });
});

test("setFilter updates state", () => {
  useTodoFilterStore.getState().setFilter("done");
  expect(useTodoFilterStore.getState().filter).toBe("done");
});
```

## Running tests

```shell
cd ui && pnpm test          # Single run
cd ui && pnpm test:watch    # Watch mode
cd ui && pnpm test:e2e      # Playwright E2E tests
```

## Docs

- Vitest: <https://vitest.dev/guide/>
- Vitest Browser Mode: <https://vitest.dev/guide/browser/>
- Playwright: <https://playwright.dev/docs/intro>
