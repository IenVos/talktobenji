"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { CalendarCheck, ChevronDown, ChevronRight, Trash2, History } from "lucide-react";
import { Paywall } from "@/components/Paywall";
import { ComingSoonSection } from "@/components/ComingSoonSection";

const MOOD_OPTIONS = [
  { value: 1, emoji: "😔", label: "Zwaar" },
  { value: 2, emoji: "😕", label: "Moeilijk" },
  { value: 3, emoji: "😐", label: "Neutraal" },
  { value: 4, emoji: "🙂", label: "Oké" },
  { value: 5, emoji: "😊", label: "Goed" },
];

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString("nl-NL", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const CHECK_IN_LABELS: Record<string, string> = {
  hoe_voel: "Hoe voel ik me vandaag?",
  wat_hielp: "Wat hielp me vandaag?",
  waar_dankbaar: "Waar ben ik dankbaar voor?",
};

export default function AccountCheckinsPage() {
  const { data: session } = useSession();
  const userId = session?.userId ?? "";

  // Check feature access
  const hasAccess = useQuery(
    api.subscriptions.hasFeatureAccess,
    session?.userId
      ? {
          userId: session.userId as string,
          email: session.user?.email || undefined,
          feature: "check_ins",
        }
      : "skip"
  );

  const checkInEntries = useQuery(
    api.reflecties.listCheckInEntries,
    userId ? { userId, limit: 200 } : "skip"
  );
  const emotionHistory = useQuery(
    api.reflecties.listEmotionHistory,
    userId ? { userId, limit: 365 } : "skip"
  );
  const createCheckInEntry = useMutation(api.reflecties.createCheckInEntry);
  const deleteCheckInEntry = useMutation(api.reflecties.deleteCheckInEntry);

  const [checkInForm, setCheckInForm] = useState({ hoe_voel: "", wat_hielp: "", waar_dankbaar: "" });
  const [checkInSaving, setCheckInSaving] = useState(false);
  const [expandedCheckInId, setExpandedCheckInId] = useState<Id<"checkInEntries"> | null>(null);

  const handleAddCheckIn = async () => {
    const { hoe_voel, wat_hielp, waar_dankbaar } = checkInForm;
    if (!userId || (!hoe_voel.trim() && !wat_hielp.trim() && !waar_dankbaar.trim())) return;
    setCheckInSaving(true);
    try {
      await createCheckInEntry({
        userId,
        hoe_voel: hoe_voel.trim() || "-",
        wat_hielp: wat_hielp.trim() || "-",
        waar_dankbaar: waar_dankbaar.trim() || "-",
      });
      setCheckInForm({ hoe_voel: "", wat_hielp: "", waar_dankbaar: "" });
    } finally {
      setCheckInSaving(false);
    }
  };

  const handleDeleteCheckIn = async (id: Id<"checkInEntries">) => {
    if (!userId || !confirm("Check-in verwijderen?")) return;
    await deleteCheckInEntry({ id, userId });
  };

  // Show loading state to prevent flash
  if (hasAccess === undefined) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-pulse rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  const content = (
    <div className="space-y-6">
      {/* Nieuwe check-in invullen */}
      <div className="bg-white rounded-xl border border-primary-200 p-6">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-primary-900 mb-4">
          <CalendarCheck size={20} className="text-primary-500" />
          Dagelijkse check-in
        </h2>
        <p className="text-sm text-gray-600 mb-4">
          Korte vragen om je gedachten te ordenen. Je kunt meerdere keren per dag inchecken.
        </p>
        <div className="space-y-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-primary-800 mb-2">Hoe voel ik me vandaag?</label>
            <textarea
              value={checkInForm.hoe_voel}
              onChange={(e) => setCheckInForm((f) => ({ ...f, hoe_voel: e.target.value }))}
              placeholder="Typ hier je antwoord…"
              rows={2}
              className="w-full px-3 py-2 border border-primary-200 rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-primary-800 mb-2">Wat hielp me vandaag?</label>
            <textarea
              value={checkInForm.wat_hielp}
              onChange={(e) => setCheckInForm((f) => ({ ...f, wat_hielp: e.target.value }))}
              placeholder="Typ hier je antwoord…"
              rows={2}
              className="w-full px-3 py-2 border border-primary-200 rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-primary-800 mb-2">Waar ben ik dankbaar voor?</label>
            <textarea
              value={checkInForm.waar_dankbaar}
              onChange={(e) => setCheckInForm((f) => ({ ...f, waar_dankbaar: e.target.value }))}
              placeholder="Typ hier je antwoord…"
              rows={2}
              className="w-full px-3 py-2 border border-primary-200 rounded-lg text-sm"
            />
          </div>
        </div>
        <button
          type="button"
          onClick={handleAddCheckIn}
          disabled={checkInSaving || (!checkInForm.hoe_voel.trim() && !checkInForm.wat_hielp.trim() && !checkInForm.waar_dankbaar.trim())}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50"
        >
          {checkInSaving ? "Bezig…" : "Toevoegen"}
        </button>
      </div>

      <ComingSoonSection section="checkins" label="Dagelijkse check-ins" />

      {/* Eerdere check-ins */}
      <div className="bg-white rounded-xl border border-primary-200 p-6">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-primary-900 mb-4">
          <History size={20} className="text-primary-500" />
          Eerdere check-ins
        </h2>
        {checkInEntries === undefined ? (
          <div className="flex justify-center py-8">
            <div className="animate-pulse rounded-full h-8 w-8 border-b-2 border-primary-600" />
          </div>
        ) : checkInEntries.length === 0 ? (
          <p className="text-gray-500 text-sm">Nog geen check-ins ingevuld.</p>
        ) : (
          <div className="space-y-2">
            {checkInEntries.map((entry: any) => {
              const isExpanded = expandedCheckInId === entry._id;
              return (
                <div key={entry._id} className="rounded-lg border border-primary-200 overflow-hidden">
                  <div className="flex items-center gap-2 px-4 py-3 bg-white">
                    <button
                      type="button"
                      onClick={() => setExpandedCheckInId(isExpanded ? null : entry._id)}
                      className="flex items-center gap-2 text-left hover:bg-primary-50/50 rounded transition-colors flex-1 min-w-0"
                    >
                      {isExpanded ? <ChevronDown size={18} className="text-primary-600 flex-shrink-0" /> : <ChevronRight size={18} className="text-primary-600 flex-shrink-0" />}
                      <span className="font-medium text-primary-900 truncate">{formatDate(entry.createdAt)}</span>
                    </button>
                    <button type="button" onClick={() => handleDeleteCheckIn(entry._id)} className="p-2 text-gray-400 hover:text-red-600 rounded-lg flex-shrink-0" aria-label="Verwijderen">
                      <Trash2 size={18} />
                    </button>
                  </div>
                  {isExpanded && (
                    <div className="px-4 pb-4 pt-0 space-y-2 bg-primary-50/30">
                      {(["hoe_voel", "wat_hielp", "waar_dankbaar"] as const).map((key) =>
                        entry[key] && entry[key] !== "-" && (
                          <div key={key}>
                            <p className="text-xs font-medium text-primary-600 mb-0.5">{CHECK_IN_LABELS[key]}</p>
                            <p className="text-sm text-primary-900">{entry[key]}</p>
                          </div>
                        )
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );

  // Show paywall overlay if no access
  if (hasAccess === false) {
    return (
      <Paywall
        title="Upgrade naar Benji Uitgebreid"
        message="Dagelijkse check-ins zijn beschikbaar vanaf Benji Uitgebreid. Gebruik korte vragen om je gedachten te ordenen."
      >
        {content}
      </Paywall>
    );
  }

  return content;
}
