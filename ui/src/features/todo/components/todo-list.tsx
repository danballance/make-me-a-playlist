import { TodoItem } from "@/features/todo/components/todo-item";

type TodoFilter = "all" | "done" | "not-done";

interface Todo {
  title: string;
  done: boolean;
}

interface TodoListProps {
  todos: Todo[];
  filter: TodoFilter;
  onToggle: (title: string) => void;
}

export function TodoList({ todos, filter, onToggle }: TodoListProps) {
  const filtered = todos.filter((todo) => {
    if (filter === "done") return todo.done;
    if (filter === "not-done") return !todo.done;
    return true;
  });

  if (filtered.length === 0) {
    return (
      <p className="py-8 text-center text-muted-foreground">No todos yet</p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {filtered.map((todo) => (
        <TodoItem
          key={todo.title}
          title={todo.title}
          done={todo.done}
          onToggle={() => onToggle(todo.title)}
        />
      ))}
    </div>
  );
}
