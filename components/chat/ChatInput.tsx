"use client";

import { Send } from "lucide-react";
import { useState, KeyboardEvent } from "react";

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function ChatInput({
  onSend,
  disabled = false,
  placeholder = "Type je bericht...",
}: ChatInputProps) {
  const [message, setMessage] = useState("");

  const handleSend = () => {
    const trimmedMessage = message.trim();
    if (trimmedMessage && !disabled) {
      onSend(trimmedMessage);
      setMessage("");
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex items-end gap-2 p-4 border-t border-gray-100 bg-white">
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        rows={1}
        className="flex-1 resize-none rounded-lg border border-gray-200 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
        style={{ maxHeight: "120px" }}
      />
      <button
        onClick={handleSend}
        disabled={disabled || !message.trim()}
        className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary-600 text-white flex items-center justify-center hover:bg-primary-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
      >
        <Send size={18} />
      </button>
    </div>
  );
}
