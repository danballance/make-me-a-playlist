# Zustand

## Overview

Lightweight state management for client-side UI state. Use Zustand for local concerns (filters, toggles, selections) — NOT for server data (use TanStack Query for that).

## Creating a store

```typescript
import { create } from "zustand";

type TodoFilter = "all" | "done" | "not-done";

interface TodoFilterState {
  filter: TodoFilter;
  setFilter: (filter: TodoFilter) => void;
}

export const useTodoFilterStore = create<TodoFilterState>((set) => ({
  filter: "all",
  setFilter: (filter) => set({ filter }),
}));
```

## Conventions

- **Fully typed**: Define an explicit interface for the store state
- **Named exports**: Export the hook as `use<Feature><Purpose>Store`
- **Colocated**: Store lives in `src/features/<feature>/store.ts`
- **Minimal**: Only UI state belongs here — server data goes through TanStack Query

## Using in components

```typescript
function TodoFilters() {
  const { filter, setFilter } = useTodoFilterStore();
  return (
    <select
      value={filter}
      onChange={(e) => setFilter(e.target.value as TodoFilter)}
    >
      <option value="all">All</option>
      <option value="done">Done</option>
      <option value="not-done">Not Done</option>
    </select>
  );
}
```

## Selectors (for render optimization)

```typescript
// Only re-renders when `filter` changes, not on other state updates
const filter = useTodoFilterStore((state) => state.filter);
```

## Testing stores

Test stores directly without rendering components:

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

- Use `setState` in `beforeEach` to reset between tests
- Use `getState()` for synchronous reads in assertions

## When to use Zustand vs TanStack Query

| Data type | Tool | Examples |
|-----------|------|----------|
| Server data | TanStack Query | API responses, lists, entities |
| UI state | Zustand | Filters, sidebar open/closed, selections |
| Form state | react-hook-form | Input values, validation errors |
| URL state | TanStack Router | Current page, search params |

## Docs

<https://zustand.docs.pmnd.rs/getting-started/introduction>
