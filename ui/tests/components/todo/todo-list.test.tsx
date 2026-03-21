import { render } from "vitest-browser-react";
import { expect, test, vi } from "vitest";
import { TodoList } from "@/features/todo/components/todo-list";

const mockTodos = [
  { title: "Buy groceries", done: false },
  { title: "Walk the dog", done: true },
  { title: "Write tests", done: false },
];

test("renders all todo items", async () => {
  const screen = await render(
    <TodoList todos={mockTodos} filter="all" onToggle={vi.fn()} />,
  );
  await expect.element(screen.getByText("Buy groceries")).toBeVisible();
  await expect.element(screen.getByText("Walk the dog")).toBeVisible();
  await expect.element(screen.getByText("Write tests")).toBeVisible();
});

test("filters to show only done items", async () => {
  const screen = await render(
    <TodoList todos={mockTodos} filter="done" onToggle={vi.fn()} />,
  );
  await expect.element(screen.getByText("Walk the dog")).toBeVisible();
  expect(screen.getByText("Buy groceries").elements()).toHaveLength(0);
  expect(screen.getByText("Write tests").elements()).toHaveLength(0);
});

test("filters to show only not-done items", async () => {
  const screen = await render(
    <TodoList todos={mockTodos} filter="not-done" onToggle={vi.fn()} />,
  );
  await expect.element(screen.getByText("Buy groceries")).toBeVisible();
  await expect.element(screen.getByText("Write tests")).toBeVisible();
  expect(screen.getByText("Walk the dog").elements()).toHaveLength(0);
});

test("shows empty state when no items match filter", async () => {
  const screen = await render(
    <TodoList todos={[]} filter="all" onToggle={vi.fn()} />,
  );
  await expect.element(screen.getByText("No todos yet")).toBeVisible();
});

test("calls onToggle with the todo title when checkbox is clicked", async () => {
  const onToggle = vi.fn();
  const screen = await render(
    <TodoList todos={mockTodos} filter="all" onToggle={onToggle} />,
  );
  const checkboxes = screen.getByRole("checkbox").all();
  await checkboxes[0].click();
  expect(onToggle).toHaveBeenCalledWith("Buy groceries");
});
