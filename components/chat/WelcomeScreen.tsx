"use client";

import Link from "next/link";
import { Lock, AlertTriangle } from "lucide-react";
import { TopicButtons, type TopicId } from "./TopicButtons";

type WelcomeScreenProps = {
  showTopicButtons: boolean;
  onTopicSelect: (topicId: TopicId, label: string) => void;
};

export function WelcomeScreenInfoIcons({ variant = "dark" }: { variant?: "light" | "dark" }) {
  const isDark = variant === "dark";
  const iconClass = isDark ? "text-primary-200" : "text-primary-500";
  const textClass = isDark ? "text-primary-200" : "text-primary-600";

  return (
    <div className="flex flex-wrap justify-center items-center gap-x-5 gap-y-1 w-full px-4 py-2">
      <div className="flex items-center gap-1.5">
        <Lock size={13} strokeWidth={2} className={`${iconClass} flex-shrink-0`} />
        <span className={`${textClass} text-[10px] sm:text-xs leading-snug`}>Gesprekken zijn privé en beveiligd.</span>
      </div>
      <div className="flex items-center gap-1.5">
        <AlertTriangle size={13} strokeWidth={2} className={`${iconClass} flex-shrink-0`} />
        <span className={`${textClass} text-[10px] sm:text-xs leading-snug`}>Benji is geen vervanging van professionele hulp.</span>
      </div>
    </div>
  );
}

export function WelcomeScreen({
  showTopicButtons,
  onTopicSelect,
}: WelcomeScreenProps) {
  return (
    <div className="w-full flex flex-col items-center justify-center text-center pt-2 sm:pt-4 pb-4 sm:pb-8 px-4 sm:px-6">
      {/* Introtekst – max 2 regels */}
      <div className="w-full max-w-sm mx-auto mb-4 flex justify-center">
        <p className="text-xs sm:text-sm text-gray-600 break-words leading-relaxed text-center text-pretty line-clamp-2 max-w-xs sm:max-w-sm">
          Een warme, betrouwbare plek waar je je verhaal kwijt kunt, 24/7 aandacht en steun, zonder oordeel.
        </p>
      </div>

      {/* Waarom Benji-knop – gecentreerd */}
      <div className="w-full flex justify-center mb-4 sm:mb-5">
        <Link
          href="/waarom-benji"
          className="welcome-btn flex items-center justify-center gap-2 rounded-xl px-4 py-2.5"
        >
          Waarom TalkToBenji
          <span aria-hidden>→</span>
        </Link>
      </div>

      {/* Vraag en topic-sectie */}
      <div className="w-full max-w-sm mx-auto">
        <div className="space-y-4 sm:space-y-5 mb-4 sm:mb-6">
          {showTopicButtons && (
            <p className="text-sm sm:text-base text-gray-600 break-words text-center text-pretty">
              Waar wil je over praten?
            </p>
          )}
        </div>
        {showTopicButtons && (
          <div className="flex flex-col items-center">
            <TopicButtons onSelect={onTopicSelect} />
          </div>
        )}
      </div>
    </div>
  );
}
