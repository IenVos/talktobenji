"use client";

import { useState } from "react";
import { useAdminQuery, useAdminMutation } from "../AdminAuthContext";
import { api } from "@/convex/_generated/api";
import { ThumbsUp, ChevronDown, ChevronUp, Archive } from "lucide-react";

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString("nl-NL", {
    day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

function GoedeAntwoordItem({ item }: { item: any }) {
  const [showConversation, setShowConversation] = useState(false);
  const [archived, setArchived] = useState(false);
  const markHandled = useAdminMutation(api.admin.markFeedbackHandled);

  if (archived) return null;

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-5 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
        <span className="text-xs text-gray-400">{formatDate(item.createdAt)}</span>
        {item.userId && <span className="text-xs text-gray-400">Ingelogde gebruiker</span>}
      </div>

      {item.userMessage && (
        <div className="px-5 py-4 border-b border-gray-100">
          <p className="text-xs font-medium text-gray-400 mb-1.5">Bezoeker schreef</p>
          <p className="text-sm text-gray-700 leading-relaxed">{item.userMessage}</p>
        </div>
      )}

      <div className="px-5 py-4 border-b border-gray-100">
        <div className="flex items-center gap-2 mb-1.5">
          <p className="text-xs font-medium text-green-600">Benji antwoordde</p>
          <span className="flex items-center gap-0.5 text-xs text-green-500">
            <ThumbsUp size={10} /> behulpzaam
          </span>
        </div>
        <p className="text-sm text-gray-700 leading-relaxed">{item.botResponse}</p>
      </div>

      <div className="px-5 py-3 flex items-center gap-3">
        <button
          onClick={() => setShowConversation(!showConversation)}
          className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg px-3 py-1.5 transition-colors"
        >
          {showConversation ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          {showConversation ? "Verberg gesprek" : "Toon volledig gesprek"}
        </button>

        <button
          onClick={async () => { await markHandled({ messageId: item._id }); setArchived(true); }}
          className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 border border-gray-200 rounded-lg px-3 py-1.5 transition-colors"
          title="Archiveer — verdwijnt uit de lijst"
        >
          <Archive size={13} /> Archiveren
        </button>
      </div>

      {showConversation && item.fullConversation && (
        <div className="px-5 pb-4 space-y-2">
          <div className="space-y-2 py-3 px-4 bg-gray-50 rounded-xl border border-gray-100">
            {item.fullConversation.map((m: any, i: number) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] px-3 py-2 rounded-xl text-sm leading-relaxed ${
                  m.role === "user"
                    ? "bg-primary-900 text-white rounded-br-sm"
                    : "bg-white border border-gray-200 text-gray-800 rounded-bl-sm"
                }`}>
                  {m.content}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function GoedeAntwoordenPage() {
  const items = useAdminQuery(api.admin.getHelpfulMessages, {});

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Goede antwoorden</h1>
          <p className="text-sm text-gray-500 mt-1">
            Antwoorden die bezoekers als behulpzaam hebben gemarkeerd — gebruik dit als inspiratie
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-green-100 text-green-700 rounded-full text-sm font-medium">
          <ThumbsUp size={14} />
          {items?.length ?? 0} gemarkeerd
        </div>
      </div>

      {items === undefined && (
        <div className="text-center py-12 text-gray-400">Laden...</div>
      )}

      {items?.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          Nog geen antwoorden als behulpzaam gemarkeerd.
        </div>
      )}

      {items && items.length > 0 && (
        <div className="space-y-4">
          {items.map((item: any) => (
            <GoedeAntwoordItem key={item._id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
