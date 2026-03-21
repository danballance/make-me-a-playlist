import { createFileRoute } from "@tanstack/react-router";
import {
  useSuspenseQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { Suspense } from "react";
import {
  todoListOptions,
  addItemMutation,
  itemTitleUpdateItemMutation,
} from "@/features/todo/queries";
import { TodoList } from "@/features/todo/components/todo-list";
import { TodoForm } from "@/features/todo/components/todo-form";
import { useTodoFilterStore } from "@/features/todo/store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/")({
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(todoListOptions()),
  component: IndexPage,
});

function IndexPage() {
  return (
    <div className="container mx-auto max-w-2xl p-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">piper-reference — Todos</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <Suspense fallback={<div>Loading...</div>}>
            <TodoContent />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}

function TodoContent() {
  const queryClient = useQueryClient();
  const { data: todos = [] } = useSuspenseQuery(todoListOptions());
  const { filter, setFilter } = useTodoFilterStore();

  const addMutation = useMutation({
    ...addItemMutation(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: todoListOptions().queryKey });
    },
  });

  const toggleMutation = useMutation({
    ...itemTitleUpdateItemMutation(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: todoListOptions().queryKey });
    },
  });

  const handleAdd = (title: string) => {
    addMutation.mutate({
      body: { title, done: false },
    });
  };

  const handleToggle = (title: string) => {
    const todo = todos.find((t) => t.title === title);
    if (!todo) return;
    toggleMutation.mutate({
      path: { item_title: title },
      body: { title, done: !todo.done },
    });
  };

  return (
    <>
      <TodoForm onSubmit={handleAdd} />

      <div className="flex gap-2">
        <FilterButton
          label="All"
          value="all"
          current={filter}
          onClick={setFilter}
        />
        <FilterButton
          label="Done"
          value="done"
          current={filter}
          onClick={setFilter}
        />
        <FilterButton
          label="Not Done"
          value="not-done"
          current={filter}
          onClick={setFilter}
        />
      </div>

      <TodoList todos={todos} filter={filter} onToggle={handleToggle} />

      {addMutation.isError && (
        <p className="text-sm text-destructive">Failed to add todo</p>
      )}
      {toggleMutation.isError && (
        <p className="text-sm text-destructive">Failed to update todo</p>
      )}
    </>
  );
}

function FilterButton({
  label,
  value,
  current,
  onClick,
}: {
  label: string;
  value: "all" | "done" | "not-done";
  current: string;
  onClick: (filter: "all" | "done" | "not-done") => void;
}) {
  return (
    <Button
      variant={current === value ? "default" : "outline"}
      size="sm"
      onClick={() => onClick(value)}
    >
      {label}
    </Button>
  );
}
