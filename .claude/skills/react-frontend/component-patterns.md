# Component Patterns

## Overview

React 19 components using shadcn/ui primitives, Tailwind CSS 4, and react-hook-form for form handling. Components are organized in feature folders with shared UI primitives in `src/components/ui/`.

## Directory structure

```
src/
├── features/<name>/
│   ├── components/     # Feature-specific components
│   ├── queries.ts      # Re-exported query options
│   └── store.ts        # Zustand store
├── components/ui/      # shadcn primitives (Button, Card, Input, etc.)
└── routes/             # Page-level route components
```

## Component conventions

- **Explicit prop interfaces**: Always define a named interface for props
- **Named function exports**: `export function TodoItem(...)` not default exports
- **Small and focused**: One component per concern

```typescript
interface TodoItemProps {
  title: string;
  done: boolean;
  onToggle: () => void;
}

export function TodoItem({ title, done, onToggle }: TodoItemProps) {
  return (
    <div className="flex items-center gap-2 border rounded p-4">
      <Checkbox checked={done} onCheckedChange={onToggle} />
      <span>{title}</span>
    </div>
  );
}
```

## shadcn/ui components

Pre-built in `src/components/ui/`. Add new ones with:

```shell
cd ui && pnpm dlx shadcn@latest add <component-name>
```

Uses CVA (class-variance-authority) for type-safe variants:

```typescript
const buttonVariants = cva("inline-flex items-center ...", {
  variants: {
    variant: {
      default: "bg-primary ...",
      destructive: "bg-destructive ...",
    },
    size: {
      default: "h-9 px-4",
      sm: "h-8 px-3",
      lg: "h-10 px-6",
    },
  },
  defaultVariants: { variant: "default", size: "default" },
});
```

## Styling

- **Tailwind CSS 4** via Vite plugin — CSS-based configuration, no `tailwind.config.js`
- **`cn()` utility** for conditional classnames: `cn("base", condition && "extra")`
- **No CSS modules** — all styling through Tailwind utilities

## Forms with react-hook-form + Zod

**Important**: This project uses Zod v4 but imports via the `"zod/v3"` compatibility path for `@hookform/resolvers/zod` compatibility.

```typescript
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod/v3";

const todoFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
});

type TodoFormValues = z.infer<typeof todoFormSchema>;

export function TodoForm({ onSubmit }: { onSubmit: (title: string) => void }) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TodoFormValues>({
    resolver: zodResolver(todoFormSchema),
    defaultValues: { title: "" },
  });

  return (
    <form
      onSubmit={handleSubmit((values) => {
        onSubmit(values.title);
        reset();
      })}
    >
      <Input {...register("title")} placeholder="Add a new todo..." />
      {errors.title && <span>{errors.title.message}</span>}
      <Button type="submit">Add</Button>
    </form>
  );
}
```

## Docs

- shadcn/ui: <https://ui.shadcn.com/docs>
- react-hook-form: <https://react-hook-form.com/get-started>
- Zod: <https://zod.dev>
- Tailwind CSS: <https://tailwindcss.com/docs>
