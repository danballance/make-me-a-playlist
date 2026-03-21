import { expect, test, beforeEach } from "vitest";
import { useTodoFilterStore } from "@/features/todo/store";

beforeEach(() => {
  useTodoFilterStore.setState({ filter: "all" });
});

test("initial filter is 'all'", () => {
  const state = useTodoFilterStore.getState();
  expect(state.filter).toBe("all");
});

test("setFilter changes the filter", () => {
  const { setFilter } = useTodoFilterStore.getState();
  setFilter("done");
  expect(useTodoFilterStore.getState().filter).toBe("done");
});

test("setFilter to 'not-done' works", () => {
  const { setFilter } = useTodoFilterStore.getState();
  setFilter("not-done");
  expect(useTodoFilterStore.getState().filter).toBe("not-done");
});
