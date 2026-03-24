import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { Suspense, useEffect, useRef } from "react";
import { getSessionOptions, replyMutation } from "@/features/playlist/queries";
import { useConversationStore } from "@/features/playlist/store";
import { ChatMessage } from "@/features/playlist/components/chat-message";
import { ThinkingIndicator } from "@/features/playlist/components/thinking-indicator";
import { ReplyInput } from "@/features/playlist/components/reply-input";

export const Route = createFileRoute("/conversation/$sessionId")({
  loader: ({ context, params }) =>
    context.queryClient.ensureQueryData(
      getSessionOptions({
        path: { session_id: params.sessionId },
      }),
    ),
  component: ConversationRoute,
});

function ConversationRoute() {
  return (
    <Suspense fallback={<div className="p-6 text-center">Loading...</div>}>
      <ConversationPage />
    </Suspense>
  );
}

function ConversationPage() {
  const { sessionId } = Route.useParams();
  const navigate = useNavigate();
  const chatEndRef = useRef<HTMLDivElement>(null);

  const { data: session } = useSuspenseQuery(
    getSessionOptions({
      path: { session_id: sessionId },
    }),
  );

  const {
    messages,
    isAgentThinking,
    addMessage,
    setAgentThinking,
    setMessages,
  } = useConversationStore();

  // Seed messages from server on mount
  const serverMessages = session?.messages;
  useEffect(() => {
    if (serverMessages) {
      setMessages(
        serverMessages.map((m) => ({
          role: m.role as "agent" | "user",
          content: m.content,
        })),
      );
    }
  }, [serverMessages, setMessages]);

  // Auto-scroll to bottom on new messages
  const messageCount = messages.length;
  // biome-ignore lint/correctness/useExhaustiveDependencies: scroll must trigger on message count and thinking state changes
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messageCount, isAgentThinking]);

  const reply = useMutation({
    ...replyMutation(),
    onSuccess: (data) => {
      setAgentThinking(false);
      if (data.status === "complete") {
        navigate({
          to: "/results/$sessionId",
          params: { sessionId },
        });
        return;
      }
      addMessage({
        role: "agent",
        content: data.message.content,
      });
    },
    onError: () => {
      setAgentThinking(false);
    },
  });

  const handleSend = (message: string) => {
    addMessage({ role: "user", content: message });
    setAgentThinking(true);
    reply.mutate({
      path: { session_id: sessionId },
      body: { message },
    });
  };

  return (
    <div className="flex flex-col h-screen">
      {/* Top bar */}
      <div className="flex items-center gap-3 px-6 py-4 bg-white border-b border-[#FECACA]">
        <Link to="/" aria-label="Go back">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#2C2C2C"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="cursor-pointer"
            role="img"
            aria-label="Back arrow"
          >
            <path d="m12 19-7-7 7-7" />
            <path d="M19 12H5" />
          </svg>
        </Link>
        <span className="text-lg font-semibold text-[#1F2937] tracking-[-0.3px]">
          {session?.topic}
        </span>
      </div>

      {/* Chat area */}
      <div className="flex-1 overflow-auto flex flex-col gap-4 p-6">
        {messages.map((msg, idx) => (
          <ChatMessage
            key={`${msg.role}-${msg.content.slice(0, 20)}-${String(idx)}`}
            role={msg.role}
            content={msg.content}
          />
        ))}
        {isAgentThinking && <ThinkingIndicator />}
        <div ref={chatEndRef} />
      </div>

      {/* Reply input */}
      <ReplyInput onSend={handleSend} disabled={isAgentThinking} />
    </div>
  );
}
