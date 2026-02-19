"use client";

import { useEffect, useState } from "react";
import { ThumbsUp } from "lucide-react";

const FEATURES: {
  id: string;
  emoji: string;
  label: string;
  section: string;
}[] = [
  { id: "herinneringenboekje", emoji: "📖", label: "Jouw herinneringenboekje", section: "Memories" },
  { id: "seizoensgidsen", emoji: "🍂", label: "Seizoensgidsen", section: "Inspiratie & troost" },
  { id: "rituelen-bibliotheek", emoji: "✨", label: "Rituelen-bibliotheek", section: "Inspiratie & troost" },
  { id: "aanbevolen-voor-jou", emoji: "📚", label: "Aanbevolen voor jou", section: "Inspiratie & troost" },
  { id: "wat-zeg-je", emoji: "💬", label: "Wat zeg je tegen iemand die rouwt?", section: "Handreikingen" },
  { id: "herdenkingskalender", emoji: "🗓️", label: "Herdenkingskalender", section: "Dagelijkse check-ins" },
];

export default function AdminWensenPage() {
  const [counts, setCounts] = useState<Record<string, number> | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch("/api/admin/feature-votes")
      .then((r) => r.json())
      .then((data) => setCounts(data.counts ?? {}))
      .catch(() => setError(true));
  }, []);

  const sorted = [...FEATURES].sort(
    (a, b) => (counts?.[b.id] ?? 0) - (counts?.[a.id] ?? 0)
  );

  const total = counts ? Object.values(counts).reduce((s, n) => s + n, 0) : 0;
  const maxCount = counts
    ? Math.max(...FEATURES.map((f) => counts[f.id] ?? 0), 1)
    : 1;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center border border-primary-200">
          <ThumbsUp className="w-5 h-5 text-primary-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-primary-900">Wensen van gebruikers</h1>
          <p className="text-sm text-gray-500">
            Hoeveel klanten klikten op "Ik wil dit graag" per aankomende functie
          </p>
        </div>
      </div>

      {error ? (
        <div className="bg-white rounded-xl border border-red-200 p-6 text-sm text-red-600">
          Kon de stemmen niet ophalen. Controleer of Convex actief is.
        </div>
      ) : counts === null ? (
        <div className="flex justify-center py-12">
          <div className="animate-pulse rounded-full h-8 w-8 border-b-2 border-primary-600" />
        </div>
      ) : (
        <>
          <div className="bg-white rounded-xl border border-primary-200 divide-y divide-gray-100">
            {sorted.map((feature) => {
              const count = counts[feature.id] ?? 0;
              const pct = Math.round((count / maxCount) * 100);

              return (
                <div key={feature.id} className="p-4 flex items-center gap-4">
                  <span className="text-xl flex-shrink-0" aria-hidden>{feature.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{feature.label}</p>
                        <p className="text-xs text-gray-400">{feature.section}</p>
                      </div>
                      <span className="text-sm font-bold text-primary-700 flex-shrink-0 tabular-nums">
                        {count} {count === 1 ? "stem" : "stemmen"}
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5">
                      <div
                        className="bg-primary-500 h-1.5 rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <p className="text-xs text-gray-400 text-right">
            Totaal: {total} {total === 1 ? "stem" : "stemmen"}
          </p>
        </>
      )}
    </div>
  );
}
