"use client";

import { useState, useMemo } from "react";
import { useAdminQuery, useAdminMutation, useAdminAction } from "../AdminAuthContext";
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
  Sparkles,
  ScrollText,
  BookOpen,
  Check,
  Loader2,
  ChevronDown,
  ChevronRight,
  Archive,
  Eye,
  TrendingUp,
  ExternalLink,
} from "lucide-react";

type SuggestResult = {
  probleem: string;
  type: "rules" | "knowledge";
  reden: string;
  toevoeging: string;
  knowledge_question: string;
  knowledge_answer: string;
  knowledge_category: string;
};

function stripMarkdown(text: string): string {
  return text.replace(/\*\*(.*?)\*\*/g, "$1").replace(/\*(.*?)\*/g, "$1");
}

function RapportSuggestie({ rapport, pregenerated }: { rapport: string; pregenerated?: string }) {
  const [analysing, setAnalysing] = useState(false);
  const [suggestion, setSuggestion] = useState<SuggestResult | null>(null);
  const [editedType, setEditedType] = useState<"rules" | "knowledge">("rules");
  const [editedText, setEditedText] = useState("");
  const [editedQuestion, setEditedQuestion] = useState("");
  const [editedAnswer, setEditedAnswer] = useState("");
  const [editedCategory, setEditedCategory] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const suggestFix = useAdminAction(api.admin.suggestFixFromRapport);
  const appendToRules = useAdminMutation(api.admin.appendToRules);
  const addKnowledge = useAdminMutation(api.admin.addKnowledgeEntryFromAdmin);

  // Laad pre-gegenereerde suggestie direct in als die er is
  const loadPregenerated = (json: string) => {
    try {
      const result = JSON.parse(json) as SuggestResult;
      setSuggestion(result);
      setEditedType(result.type);
      setEditedText(result.toevoeging ?? "");
      setEditedQuestion(result.knowledge_question ?? "");
      setEditedAnswer(result.knowledge_answer ?? "");
      setEditedCategory(result.knowledge_category ?? "");
    } catch { /* negeer */ }
  };

  const handleAnalyse = async () => {
    if (pregenerated && !suggestion) { loadPregenerated(pregenerated); return; }
    setAnalysing(true);
    try {
      const result = await suggestFix({ rapport }) as SuggestResult;
      setSuggestion(result);
      setEditedType(result.type);
      setEditedText(result.toevoeging ?? "");
      setEditedQuestion(result.knowledge_question ?? "");
      setEditedAnswer(result.knowledge_answer ?? "");
      setEditedCategory(result.knowledge_category ?? "");
    } finally {
      setAnalysing(false);
    }
  };

  const handleApprove = async () => {
    setSaving(true);
    try {
      if (editedType === "rules") {
        await appendToRules({ addition: editedText });
      } else {
        await addKnowledge({ question: editedQuestion, answer: editedAnswer, category: editedCategory || "Overig" });
      }
      setSaved(true);
    } finally {
      setSaving(false);
    }
  };

  if (saved) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-green-600 font-medium mt-2">
        <Check size={13} /> Opgeslagen in {editedType === "rules" ? "rules" : "knowledge base"}
      </div>
    );
  }

  return (
    <div className="mt-3">
      {!suggestion && (
        <button
          onClick={handleAnalyse}
          disabled={analysing}
          className="flex items-center gap-1.5 text-xs bg-primary-600 text-white rounded-lg px-3 py-1.5 hover:bg-primary-700 disabled:opacity-60 transition-colors"
        >
          {analysing ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
          {analysing ? "Analyseren..." : "Stel verbetering voor"}
        </button>
      )}

      {suggestion && (
        <div className="border border-primary-200 rounded-xl overflow-hidden">
          <div className="px-4 py-3 bg-primary-50 border-b border-primary-100">
            <p className="text-xs font-semibold text-primary-800 mb-0.5">Analyse</p>
            <p className="text-sm text-primary-700">{suggestion.probleem}</p>
            <p className="text-xs text-primary-500 mt-1">{suggestion.reden}</p>
          </div>

          <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
            <p className="text-xs font-medium text-gray-500 mr-1">Toevoegen aan:</p>
            <button
              onClick={() => setEditedType("rules")}
              className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-colors ${editedType === "rules" ? "bg-primary-600 text-white border-primary-600" : "text-gray-600 border-gray-200 hover:border-primary-300"}`}
            >
              <ScrollText size={12} /> Rules
            </button>
            <button
              onClick={() => setEditedType("knowledge")}
              className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-colors ${editedType === "knowledge" ? "bg-primary-600 text-white border-primary-600" : "text-gray-600 border-gray-200 hover:border-primary-300"}`}
            >
              <BookOpen size={12} /> Knowledge base
            </button>
          </div>

          <div className="px-4 py-3 space-y-2">
            {editedType === "rules" ? (
              <div className="space-y-2">
                <p className="text-xs text-gray-600 leading-relaxed">{editedText || suggestion?.toevoeging}</p>
                <a
                  href={`/admin?suggestion=${encodeURIComponent(editedText || suggestion?.toevoeging || "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  <ExternalLink size={12} />
                  Open in rules editor
                </a>
                <p className="text-xs text-gray-400">Pas de relevante sectie aan in de editor. Niet plakken onderaan.</p>
              </div>
            ) : (
              <>
                <input
                  value={editedCategory}
                  onChange={(e) => setEditedCategory(e.target.value)}
                  className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-primary-400"
                  placeholder="Categorie"
                />
                <input
                  value={editedQuestion}
                  onChange={(e) => setEditedQuestion(e.target.value)}
                  className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-primary-400"
                  placeholder="Vraag"
                />
                <textarea
                  value={editedAnswer}
                  onChange={(e) => setEditedAnswer(e.target.value)}
                  rows={3}
                  className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-primary-400"
                  placeholder="Antwoord voor Benji"
                />
                <button
                  onClick={handleApprove}
                  disabled={saving || !editedQuestion.trim() || !editedAnswer.trim()}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                >
                  {saving ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                  {saving ? "Opslaan..." : "Toevoegen aan knowledge base"}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function RapportKaart({ session }: { session: any }) {
  const [open, setOpen] = useState(false);
  const rapportGenerating = !session.adminRapport && session.status !== "active" &&
    session.endedAt && (Date.now() - session.endedAt) < 15 * 60 * 1000;
  const rapportMislukt = !session.adminRapport && session.status !== "active" && !rapportGenerating;

  if (!session.adminRapport) {
    return (
      <div className="px-4 pb-3">
        {session.status === "active"
          ? <p className="text-xs text-primary-400 italic">Gesprek is nog actief.</p>
          : rapportGenerating
            ? <div className="flex items-center gap-2 text-xs text-primary-400 italic"><Loader size={12} className="animate-spin" />Rapport wordt gegenereerd...</div>
            : <p className="text-xs text-red-400 italic">Rapport kon niet worden gegenereerd.</p>
        }
        {session.feedbackComment && (
          <div className="mt-2 px-3 py-2 rounded-lg border border-amber-200 bg-amber-50 text-xs text-amber-800">
            <span className="font-medium">Feedback: </span>{session.feedbackComment}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="px-4 pb-4">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 text-xs font-medium text-primary-600 hover:text-primary-800 mb-2 transition-colors"
      >
        {open ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
        {open ? "Rapport verbergen" : "Rapport bekijken"}
        {session.rapportSuggestie && !open && (
          <span className="ml-1 flex items-center gap-1 text-amber-600"><Sparkles size={11} /> suggestie klaar</span>
        )}
      </button>
      {open && (
        <>
          <div className="bg-primary-50/60 rounded-lg p-3 text-sm leading-relaxed text-primary-800 whitespace-pre-wrap mb-2">
            {stripMarkdown(session.adminRapport)}
          </div>
          <RapportSuggestie rapport={session.adminRapport} pregenerated={session.rapportSuggestie} />
        </>
      )}
      {session.feedbackComment && (
        <div className="mt-2 px-3 py-2 rounded-lg border border-amber-200 bg-amber-50 text-xs text-amber-800">
          <span className="font-medium">Feedback: </span>{session.feedbackComment}
        </div>
      )}
    </div>
  );
}

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
  resolved: { label: "Goed gesprek", icon: CheckCircle, color: "text-green-600", bg: "bg-green-50 border-green-200" },
  escalated: { label: "Opvolging nodig", icon: AlertCircle, color: "text-amber-600", bg: "bg-amber-50 border-amber-200" },
  abandoned: { label: "Afgehaakt", icon: Clock, color: "text-red-500", bg: "bg-red-50 border-red-200" },
  active: { label: "Actief", icon: MessageSquare, color: "text-blue-600", bg: "bg-blue-50 border-blue-200" },
  reviewed: { label: "Bekeken", icon: Eye, color: "text-gray-500", bg: "bg-gray-50 border-gray-200" },
};

function StatusActies({ session }: { session: any }) {
  const setStatus = useAdminMutation(api.admin.setSessionStatus);
  const [loading, setLoading] = useState<string | null>(null);
  const [localStatus, setLocalStatus] = useState<string>(session.status);
  const [correcting, setCorrecting] = useState(false);

  if (!session.adminRapport) return null;

  const isCategorised = localStatus === "resolved" || localStatus === "escalated" || localStatus === "reviewed";

  const handle = async (status: "resolved" | "escalated" | "reviewed" | "abandoned", clearReviewed?: boolean) => {
    setLoading(status);
    try {
      await setStatus({ sessionId: session._id, status, clearReviewed });
      setLocalStatus(status);
      setCorrecting(false);
    } finally {
      setLoading(null);
    }
  };

  const ACTIES = [
    { status: "resolved" as const, label: "Goed gesprek", icon: CheckCircle, cls: "bg-green-50 text-green-700 border-green-200 hover:bg-green-100" },
    { status: "escalated" as const, label: "Opvolging nodig", icon: AlertCircle, cls: "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100" },
    { status: "abandoned" as const, label: "Afgehaakt", icon: Clock, cls: "bg-red-50 text-red-600 border-red-200 hover:bg-red-100" },
    { status: "reviewed" as const, label: "Bekeken", icon: Archive, cls: "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100" },
  ];

  // Al gecategoriseerd — toon huidige status + corrigeeroptie
  if (isCategorised && !correcting) {
    const cfg = STATUS_CONFIG[localStatus as keyof typeof STATUS_CONFIG];
    return (
      <div className="px-4 pb-3 pt-2 border-t border-gray-100 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <Check size={12} className="text-green-500" />
          <span className={`font-medium ${cfg?.color}`}>{cfg?.label ?? localStatus}</span>
        </div>
        <button
          onClick={() => setCorrecting(true)}
          className="text-xs text-gray-400 hover:text-primary-600 underline transition-colors"
        >
          Wijzig
        </button>
      </div>
    );
  }

  // Knoppen (nieuw of bij corrigeren)
  return (
    <div className="px-4 pb-3 pt-2 border-t border-gray-100">
      <p className="text-xs text-gray-400 mb-2">
        {correcting ? "Verplaats naar een andere categorie:" : "Na beoordeling verplaatsen naar:"}
      </p>
      <div className="flex flex-wrap gap-2">
        {ACTIES.map(({ status, label, icon: Icon, cls }) => (
          <button
            key={status}
            onClick={() => handle(status)}
            disabled={!!loading || localStatus === status}
            className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border disabled:opacity-40 transition-colors ${cls}`}
          >
            {loading === status ? <Loader2 size={11} className="animate-spin" /> : <Icon size={11} />}
            {label}
          </button>
        ))}
        {correcting && (
          <button
            onClick={() => handle("abandoned", true)}
            disabled={!!loading}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-white text-gray-500 border border-gray-200 hover:bg-gray-50 disabled:opacity-40 transition-colors"
          >
            {loading === "abandoned" ? <Loader2 size={11} className="animate-spin" /> : <RefreshCw size={11} />}
            Zet terug naar Alle
          </button>
        )}
        {correcting && (
          <button
            onClick={() => setCorrecting(false)}
            className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1.5 transition-colors"
          >
            Annuleer
          </button>
        )}
      </div>
    </div>
  );
}

export default function AdminChatHistory() {
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "resolved" | "escalated" | "abandoned" | "reviewed"
  >("all");

  const allSessions = useAdminQuery(api.admin.listChatHistory, { limit: 200 });

  const sessions = useMemo(() => {
    if (!allSessions) return undefined;
    if (statusFilter === "all") {
      // Inbox: alleen sessies die nog niet handmatig beoordeeld zijn
      return (allSessions as any[]).filter((s) => !s.reviewedAt);
    }
    return (allSessions as any[]).filter((s) => s.status === statusFilter);
  }, [allSessions, statusFilter]);

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

  // Patroondetectie: groepeer terugkerende problemen uit rapport-suggesties
  const patronen = useMemo(() => {
    if (!sessions) return [];
    const counts: Record<string, { count: number; type: string }> = {};
    for (const s of sessions as any[]) {
      if (!s.rapportSuggestie) continue;
      try {
        const parsed = JSON.parse(s.rapportSuggestie);
        const key = (parsed.probleem as string)?.slice(0, 80) ?? "onbekend";
        if (!counts[key]) counts[key] = { count: 0, type: parsed.type ?? "rules" };
        counts[key].count++;
      } catch { /* skip */ }
    }
    return Object.entries(counts)
      .filter(([, v]) => v.count >= 2)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 6);
  }, [sessions]);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-primary-900">
            Gesprekskwaliteit
          </h1>
          <p className="text-sm text-primary-700 mt-1">
            Bekijk elk rapport en categoriseer handmatig. Geen letterlijke berichten zichtbaar.
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

      {/* Terugkerende patronen */}
      {patronen.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={15} className="text-amber-600" />
            <p className="text-sm font-semibold text-amber-800">Terugkerende patronen</p>
            <span className="text-xs text-amber-600 ml-1">— hetzelfde probleem meerdere keren gesignaleerd</span>
          </div>
          <div className="space-y-1.5">
            {patronen.map(([probleem, info]) => (
              <div key={probleem} className="flex items-start gap-2 text-xs text-amber-800">
                <span className="flex-shrink-0 mt-0.5 w-5 h-5 rounded-full bg-amber-200 text-amber-800 font-bold flex items-center justify-center text-[10px]">
                  {info.count}×
                </span>
                <span>{probleem}</span>
                <span className="ml-auto flex-shrink-0 text-amber-500 italic">{info.type === "knowledge" ? "knowledge base" : "rules"}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter */}
      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-sm text-primary-700">Filter:</span>
        {(["all", "abandoned", "escalated", "resolved", "reviewed", "active"] as const).map((s) => (
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

                {/* Rapport — inklapbaar */}
                <RapportKaart session={session} />

                {/* Status actieknoppen — altijd tonen als rapport beschikbaar */}
                <StatusActies session={session} />
                </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
