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

test("calls onSubmit with the title when form is submitted", async () => {
  const onSubmit = vi.fn();
  const screen = await render(<TodoForm onSubmit={onSubmit} />);

  const input = screen.getByPlaceholder("Add a new todo...");
  await input.fill("Buy milk");
  await screen.getByRole("button", { name: "Add" }).click();

  expect(onSubmit).toHaveBeenCalledWith("Buy milk");
});

test("clears input after successful submit", async () => {
  const onSubmit = vi.fn();
  const screen = await render(<TodoForm onSubmit={onSubmit} />);

  const input = screen.getByPlaceholder("Add a new todo...");
  await input.fill("Buy milk");
  await screen.getByRole("button", { name: "Add" }).click();

  await expect.element(input).toHaveValue("");
});

test("does not submit when input is empty", async () => {
  const onSubmit = vi.fn();
  const screen = await render(<TodoForm onSubmit={onSubmit} />);

  await screen.getByRole("button", { name: "Add" }).click();

  expect(onSubmit).not.toHaveBeenCalled();
});

test("shows validation error for empty input", async () => {
  const screen = await render(<TodoForm onSubmit={vi.fn()} />);

  await screen.getByRole("button", { name: "Add" }).click();

  await expect.element(screen.getByText("Title is required")).toBeVisible();
});
