"use client";

import { useState } from "react";
import { useAdminQuery, useAdminMutation, useAdminAction } from "../AdminAuthContext";
import { api } from "@/convex/_generated/api";
import { ThumbsDown, ChevronDown, ChevronUp, Sparkles, Check, BookOpen, ScrollText, Loader2, Archive } from "lucide-react";

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString("nl-NL", {
    day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

type SuggestResult = {
  probleem: string;
  type: "rules" | "knowledge";
  reden: string;
  toevoeging: string;
  knowledge_question: string;
  knowledge_answer: string;
  knowledge_category: string;
};

function ConversationBubbles({ messages, flaggedContent }: {
  messages: { role: string; content: string; isFlagged: boolean }[];
  flaggedContent: string;
}) {
  return (
    <div className="space-y-2 py-3 px-4 bg-gray-50 rounded-xl border border-gray-100">
      {messages.map((m, i) => (
        <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
          <div className={`max-w-[80%] px-3 py-2 rounded-xl text-sm leading-relaxed ${
            m.isFlagged
              ? "bg-orange-100 border-2 border-orange-400 text-gray-800"
              : m.role === "user"
              ? "bg-primary-900 text-white rounded-br-sm"
              : "bg-white border border-gray-200 text-gray-800 rounded-bl-sm"
          }`}>
            {m.isFlagged && (
              <div className="flex items-center gap-1 text-xs text-orange-600 font-medium mb-1">
                <ThumbsDown size={10} /> slecht beoordeeld
              </div>
            )}
            {m.content}
          </div>
        </div>
      ))}
    </div>
  );
}

function SlechteAntwoordItem({ item }: { item: any }) {
  const [showConversation, setShowConversation] = useState(false);
  const [analysing, setAnalysing] = useState(false);
  const [suggestion, setSuggestion] = useState<SuggestResult | null>(null);
  const [editedText, setEditedText] = useState("");
  const [editedType, setEditedType] = useState<"rules" | "knowledge">("rules");
  const [editedQuestion, setEditedQuestion] = useState("");
  const [editedAnswer, setEditedAnswer] = useState("");
  const [editedCategory, setEditedCategory] = useState("");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const suggestFix = useAdminAction(api.admin.suggestFix);
  const appendToRules = useAdminMutation(api.admin.appendToRules);
  const addKnowledge = useAdminMutation(api.admin.addKnowledgeEntryFromAdmin);
  const markHandled = useAdminMutation(api.admin.markFeedbackHandled);
  const [archived, setArchived] = useState(false);

  const handleAnalyse = async () => {
    setAnalysing(true);
    try {
      const conv = (item.fullConversation ?? []).map((m: any) => ({ role: m.role, content: m.content }));
      const result = await suggestFix({ conversation: conv, badResponse: item.botResponse }) as SuggestResult;
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
        await addKnowledge({
          question: editedQuestion,
          answer: editedAnswer,
          category: editedCategory || "Overig",
        });
      }
      setSaved(true);
    } finally {
      setSaving(false);
    }
  };

  if (archived) return null;

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-5 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
        <span className="text-xs text-gray-400">{formatDate(item.createdAt)}</span>
        {item.userId && <span className="text-xs text-gray-400">Ingelogde gebruiker</span>}
      </div>

      {/* Context: user message */}
      {item.userMessage && (
        <div className="px-5 py-4 border-b border-gray-100">
          <p className="text-xs font-medium text-gray-400 mb-1.5">Bezoeker schreef</p>
          <p className="text-sm text-gray-700 leading-relaxed">{item.userMessage}</p>
        </div>
      )}

      {/* Bad response */}
      <div className="px-5 py-4 border-b border-gray-100">
        <div className="flex items-center gap-2 mb-1.5">
          <p className="text-xs font-medium text-orange-500">Benji antwoordde</p>
          <span className="flex items-center gap-0.5 text-xs text-orange-400">
            <ThumbsDown size={10} /> niet behulpzaam
          </span>
        </div>
        <p className="text-sm text-gray-700 leading-relaxed">{item.botResponse}</p>
      </div>

      {/* Actions bar */}
      <div className="px-5 py-3 flex items-center gap-3 flex-wrap">
        {/* Toon gesprek toggle */}
        <button
          onClick={() => setShowConversation(!showConversation)}
          className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg px-3 py-1.5 transition-colors"
        >
          {showConversation ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          {showConversation ? "Verberg gesprek" : "Toon volledig gesprek"}
        </button>

        {/* Archiveren */}
        {!archived && (
          <button
            onClick={async () => { await markHandled({ messageId: item._id }); setArchived(true); }}
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 border border-gray-200 rounded-lg px-3 py-1.5 transition-colors"
            title="Archiveer — verdwijnt uit de lijst"
          >
            <Archive size={13} /> Archiveren
          </button>
        )}

        {/* Analyseer knop */}
        {!suggestion && !saved && !archived && (
          <button
            onClick={handleAnalyse}
            disabled={analysing}
            className="flex items-center gap-1.5 text-xs bg-primary-600 text-white rounded-lg px-3 py-1.5 hover:bg-primary-700 disabled:opacity-60 transition-colors"
          >
            {analysing ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
            {analysing ? "Analyseren..." : "Stel oplossing voor"}
          </button>
        )}

        {saved && (
          <span className="flex items-center gap-1.5 text-xs text-green-600 font-medium">
            <Check size={13} /> Opgeslagen
          </span>
        )}
      </div>

      {/* Volledig gesprek */}
      {showConversation && item.fullConversation && (
        <div className="px-5 pb-4">
          <ConversationBubbles messages={item.fullConversation} flaggedContent={item.botResponse} />
        </div>
      )}

      {/* Suggestie panel */}
      {suggestion && !saved && (
        <div className="mx-5 mb-5 border border-primary-200 rounded-xl overflow-hidden">
          {/* Analyse resultaat */}
          <div className="px-4 py-3 bg-primary-50 border-b border-primary-100">
            <p className="text-xs font-semibold text-primary-800 mb-0.5">Analyse</p>
            <p className="text-sm text-primary-700">{suggestion.probleem}</p>
            <p className="text-xs text-primary-500 mt-1">{suggestion.reden}</p>
          </div>

          {/* Type toggle */}
          <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
            <p className="text-xs font-medium text-gray-500 mr-1">Toevoegen aan:</p>
            <button
              onClick={() => setEditedType("rules")}
              className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                editedType === "rules"
                  ? "bg-primary-600 text-white border-primary-600"
                  : "text-gray-600 border-gray-200 hover:border-primary-300"
              }`}
            >
              <ScrollText size={12} /> Rules
            </button>
            <button
              onClick={() => setEditedType("knowledge")}
              className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                editedType === "knowledge"
                  ? "bg-primary-600 text-white border-primary-600"
                  : "text-gray-600 border-gray-200 hover:border-primary-300"
              }`}
            >
              <BookOpen size={12} /> Knowledge Base
            </button>
          </div>

          {/* Bewerkbaar veld */}
          <div className="px-4 py-3 space-y-3">
            {editedType === "rules" ? (
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Toe te voegen regel</label>
                <textarea
                  value={editedText}
                  onChange={(e) => setEditedText(e.target.value)}
                  rows={4}
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-primary-400"
                />
              </div>
            ) : (
              <>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Vraag</label>
                  <input
                    type="text"
                    value={editedQuestion}
                    onChange={(e) => setEditedQuestion(e.target.value)}
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-primary-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Antwoord voor Benji</label>
                  <textarea
                    value={editedAnswer}
                    onChange={(e) => setEditedAnswer(e.target.value)}
                    rows={4}
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-primary-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Categorie</label>
                  <input
                    type="text"
                    value={editedCategory}
                    onChange={(e) => setEditedCategory(e.target.value)}
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-primary-400"
                  />
                </div>
              </>
            )}

            <button
              onClick={handleApprove}
              disabled={saving || (editedType === "rules" ? !editedText.trim() : !editedQuestion.trim() || !editedAnswer.trim())}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
              {saving ? "Opslaan..." : "Goedkeuren en opslaan"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SlechteAntwoordenPage() {
  const items = useAdminQuery(api.admin.getNotHelpfulMessages, {});

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Onbevredigende antwoorden</h1>
          <p className="text-sm text-gray-500 mt-1">
            Berichten die bezoekers als niet behulpzaam hebben gemarkeerd
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-orange-100 text-orange-700 rounded-full text-sm font-medium">
          <ThumbsDown size={14} />
          {items?.length ?? 0} gemarkeerd
        </div>
      </div>

      {items === undefined && (
        <div className="text-center py-12 text-gray-400">Laden...</div>
      )}

      {items?.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          Nog geen onbevredigende antwoorden gemarkeerd.
        </div>
      )}

      {items && items.length > 0 && (
        <div className="space-y-4">
          {items.map((item: any) => (
            <SlechteAntwoordItem key={item._id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
