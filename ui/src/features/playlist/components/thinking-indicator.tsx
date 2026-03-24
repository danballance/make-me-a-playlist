export function ThinkingIndicator() {
  return (
    <div className="flex items-center gap-2">
      <span className="w-2 h-2 rounded-full bg-[#DC2626] animate-pulse" />
      <span className="w-2 h-2 rounded-full bg-[#DC262680] animate-pulse [animation-delay:150ms]" />
      <span className="w-2 h-2 rounded-full bg-[#DC262640] animate-pulse [animation-delay:300ms]" />
      <span className="text-xs font-medium text-[#9CA3AF]">
        Agent is thinking...
      </span>
    </div>
  );
}
