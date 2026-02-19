"use client";

import { useState, useEffect } from "react";
import { ThumbsUp, Check } from "lucide-react";
import { useSession } from "next-auth/react";

interface ComingSoonCardProps {
  id: string;
  emoji: string;
  title: string;
  description: string;
}

export function ComingSoonCard({ id, emoji, title, description }: ComingSoonCardProps) {
  const [voted, setVoted] = useState(false);
  const [justVoted, setJustVoted] = useState(false);
  const { data: session } = useSession();

  useEffect(() => {
    try {
      const votes = JSON.parse(localStorage.getItem("benji_feature_votes") || "{}");
      setVoted(!!votes[id]);
    } catch {
      // ignore
    }
  }, [id]);

  const handleVote = async () => {
    // Optimistische UI — meteen zichtbaar
    try {
      const votes = JSON.parse(localStorage.getItem("benji_feature_votes") || "{}");
      votes[id] = true;
      localStorage.setItem("benji_feature_votes", JSON.stringify(votes));
    } catch {
      // ignore
    }
    setVoted(true);
    setJustVoted(true);
    setTimeout(() => setJustVoted(false), 2500);

    // Sla op via eigen API route — geen Convex types nodig
    fetch("/api/feature-vote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ featureId: id, userId: session?.userId ?? null }),
    }).catch(() => {
      // Stille fallback — lokale stem is al bewaard
    });
  };

  return (
    <div className="bg-white rounded-xl border border-dashed border-primary-200 p-5">
      <div className="flex items-start gap-4">
        <div className="text-2xl flex-shrink-0 mt-0.5" aria-hidden>
          {emoji}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h3 className="font-semibold text-gray-800 text-sm sm:text-base">{title}</h3>
            <span className="text-xs px-2 py-0.5 rounded-full bg-primary-50 text-primary-700 border border-primary-200 font-medium whitespace-nowrap flex-shrink-0">
              Binnenkort
            </span>
          </div>
          <p className="text-sm text-gray-500 leading-relaxed">{description}</p>
          <button
            type="button"
            onClick={handleVote}
            disabled={voted}
            className={`mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border transition-all duration-200 ${
              voted
                ? "bg-green-50 text-green-700 border-green-200 cursor-default"
                : "bg-primary-50 text-primary-700 border-primary-200 hover:bg-primary-100 active:scale-95"
            }`}
          >
            {voted ? <Check size={14} /> : <ThumbsUp size={14} />}
            {justVoted ? "Bedankt! Fijn te weten." : voted ? "Jij wilt dit ook" : "Ik wil dit graag"}
          </button>
        </div>
      </div>
    </div>
  );
}
