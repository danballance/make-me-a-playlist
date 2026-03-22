# TanStack Query

## Overview

Server state management via auto-generated query and mutation options. The `@hey-api/openapi-ts` codegen produces typed `*Options()` and `*Mutation()` factories from the backend's OpenAPI schema — use these instead of writing queries manually.

## Generated query options

Generated in `src/api/generated/@tanstack/react-query.gen.ts`:

```typescript
// Auto-generated — don't write these manually
import { getListOptions } from "@/api/generated/@tanstack/react-query.gen";
```

Re-export from feature modules for convenience (both query options and mutation factories):

```typescript
// src/features/todo/queries.ts
export {
  getListOptions as todoListOptions,
  addItemMutation,
  itemTitleUpdateItemMutation,
} from "@/api/generated/@tanstack/react-query.gen";
```

## Using queries

Prefer `useSuspenseQuery` when the route loader preloads data:

```typescript
import { useSuspenseQuery } from "@tanstack/react-query";

function TodoList() {
  const { data: todos } = useSuspenseQuery(todoListOptions());
  return todos.map((todo) => <TodoItem key={todo.title} todo={todo} />);
}
```

Use `useQuery` when data is optional or conditionally fetched:

```typescript
const { data, isLoading } = useQuery(todoListOptions());
```

## Using mutations

```typescript
import { useMutation, useQueryClient } from "@tanstack/react-query";

function TodoForm() {
  const queryClient = useQueryClient();

  const addMutation = useMutation({
    ...addItemMutation(),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: todoListOptions().queryKey,
      });
    },
  });

  const handleSubmit = (title: string) => {
    addMutation.mutate({ body: { title, done: false } });
  };
}
```

## Mutation data shapes

Generated mutations expect typed option objects:

```typescript
// Body data
addMutation.mutate({ body: { title: "New item", done: false } });

// Path parameters
updateMutation.mutate({
  path: { item_title: "Old title" },
  body: { done: true },
});
```

## Cache invalidation

Always invalidate related queries on mutation success:

```typescript
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: todoListOptions().queryKey });
};
```

Use the generated `*.queryKey` for type-safe invalidation targets.

## Loader integration

Route loaders preload queries so components render instantly:

```typescript
// In route file
loader: ({ context }) =>
  context.queryClient.ensureQueryData(todoListOptions()),

// In component — data is already cached
const { data } = useSuspenseQuery(todoListOptions());
```

## QueryClient defaults

Configured in `main.tsx`:

| Option | Value | Effect |
|--------|-------|--------|
| `staleTime` | 60s | Queries stay fresh for 1 minute |
| `retry` | 3 | Retry failed queries 3 times |

## Docs

- Queries: <https://tanstack.com/query/latest/docs/framework/react/guides/queries>
- Mutations: <https://tanstack.com/query/latest/docs/framework/react/guides/mutations>
- Query invalidation: <https://tanstack.com/query/latest/docs/framework/react/guides/query-invalidation>
- Suspense: <https://tanstack.com/query/latest/docs/framework/react/guides/suspense>
