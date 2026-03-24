import { beforeEach, describe, expect, test } from "vitest";
import { useConversationStore } from "@/features/playlist/store";

beforeEach(() => {
	useConversationStore.setState({
		messages: [],
		playlist: null,
		topic: "",
		sessionId: null,
		isThinking: false,
	});
});

describe("useConversationStore", () => {
	test("initial state has empty messages", () => {
		const state = useConversationStore.getState();
		expect(state.messages).toEqual([]);
		expect(state.playlist).toBeNull();
		expect(state.topic).toBe("");
		expect(state.sessionId).toBeNull();
		expect(state.isThinking).toBe(false);
	});

	test("addAgentMessage appends agent message", () => {
		useConversationStore.getState().addAgentMessage("Hello from agent");
		const { messages } = useConversationStore.getState();
		expect(messages).toHaveLength(1);
		expect(messages[0]).toEqual({ role: "agent", text: "Hello from agent" });
	});

	test("addUserMessage appends user message", () => {
		useConversationStore.getState().addUserMessage("My reply");
		const { messages } = useConversationStore.getState();
		expect(messages).toHaveLength(1);
		expect(messages[0]).toEqual({ role: "user", text: "My reply" });
	});

	test("messages accumulate in order", () => {
		const store = useConversationStore.getState();
		store.addAgentMessage("Question 1");
		useConversationStore.getState().addUserMessage("Answer 1");
		useConversationStore.getState().addAgentMessage("Question 2");
		const { messages } = useConversationStore.getState();
		expect(messages).toHaveLength(3);
		expect(messages[0].role).toBe("agent");
		expect(messages[1].role).toBe("user");
		expect(messages[2].role).toBe("agent");
	});

	test("setPlaylist stores playlist data", () => {
		const playlist = {
			topic: "vim motions",
			videos: [],
			overall_rationale: "Curated for you.",
		};
		useConversationStore.getState().setPlaylist(playlist);
		expect(useConversationStore.getState().playlist).toEqual(playlist);
	});

	test("setTopic updates topic", () => {
		useConversationStore.getState().setTopic("advanced vim motions");
		expect(useConversationStore.getState().topic).toBe("advanced vim motions");
	});

	test("setSessionId updates sessionId", () => {
		useConversationStore.getState().setSessionId("sess-123");
		expect(useConversationStore.getState().sessionId).toBe("sess-123");
	});

	test("setThinking toggles isThinking", () => {
		useConversationStore.getState().setThinking(true);
		expect(useConversationStore.getState().isThinking).toBe(true);
		useConversationStore.getState().setThinking(false);
		expect(useConversationStore.getState().isThinking).toBe(false);
	});

	test("reset clears all state", () => {
		const store = useConversationStore.getState();
		store.setTopic("vim");
		store.setSessionId("sess-1");
		store.addAgentMessage("hello");
		store.setThinking(true);
		store.setPlaylist({
			topic: "vim",
			videos: [],
			overall_rationale: "Curated.",
		});

		useConversationStore.getState().reset();

		const state = useConversationStore.getState();
		expect(state.messages).toEqual([]);
		expect(state.playlist).toBeNull();
		expect(state.topic).toBe("");
		expect(state.sessionId).toBeNull();
		expect(state.isThinking).toBe(false);
	});
});
