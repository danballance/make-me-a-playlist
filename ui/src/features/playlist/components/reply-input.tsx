import { useState } from "react";
import type { KeyboardEvent } from "react";

interface ReplyInputProps {
  onSend: (message: string) => void;
  disabled: boolean;
}

export function ReplyInput({ onSend, disabled }: ReplyInputProps) {
  const [value, setValue] = useState("");

  const handleSend = () => {
    const trimmed = value.trim();
    if (trimmed.length === 0) return;
    onSend(trimmed);
    setValue("");
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex items-center gap-3 px-6 py-4 bg-white border-t border-[#FECACA]">
      <input
        type="text"
        placeholder="Type your reply..."
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        className="flex-1 rounded-2xl bg-[#FEF2F2] border border-[#FECACA] px-[18px] py-3 text-sm text-[#1F2937] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#DC2626]/20 disabled:opacity-50"
      />
      <button
        type="button"
        onClick={handleSend}
        disabled={disabled}
        aria-label="Send"
        className="flex items-center justify-center w-10 h-10 rounded-full bg-[#DC2626] hover:bg-[#B91C1C] transition-colors disabled:opacity-50"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          role="img"
          aria-label="Send message"
        >
          <path d="m5 12 7-7 7 7" />
          <path d="M12 19V5" />
        </svg>
      </button>
    </div>
  );
}
