"use client";

import { useState } from "react";
import { MessageCircle } from "lucide-react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { ChatWindow } from "./ChatWindow";

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [sessionId, setSessionId] = useState<Id<"chatSessions"> | null>(null);

  const startSession = useMutation(api.chat.startSession);

  const handleStartSession = async () => {
    const newSessionId = await startSession({
      metadata: {
        browser: typeof navigator !== "undefined" ? navigator.userAgent : undefined,
        language: typeof navigator !== "undefined" ? navigator.language : undefined,
        referrer: typeof document !== "undefined" ? document.referrer : undefined,
      },
    });
    setSessionId(newSessionId);
    return newSessionId;
  };

  const handleOpen = () => {
    setIsOpen(true);
    setIsMinimized(false);
  };

  const handleClose = () => {
    setIsOpen(false);
    setIsMinimized(false);
  };

  const handleMinimize = () => {
    setIsMinimized(true);
  };

  if (!isOpen) {
    return (
      <button
        onClick={handleOpen}
        className="fixed bottom-6 right-6 w-14 h-14 bg-primary-600 text-white rounded-full shadow-lg hover:bg-primary-700 hover:scale-105 transition-all flex items-center justify-center z-50"
        aria-label="Open chat"
      >
        <MessageCircle size={24} />
      </button>
    );
  }

  if (isMinimized) {
    return (
      <button
        onClick={() => setIsMinimized(false)}
        className="fixed bottom-6 right-6 flex items-center gap-2 px-4 py-3 bg-primary-600 text-white rounded-full shadow-lg hover:bg-primary-700 transition-colors z-50"
      >
        <MessageCircle size={20} />
        <span className="text-sm font-medium">Chat openen</span>
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-[380px] h-[600px] z-50 shadow-2xl rounded-2xl overflow-hidden">
      <ChatWindow
        sessionId={sessionId}
        onClose={handleClose}
        onMinimize={handleMinimize}
        onStartSession={handleStartSession}
      />
    </div>
  );
}
