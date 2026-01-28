"use client";

import { Bot, User, ThumbsUp, ThumbsDown } from "lucide-react";
import { formatTime } from "@/lib/utils";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useState } from "react";

interface ChatMessageProps {
  id: Id<"chatMessages">;
  role: "user" | "bot";
  content: string;
  createdAt: number;
  feedback?: "helpful" | "not_helpful";
  isAiGenerated?: boolean;
}

export function ChatMessage({
  id,
  role,
  content,
  createdAt,
  feedback,
  isAiGenerated,
}: ChatMessageProps) {
  const [currentFeedback, setCurrentFeedback] = useState(feedback);
  const submitFeedback = useMutation(api.chat.submitMessageFeedback);

  const handleFeedback = async (value: "helpful" | "not_helpful") => {
    if (currentFeedback === value) return;
    setCurrentFeedback(value);
    await submitFeedback({ messageId: id, feedback: value });
  };

  const isBot = role === "bot";

  return (
    <div className={`flex gap-3 ${isBot ? "" : "flex-row-reverse"}`}>
      <div
        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
          isBot ? "bg-primary-100 text-primary-600" : "bg-gray-100 text-gray-600"
        }`}
      >
        {isBot ? <Bot size={18} /> : <User size={18} />}
      </div>

      <div className={`flex flex-col max-w-[80%] ${isBot ? "" : "items-end"}`}>
        <div
          className={`px-4 py-2 rounded-2xl ${
            isBot
              ? "bg-gray-100 text-gray-900 rounded-tl-none"
              : "bg-primary-600 text-white rounded-tr-none"
          }`}
        >
          <p className="text-sm whitespace-pre-wrap">{content}</p>
        </div>

        <div className="flex items-center gap-2 mt-1 px-1">
          <span className="text-xs text-gray-400">{formatTime(createdAt)}</span>

          {isBot && isAiGenerated && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => handleFeedback("helpful")}
                className={`p-1 rounded hover:bg-gray-100 transition-colors ${
                  currentFeedback === "helpful"
                    ? "text-green-600"
                    : "text-gray-400"
                }`}
                title="Nuttig"
              >
                <ThumbsUp size={14} />
              </button>
              <button
                onClick={() => handleFeedback("not_helpful")}
                className={`p-1 rounded hover:bg-gray-100 transition-colors ${
                  currentFeedback === "not_helpful"
                    ? "text-red-600"
                    : "text-gray-400"
                }`}
                title="Niet nuttig"
              >
                <ThumbsDown size={14} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
