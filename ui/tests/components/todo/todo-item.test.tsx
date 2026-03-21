import { render } from "vitest-browser-react";
import { expect, test, vi } from "vitest";
import { TodoItem } from "@/features/todo/components/todo-item";

test("renders todo title", async () => {
  const screen = await render(
    <TodoItem title="Buy groceries" done={false} onToggle={vi.fn()} />,
  );
  await expect.element(screen.getByText("Buy groceries")).toBeVisible();
});

test("renders checkbox unchecked when not done", async () => {
  const screen = await render(
    <TodoItem title="Buy groceries" done={false} onToggle={vi.fn()} />,
  );
  const checkbox = screen.getByRole("checkbox");
  await expect.element(checkbox).not.toBeChecked();
});

test("renders checkbox checked when done", async () => {
  const screen = await render(
    <TodoItem title="Walk the dog" done={true} onToggle={vi.fn()} />,
  );
  const checkbox = screen.getByRole("checkbox");
  await expect.element(checkbox).toBeChecked();
});

test("applies line-through style when done", async () => {
  const screen = await render(
    <TodoItem title="Walk the dog" done={true} onToggle={vi.fn()} />,
  );
  const title = screen.getByText("Walk the dog");
  await expect.element(title).toHaveClass("line-through");
});

test("calls onToggle when checkbox is clicked", async () => {
  const onToggle = vi.fn();
  const screen = await render(
    <TodoItem title="Buy groceries" done={false} onToggle={onToggle} />,
  );
  await screen.getByRole("checkbox").click();
  expect(onToggle).toHaveBeenCalledOnce();
});
