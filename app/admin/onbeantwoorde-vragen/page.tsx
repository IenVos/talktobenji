"use client";

import { useState } from "react";
import { useAdminQuery, useAdminMutation } from "../AdminAuthContext";
import { api } from "@/convex/_generated/api";
import { HelpCircle, Plus, Trash2, RefreshCw } from "lucide-react";
import Link from "next/link";

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString("nl-NL", {
    day: "numeric", month: "long", year: "numeric",
  });
}

function QuestionItem({ item }: { item: any }) {
  const [dismissed, setDismissed] = useState(false);
  const [confirmDismiss, setConfirmDismiss] = useState(false);
  const dismiss = useAdminMutation(api.admin.dismissUnansweredQuestion);

  if (dismissed) return null;

  return (
    <div className="flex items-start justify-between gap-3 py-3 border-b border-gray-100 last:border-0">
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-800 leading-snug">{item.question}</p>
        <div className="flex items-center gap-3 mt-1">
          {item.count > 1 && (
            <span className="text-xs font-medium text-amber-600">{item.count}× gesteld</span>
          )}
          <span className="text-xs text-gray-400">{formatDate(item.lastAt)}</span>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        <Link
          href={`/admin/knowledge?question=${encodeURIComponent(item.question)}`}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-primary-600 bg-primary-50 border border-primary-200 rounded-lg hover:bg-primary-100 transition-colors"
        >
          <Plus size={13} />
          Toevoegen aan KB
        </Link>

        {!confirmDismiss ? (
          <button
            onClick={() => setConfirmDismiss(true)}
            className="p-1.5 text-gray-300 hover:text-red-400 transition-colors rounded-lg hover:bg-red-50"
            title="Verwijderen"
          >
            <Trash2 size={14} />
          </button>
        ) : (
          <span className="flex items-center gap-1.5 text-xs text-red-600 border border-red-200 rounded-lg px-2 py-1 bg-red-50">
            <span>Weggooien?</span>
            <button
              onClick={async () => { await dismiss({ ids: item.ids }); setDismissed(true); }}
              className="font-semibold underline hover:no-underline"
            >
              Ja
            </button>
            <button onClick={() => setConfirmDismiss(false)} className="text-gray-400 underline hover:no-underline">
              Nee
            </button>
          </span>
        )}
      </div>
    </div>
  );
}

export default function OnbeantwoordeVragenPage() {
  const items = useAdminQuery(api.admin.getUnansweredQuestions, {});

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Onbeantwoorde vragen</h1>
          <p className="text-sm text-gray-500 mt-1">
            Vragen waar Benji geen antwoord op had — voeg ze toe aan de Knowledge Base
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-100 text-amber-700 rounded-full text-sm font-medium">
          <HelpCircle size={14} />
          {items?.length ?? 0} uniek
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        {items === undefined && (
          <div className="flex items-center justify-center py-12 text-gray-400">
            <RefreshCw size={20} className="animate-spin mr-2" /> Laden...
          </div>
        )}

        {items?.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            Geen onbeantwoorde vragen. Benji kon alle vragen beantwoorden.
          </div>
        )}

        {items && items.length > 0 && (
          <div className="px-5 py-2">
            {items.map((item: any, i: number) => (
              <QuestionItem key={i} item={item} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
