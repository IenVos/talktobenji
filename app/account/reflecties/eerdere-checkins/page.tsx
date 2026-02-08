"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { CalendarCheck, ChevronDown, ChevronRight, Trash2 } from "lucide-react";

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

export default function EerdereCheckinsPage() {
  const { data: session } = useSession();
  const userId = session?.userId ?? "";

  const checkInEntries = useQuery(
    api.reflecties.listCheckInEntries,
    userId ? { userId, limit: 200 } : "skip"
  );
  const emotionHistory = useQuery(
    api.reflecties.listEmotionHistory,
    userId ? { userId, limit: 365 } : "skip"
  );
  const deleteCheckInEntry = useMutation(api.reflecties.deleteCheckInEntry);

  const [expandedCheckInId, setExpandedCheckInId] = useState<Id<"checkInEntries"> | null>(null);

  const handleDeleteCheckIn = async (id: Id<"checkInEntries">) => {
    if (!userId || !confirm("Check-in verwijderen?")) return;
    await deleteCheckInEntry({ id, userId });
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-primary-200 p-6">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-primary-900 mb-4">
          <CalendarCheck size={20} className="text-primary-500" />
          Eerdere check-ins
        </h2>
        <p className="text-sm text-gray-600 mb-6">
          Alle dagelijkse check-ins. Bekijk je vorige antwoorden om patronen te zien.
        </p>

        {checkInEntries === undefined ? (
          <div className="flex justify-center py-12">
            <div className="animate-pulse rounded-full h-8 w-8 border-b-2 border-primary-600" />
          </div>
        ) : checkInEntries.length === 0 ? (
          <p className="text-gray-500 text-sm py-8">Nog geen check-ins ingevuld.</p>
        ) : (
          <div className="space-y-2">
            {checkInEntries.map((entry) => {
              const isExpanded = expandedCheckInId === entry._id;
              const emotionEntry = emotionHistory?.find((e) => e.date === entry.dateStr);
              const moodOpt = emotionEntry?.mood ? MOOD_OPTIONS.find((m) => m.value === emotionEntry.mood) : null;
              return (
                <div
                  key={entry._id}
                  className="rounded-lg border border-primary-200 overflow-hidden"
                >
                  <div className="flex items-center gap-2 px-4 py-3 bg-white">
                    <button
                      type="button"
                      onClick={() => setExpandedCheckInId(isExpanded ? null : entry._id)}
                      className="flex items-center gap-2 text-left hover:bg-primary-50/50 rounded transition-colors flex-1 min-w-0"
                    >
                      {isExpanded ? (
                        <ChevronDown size={18} className="text-primary-600 flex-shrink-0" />
                      ) : (
                        <ChevronRight size={18} className="text-primary-600 flex-shrink-0" />
                      )}
                      {moodOpt && (
                        <span className="text-xl flex-shrink-0" title={moodOpt.label}>{moodOpt.emoji}</span>
                      )}
                      <span className="font-medium text-primary-900 truncate">
                        {formatDate(entry.createdAt)}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteCheckIn(entry._id)}
                      className="p-2 text-gray-400 hover:text-red-600 rounded-lg flex-shrink-0"
                      aria-label="Verwijderen"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                  {isExpanded && (
                    <div className="px-4 pb-4 pt-0 space-y-2 bg-primary-50/30">
                      {(["hoe_voel", "wat_hielp", "waar_dankbaar"] as const).map(
                        (key) =>
                          entry[key] && entry[key] !== "-" && (
                            <div key={key}>
                              <p className="text-xs font-medium text-primary-600 mb-0.5">
                                {CHECK_IN_LABELS[key]}
                              </p>
                              <p className="text-sm text-primary-900">
                                {entry[key]}
                              </p>
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
}
