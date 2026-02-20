"use client";

import { useState, useEffect } from "react";
import { ThumbsUp, Check, ChevronDown } from "lucide-react";
import { useSession } from "next-auth/react";
import { getIcon } from "@/lib/iconRegistry";

interface ComingSoonCardProps {
  id: string;
  iconName: string;
  title: string;
  description: string;
}

export function ComingSoonCard({ id, iconName, title, description }: ComingSoonCardProps) {
  const [voted, setVoted] = useState(false);
  const [justVoted, setJustVoted] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const { data: session } = useSession();
  const Icon = getIcon(iconName);

  const storageKey = `benji_feature_votes_${session?.userId || "anon"}`;

  useEffect(() => {
    try {
      const votes = JSON.parse(localStorage.getItem(storageKey) || "{}");
      setVoted(!!votes[id]);
    } catch {
      // ignore
    }
  }, [id, storageKey]);

  const handleVote = async () => {
    try {
      const votes = JSON.parse(localStorage.getItem(storageKey) || "{}");
      votes[id] = true;
      localStorage.setItem(storageKey, JSON.stringify(votes));
    } catch {
      // ignore
    }
    setVoted(true);
    setJustVoted(true);
    setTimeout(() => setJustVoted(false), 2000);

    fetch("/api/feature-vote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ featureId: id, userId: session?.userId ?? null }),
    }).catch(() => {});
  };

  // Compacte weergave na stemmen (uitklapbaar)
  if (voted) {
    return (
      <div className="rounded-xl bg-primary-50 border border-primary-300 overflow-hidden transition-all duration-300">
        <button
          type="button"
          onClick={() => setExpanded((o) => !o)}
          className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-primary-100/50 transition-colors"
        >
          <div className="p-1.5 rounded-lg bg-primary-100 text-primary-600 flex-shrink-0">
            <Icon size={16} strokeWidth={2} />
          </div>
          <span className="text-sm font-medium text-gray-700 flex-1 min-w-0 truncate">{title}</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-primary-100 text-primary-700 border border-primary-200 font-medium whitespace-nowrap flex-shrink-0">
            Binnenkort
          </span>
          <span className="inline-flex items-center gap-1 text-xs text-green-700 font-medium flex-shrink-0">
            <Check size={13} />
            {justVoted ? "Bedankt!" : "Gestemd"}
          </span>
          <ChevronDown
            size={15}
            className={`text-gray-400 flex-shrink-0 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
          />
        </button>
        {expanded && (
          <div className="px-4 pb-4 pt-1 border-t border-primary-200">
            <p className="text-sm text-gray-600">{description}</p>
          </div>
        )}
      </div>
    );
  }

  // Volledige weergave
  return (
    <div className="flex items-start gap-4 p-5 rounded-xl bg-primary-50 border border-primary-300">
      <div className="p-2.5 rounded-lg bg-primary-100 text-primary-700 flex-shrink-0">
        <Icon size={24} strokeWidth={2} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2 mb-0.5">
          <h3 className="font-semibold text-gray-900 text-sm sm:text-base">{title}</h3>
          <span className="text-xs px-2 py-0.5 rounded-full bg-primary-100 text-primary-700 border border-primary-200 font-medium whitespace-nowrap flex-shrink-0">
            Binnenkort
          </span>
        </div>
        <p className="text-sm text-gray-600 mt-0.5">{description}</p>
        <button
          type="button"
          onClick={handleVote}
          className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border border-primary-300 bg-white text-primary-700 hover:bg-primary-100 active:scale-95 transition-all duration-200"
        >
          <ThumbsUp size={14} />
          Ik wil dit graag
        </button>
      </div>
    </div>
  );
}
