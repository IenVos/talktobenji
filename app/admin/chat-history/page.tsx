"use client";

import { useState } from "react";
import { useAdminQuery, useAdminMutation } from "../AdminAuthContext";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import {
  MessageSquare,
  ChevronDown,
  ChevronRight,
  Calendar,
  Tag,
  Star,
  Trash2,
  CheckSquare,
  Square,
  X,
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

  // Selectie state voor berichten
  const [selectedMessages, setSelectedMessages] = useState<Set<Id<"chatMessages">>>(new Set());
  const [selectMode, setSelectMode] = useState(false);

  // Selectie state voor sessies
  const [selectedSessions, setSelectedSessions] = useState<Set<Id<"chatSessions">>>(new Set());
  const [sessionSelectMode, setSessionSelectMode] = useState(false);

  const sessions = useAdminQuery(
    api.admin.listChatHistory,
    statusFilter === "all"
      ? { limit: 100 }
      : { limit: 100, status: statusFilter }
  );

  const detail = useAdminQuery(
    api.admin.getChatHistoryDetail,
    expandedSessionId ? { sessionId: expandedSessionId } : "skip"
  );

  const deleteChatMessage = useAdminMutation(api.admin.deleteChatMessage);
  const deleteChatMessages = useAdminMutation(api.admin.deleteChatMessages);
  const deleteChatSession = useAdminMutation(api.admin.deleteChatSession);

  const toggleMessage = (id: Id<"chatMessages">) => {
    setSelectedMessages((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (!detail) return;
    if (selectedMessages.size === detail.messages.length) {
      setSelectedMessages(new Set());
    } else {
      setSelectedMessages(new Set(detail.messages.map((m: any) => m._id)));
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedMessages.size === 0) return;
    if (!confirm(`${selectedMessages.size} bericht(en) verwijderen?`)) return;
    await deleteChatMessages({ messageIds: Array.from(selectedMessages) as Id<"chatMessages">[] });
    setSelectedMessages(new Set());
    setSelectMode(false);
  };

  const handleDeleteSingle = async (id: Id<"chatMessages">) => {
    if (!confirm("Dit bericht verwijderen?")) return;
    await deleteChatMessage({ messageId: id });
  };

  const handleDeleteSession = async (sessionId: Id<"chatSessions">) => {
    if (!confirm("Dit hele gesprek en alle berichten verwijderen?")) return;
    await deleteChatSession({ sessionId });
    setExpandedSessionId(null);
  };

  const toggleSession = (id: Id<"chatSessions">) => {
    setSelectedSessions((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAllSessions = () => {
    if (!sessions) return;
    if (selectedSessions.size === sessions.length) {
      setSelectedSessions(new Set());
    } else {
      setSelectedSessions(new Set(sessions.map((s: any) => s._id)));
    }
  };

  const handleDeleteSelectedSessions = async () => {
    if (selectedSessions.size === 0) return;
    if (!confirm(`${selectedSessions.size} gesprek(ken) en alle berichten verwijderen?`)) return;
    for (const id of selectedSessions) {
      await deleteChatSession({ sessionId: id });
    }
    setSelectedSessions(new Set());
    setSessionSelectMode(false);
    setExpandedSessionId(null);
  };

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

      {/* Sessie toolbar */}
      {sessions && sessions.length > 0 && (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              if (sessionSelectMode) {
                setSessionSelectMode(false);
                setSelectedSessions(new Set());
              } else {
                setSessionSelectMode(true);
              }
            }}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              sessionSelectMode
                ? "bg-primary-600 text-white"
                : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            <CheckSquare size={14} />
            {sessionSelectMode ? "Selectie uit" : "Selecteer gesprekken"}
          </button>
          {sessionSelectMode && (
            <>
              <button
                type="button"
                onClick={selectAllSessions}
                className="px-3 py-1.5 rounded-lg text-sm font-medium bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
              >
                {selectedSessions.size === sessions.length ? "Deselecteer alles" : "Selecteer alles"}
              </button>
              <button
                type="button"
                onClick={handleDeleteSelectedSessions}
                disabled={selectedSessions.size === 0}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-red-500 text-white hover:bg-red-600 disabled:opacity-50 transition-colors"
              >
                <Trash2 size={14} />
                Verwijder ({selectedSessions.size})
              </button>
            </>
          )}
        </div>
      )}

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
          {sessions.map((session: any) => {
            const isExpanded = expandedSessionId === session._id;
            return (
              <div
                key={session._id}
                className="bg-white rounded-xl border border-primary-200 overflow-hidden shadow-sm"
              >
                <div className="flex items-center">
                  {sessionSelectMode && (
                    <button
                      type="button"
                      onClick={() => toggleSession(session._id)}
                      className="pl-4 pr-1 py-3 flex-shrink-0 text-gray-400 hover:text-primary-600 transition-colors"
                    >
                      {selectedSessions.has(session._id) ? (
                        <CheckSquare size={18} className="text-primary-600" />
                      ) : (
                        <Square size={18} />
                      )}
                    </button>
                  )}
                  <button
                    onClick={() => {
                      if (sessionSelectMode) {
                        toggleSession(session._id);
                        return;
                      }
                      setExpandedSessionId(isExpanded ? null : session._id);
                      setSelectMode(false);
                      setSelectedMessages(new Set());
                    }}
                    className={`flex-1 flex items-center gap-3 ${sessionSelectMode ? "pl-2" : "px-4"} py-3 text-left hover:bg-primary-50/50 transition-colors`}
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
                  {/* Verwijder hele sessie */}
                  <button
                    type="button"
                    onClick={() => handleDeleteSession(session._id)}
                    className="p-2 mr-2 text-gray-300 hover:text-red-500 transition-colors"
                    title="Heel gesprek verwijderen"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                {isExpanded && detail && (
                  <div className="border-t border-primary-100 bg-primary-50/30">
                    {/* Toolbar voor berichten */}
                    <div className="flex items-center gap-2 px-4 py-2 border-b border-primary-100 bg-white/50">
                      <button
                        type="button"
                        onClick={() => {
                          if (selectMode) {
                            setSelectMode(false);
                            setSelectedMessages(new Set());
                          } else {
                            setSelectMode(true);
                          }
                        }}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                          selectMode
                            ? "bg-primary-600 text-white"
                            : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
                        }`}
                      >
                        <CheckSquare size={14} />
                        {selectMode ? "Selectie uit" : "Selecteer"}
                      </button>
                      {selectMode && (
                        <>
                          <button
                            type="button"
                            onClick={selectAll}
                            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
                          >
                            {selectedMessages.size === detail.messages.length ? "Deselecteer alles" : "Selecteer alles"}
                          </button>
                          <button
                            type="button"
                            onClick={handleDeleteSelected}
                            disabled={selectedMessages.size === 0}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-red-500 text-white hover:bg-red-600 disabled:opacity-50 transition-colors"
                          >
                            <Trash2 size={14} />
                            Verwijder ({selectedMessages.size})
                          </button>
                        </>
                      )}
                    </div>

                    {/* Berichten */}
                    <div className="px-4 py-3 space-y-3 max-h-[400px] overflow-y-auto">
                      {detail.messages.map((msg: any) => (
                        <div
                          key={msg._id}
                          className={`flex items-start gap-2 ${
                            msg.role === "user" ? "justify-end" : "justify-start"
                          }`}
                        >
                          {/* Checkbox links (alleen in selectie-modus) */}
                          {selectMode && msg.role !== "user" && (
                            <button
                              type="button"
                              onClick={() => toggleMessage(msg._id)}
                              className="mt-2 flex-shrink-0 text-gray-400 hover:text-primary-600 transition-colors"
                            >
                              {selectedMessages.has(msg._id) ? (
                                <CheckSquare size={16} className="text-primary-600" />
                              ) : (
                                <Square size={16} />
                              )}
                            </button>
                          )}

                          <div
                            className={`group relative max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                              msg.role === "user"
                                ? "bg-primary-600 text-white"
                                : "bg-white border border-primary-200 text-primary-900"
                            }`}
                          >
                            <span className="text-xs opacity-75 mr-2">
                              {msg.role === "user" ? "Gebruiker" : "Benji"}
                            </span>
                            <p className="whitespace-pre-wrap">{msg.content}</p>
                            <div className="flex items-center justify-between mt-1">
                              <p className="text-xs opacity-70">
                                {formatDate(msg.createdAt)}
                              </p>
                              {!selectMode && (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteSingle(msg._id)}
                                  className="ml-2 p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-red-500"
                                  title="Bericht verwijderen"
                                >
                                  <Trash2 size={12} />
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Checkbox rechts voor user berichten */}
                          {selectMode && msg.role === "user" && (
                            <button
                              type="button"
                              onClick={() => toggleMessage(msg._id)}
                              className="mt-2 flex-shrink-0 text-gray-400 hover:text-primary-600 transition-colors"
                            >
                              {selectedMessages.has(msg._id) ? (
                                <CheckSquare size={16} className="text-primary-600" />
                              ) : (
                                <Square size={16} />
                              )}
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
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
