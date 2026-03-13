"use client";

import { useState } from "react";
import { useAdminQuery, useAdminMutation } from "../AdminAuthContext";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import {
  MessageSquare,
  Calendar,
  Star,
  Trash2,
  AlertCircle,
  CheckCircle,
  Clock,
  ThumbsDown,
  Loader,
  RefreshCw,
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

const STATUS_CONFIG = {
  resolved: { label: "Opgelost", icon: CheckCircle, color: "text-green-600", bg: "bg-green-50 border-green-200" },
  escalated: { label: "Geëscaleerd", icon: AlertCircle, color: "text-amber-600", bg: "bg-amber-50 border-amber-200" },
  abandoned: { label: "Afgehaakt", icon: Clock, color: "text-red-500", bg: "bg-red-50 border-red-200" },
  active: { label: "Actief", icon: MessageSquare, color: "text-blue-600", bg: "bg-blue-50 border-blue-200" },
};

export default function AdminChatHistory() {
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "resolved" | "escalated" | "abandoned"
  >("all");

  const sessions = useAdminQuery(
    api.admin.listChatHistory,
    statusFilter === "all"
      ? { limit: 100 }
      : { limit: 100, status: statusFilter }
  );

  const deleteChatSession = useAdminMutation(api.admin.deleteChatSession);
  const retriggerRapporten = useAdminMutation(api.admin.retriggerRapporten);
  const [retriggerMsg, setRetriggerMsg] = useState<string | null>(null);

  const handleRetrigger = async () => {
    const n = await retriggerRapporten({});
    setRetriggerMsg(`${n} rapport${n !== 1 ? "ten" : ""} ingepland.`);
    setTimeout(() => setRetriggerMsg(null), 5000);
  };

  const handleDeleteSession = async (sessionId: Id<"chatSessions">) => {
    if (!confirm("Dit gesprek verwijderen?")) return;
    await deleteChatSession({ sessionId });
  };

  const sessionsZonderRapport = (sessions ?? []).filter(
    (s: any) => !s.adminRapport && s.status !== "active"
  ).length;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-primary-900">
            Gesprekskwaliteit
          </h1>
          <p className="text-sm text-primary-700 mt-1">
            Automatische analyse van elk gesprek. Geen letterlijke berichten zichtbaar.
          </p>
        </div>
        <button
          onClick={handleRetrigger}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary-100 hover:bg-primary-200 text-primary-700 font-medium transition-colors text-sm flex-shrink-0"
        >
          <RefreshCw size={14} />
          Genereer rapporten
        </button>
      </div>

      {/* Filter */}
      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-sm text-primary-700">Filter:</span>
        {(["all", "abandoned", "escalated", "resolved", "active"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              statusFilter === s
                ? "bg-primary-600 text-white"
                : "bg-white border border-primary-200 text-primary-700 hover:bg-primary-50"
            }`}
          >
            {s === "all" ? "Alle" : STATUS_CONFIG[s]?.label ?? s}
          </button>
        ))}
      </div>

      {/* Melding nog te analyseren + knop */}
      {sessionsZonderRapport > 0 && (
        <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200 text-sm text-amber-800">
          <div className="flex items-center gap-2">
            <Loader size={15} className="animate-spin flex-shrink-0" />
            {sessionsZonderRapport} gesprek{sessionsZonderRapport > 1 ? "ken zonder" : " zonder"} rapport
          </div>
          <button
            onClick={handleRetrigger}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-800 font-medium transition-colors text-xs"
          >
            <RefreshCw size={13} />
            Genereer rapporten
          </button>
        </div>
      )}
      {retriggerMsg && (
        <div className="px-4 py-3 rounded-xl bg-green-50 border border-green-200 text-sm text-green-800">
          ✓ {retriggerMsg} Rapporten verschijnen binnen een minuut.
        </div>
      )}

      {sessions === undefined ? (
        <div className="flex justify-center min-h-[200px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
        </div>
      ) : sessions.length === 0 ? (
        <div className="bg-white rounded-xl border border-primary-200 p-8 text-center text-primary-600">
          <MessageSquare className="w-12 h-12 mx-auto mb-3 text-primary-300" />
          <p>Geen gesprekken gevonden.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map((session: any) => {
            const cfg = STATUS_CONFIG[session.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.active;
            const StatusIcon = cfg.icon;

            return (
              <div
                key={session._id}
                className={`bg-white rounded-xl border overflow-hidden shadow-sm ${
                  session.status === "abandoned" || session.status === "escalated"
                    ? "border-l-4 " + (session.status === "abandoned" ? "border-l-red-400" : "border-l-amber-400") + " border-primary-200"
                    : "border-primary-200"
                }`}
              >
                {/* Header */}
                <div className="flex items-start gap-3 px-4 py-3">
                  <StatusIcon size={16} className={`${cfg.color} mt-0.5 flex-shrink-0`} />

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 text-sm">
                      <span className="font-medium text-primary-900">
                        {session.userEmail
                          ? session.userEmail.replace(/(.{2}).*(@.*)/, "$1***$2")
                          : "Anoniem"}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium border ${cfg.bg} ${cfg.color}`}>
                        {cfg.label}
                      </span>
                      {session.rating !== undefined && (
                        <span className="flex items-center gap-1 text-xs text-primary-500">
                          <Star size={11} />
                          {session.rating}/5
                        </span>
                      )}
                      {session.feedbackComment && (
                        <span className="flex items-center gap-1 text-xs text-primary-500">
                          <ThumbsDown size={11} />
                          feedback
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 mt-0.5 text-xs text-primary-400">
                      <Calendar size={11} />
                      {formatDate(session.startedAt)}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDeleteSession(session._id)}
                    className="p-1.5 text-gray-300 hover:text-red-400 transition-colors flex-shrink-0"
                    title="Gesprek verwijderen"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>

                {/* Rapport */}
                <div className="px-4 pb-4">
                  {session.adminRapport ? (
                    <div className="bg-primary-50/60 rounded-lg p-3 text-sm leading-relaxed text-primary-800 whitespace-pre-wrap">
                      {session.adminRapport}
                    </div>
                  ) : session.status === "active" ? (
                    <p className="text-xs text-primary-400 italic">Gesprek is nog actief.</p>
                  ) : (
                    <div className="flex items-center gap-2 text-xs text-primary-400 italic">
                      <Loader size={12} className="animate-spin" />
                      Rapport wordt gegenereerd...
                    </div>
                  )}

                  {/* Feedback comment apart tonen als het er is */}
                  {session.feedbackComment && (
                    <div className="mt-2 px-3 py-2 rounded-lg border border-amber-200 bg-amber-50 text-xs text-amber-800">
                      <span className="font-medium">Feedback van gebruiker: </span>
                      {session.feedbackComment}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
