import { create } from "zustand";

interface ChatMessage {
  role: "agent" | "user";
  content: string;
}

interface ConversationState {
  messages: ChatMessage[];
  isAgentThinking: boolean;
  addMessage: (msg: ChatMessage) => void;
  setAgentThinking: (thinking: boolean) => void;
  setMessages: (messages: ChatMessage[]) => void;
  reset: () => void;
}

export const useConversationStore = create<ConversationState>((set) => ({
  messages: [],
  isAgentThinking: false,
  addMessage: (msg) => set((state) => ({ messages: [...state.messages, msg] })),
  setAgentThinking: (thinking) => set({ isAgentThinking: thinking }),
  setMessages: (messages) => set({ messages }),
  reset: () => set({ messages: [], isAgentThinking: false }),
}));
