interface ChatMessageProps {
  role: "agent" | "user";
  content: string;
}

export function ChatMessage({ role, content }: ChatMessageProps) {
  if (role === "agent") {
    return (
      <div className="w-full" data-role="agent">
        <div className="flex flex-col gap-2 rounded-2xl bg-white border border-[#FECACA] p-[14px_18px] max-w-[500px]">
          <span className="text-xs font-semibold text-[#DC2626]">
            Playlist Agent
          </span>
          <p className="text-sm text-[#1F2937] leading-[1.5]">{content}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex justify-end" data-role="user">
      <div className="rounded-2xl bg-[#DC262620] p-[14px_18px] max-w-[380px]">
        <p className="text-sm text-[#1F2937] leading-[1.5]">{content}</p>
      </div>
    </div>
  );
}
