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
