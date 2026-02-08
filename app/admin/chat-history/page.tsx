"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import {
  MessageSquare,
  ChevronDown,
  ChevronRight,
  Calendar,
  Tag,
  Star,
} from "lucide-react";

function formatDate(ts: number) {
  const d = new Date(ts);
  return d.toLocaleString("nl-NL", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AdminChatHistory() {
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "resolved" | "escalated" | "abandoned"
  >("all");
  const [expandedSessionId, setExpandedSessionId] =
    useState<Id<"chatSessions"> | null>(null);

  const sessions = useQuery(
    api.admin.listChatHistory,
    statusFilter === "all"
      ? { limit: 100 }
      : { limit: 100, status: statusFilter }
  );

  const detail = useQuery(
    api.admin.getChatHistoryDetail,
    expandedSessionId ? { sessionId: expandedSessionId } : "skip"
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-primary-900">
          Chat history
        </h1>
        <p className="text-sm text-primary-700 mt-1">
          Overzicht van alle chatgesprekken met Benji
        </p>
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-sm text-primary-700">Filter:</span>
        {(["all", "active", "resolved", "escalated", "abandoned"] as const).map(
          (s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === s
                  ? "bg-primary-600 text-white"
                  : "bg-white border border-primary-200 text-primary-700 hover:bg-primary-50"
              }`}
            >
              {s === "all" ? "Alle" : s}
            </button>
          )
        )}
      </div>

      {sessions === undefined ? (
        <div className="flex justify-center min-h-[200px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
        </div>
      ) : sessions.length === 0 ? (
        <div className="bg-white rounded-xl border border-primary-200 p-8 text-center text-primary-600">
          <MessageSquare className="w-12 h-12 mx-auto mb-3 text-primary-300" />
          <p>Nog geen chatgesprekken.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {sessions.map((session) => {
            const isExpanded = expandedSessionId === session._id;
            return (
              <div
                key={session._id}
                className="bg-white rounded-xl border border-primary-200 overflow-hidden shadow-sm"
              >
                <button
                  onClick={() =>
                    setExpandedSessionId(isExpanded ? null : session._id)
                  }
                  className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-primary-50/50 transition-colors"
                >
                  {isExpanded ? (
                    <ChevronDown size={18} className="text-primary-600" />
                  ) : (
                    <ChevronRight size={18} className="text-primary-600" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 text-sm">
                      <span className="font-medium text-primary-900">
                        {session.userEmail ?? session.userName ?? "Anoniem"}
                      </span>
                      {session.topic && (
                        <span className="flex items-center gap-1 text-primary-600">
                          <Tag size={14} />
                          {session.topic}
                        </span>
                      )}
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-medium ${
                          session.status === "resolved"
                            ? "bg-green-100 text-green-800"
                            : session.status === "escalated"
                            ? "bg-amber-100 text-amber-800"
                            : session.status === "active"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {session.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-xs text-primary-500">
                      <span className="flex items-center gap-1">
                        <Calendar size={12} />
                        {formatDate(session.startedAt)}
                      </span>
                      {session.rating !== undefined && (
                        <span className="flex items-center gap-1">
                          <Star size={12} />
                          {session.rating}/5
                        </span>
                      )}
                    </div>
                  </div>
                </button>

                {isExpanded && detail && (
                  <div className="border-t border-primary-100 bg-primary-50/30 px-4 py-3 space-y-3 max-h-[400px] overflow-y-auto">
                    {detail.messages.map((msg) => (
                      <div
                        key={msg._id}
                        className={`flex ${
                          msg.role === "user" ? "justify-end" : "justify-start"
                        }`}
                      >
                        <div
                          className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                            msg.role === "user"
                              ? "bg-primary-600 text-white"
                              : "bg-white border border-primary-200 text-primary-900"
                          }`}
                        >
                          <span className="text-xs opacity-75 mr-2">
                            {msg.role === "user" ? "Gebruiker" : "Benji"}
                          </span>
                          <p className="whitespace-pre-wrap">{msg.content}</p>
                          <p className="text-xs opacity-70 mt-1">
                            {formatDate(msg.createdAt)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
