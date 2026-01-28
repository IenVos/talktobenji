"use client";

import { useEffect, useRef, useState } from "react";
import { X, Minus, MessageCircle } from "lucide-react";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id, Doc } from "@/convex/_generated/dataModel";
import { ChatMessage } from "./ChatMessage";
import { ChatInput } from "./ChatInput";

interface ChatWindowProps {
  sessionId: Id<"chatSessions"> | null;
  onClose: () => void;
  onMinimize: () => void;
  onStartSession: () => Promise<Id<"chatSessions">>;
}

export function ChatWindow({
  sessionId,
  onClose,
  onMinimize,
  onStartSession,
}: ChatWindowProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState(sessionId);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const messages = useQuery(
    api.chat.getMessages,
    currentSessionId ? { sessionId: currentSessionId } : "skip"
  );

  const handleUserMessage = useAction(api.ai.handleUserMessage);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    setCurrentSessionId(sessionId);
  }, [sessionId]);

  const handleSend = async (message: string) => {
    setIsLoading(true);

    try {
      let activeSessionId = currentSessionId;

      if (!activeSessionId) {
        activeSessionId = await onStartSession();
        setCurrentSessionId(activeSessionId);
      }

      await handleUserMessage({
        sessionId: activeSessionId,
        userMessage: message,
      });
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-t-2xl shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-primary-600 text-white">
        <div className="flex items-center gap-2">
          <MessageCircle size={20} />
          <div>
            <h3 className="font-semibold text-sm">TalkToBenji Support</h3>
            <p className="text-xs text-primary-100">We helpen je graag</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onMinimize}
            className="p-1.5 hover:bg-primary-500 rounded transition-colors"
          >
            <Minus size={18} />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-primary-500 rounded transition-colors"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {!currentSessionId && (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 bg-primary-100 rounded-full flex items-center justify-center">
              <MessageCircle className="text-primary-600" size={32} />
            </div>
            <h4 className="font-semibold text-gray-900 mb-1">
              Welkom bij TalkToBenji Support
            </h4>
            <p className="text-sm text-gray-500">
              Stel je vraag en we helpen je direct.
            </p>
          </div>
        )}

        {messages?.map((msg: Doc<"chatMessages">) => (
          <ChatMessage
            key={msg._id}
            id={msg._id}
            role={msg.role}
            content={msg.content}
            createdAt={msg.createdAt}
            feedback={msg.feedback}
            isAiGenerated={msg.isAiGenerated}
          />
        ))}

        {isLoading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center">
              <MessageCircle size={18} />
            </div>
            <div className="bg-gray-100 rounded-2xl rounded-tl-none px-4 py-2">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                <span
                  className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: "0.1s" }}
                />
                <span
                  className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: "0.2s" }}
                />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <ChatInput onSend={handleSend} disabled={isLoading} />
    </div>
  );
}
