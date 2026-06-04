"use client";

import { Heart, PawPrint, MessageSquare, Users } from "lucide-react";
import Image from "next/image";

const TOPICS = [
  { id: "verlies-dierbare", label: "Ik heb iemand verloren", icon: "heart" },
  { id: "omgaan-verdriet", label: "Ik zit met verdriet", icon: "verdriet" },
  { id: "afscheid-huisdier", label: "Ik mis mijn huisdier", icon: "paw" },
  { id: "voel-me-alleen", label: "Ik voel me alleen", icon: "alone" },
  { id: "gewoon-praten", label: "Deel je gevoel. Soms is dat al genoeg.", icon: "message" },
] as const;

export type TopicId = (typeof TOPICS)[number]["id"];

/** Een knop op het welkomstscherm. icon is optioneel (nacht-knoppen tonen geen icoon). */
export type TopicButtonItem = { id: string; label: string; icon?: string };

type TopicButtonsProps = {
  onSelect: (topicId: TopicId, label: string) => void;
  /** Eigen knoppen (bv. nacht-pagina). Leeg = standaard onderwerpen. */
  topics?: readonly TopicButtonItem[];
  /** "dark" voor op een donkere/nacht-achtergrond. */
  theme?: "light" | "dark";
};

function renderIcon(icon: string | undefined, colorClass: string) {
  if (icon === "message") return <MessageSquare size={18} strokeWidth={2} className={`flex-shrink-0 ${colorClass}`} />;
  if (icon === "heart") return <Heart size={18} strokeWidth={2} className={`flex-shrink-0 ${colorClass}`} />;
  if (icon === "paw") return <PawPrint size={18} strokeWidth={2} className={`flex-shrink-0 ${colorClass}`} />;
  if (icon === "alone") return <Users size={18} strokeWidth={2} className={`flex-shrink-0 ${colorClass}`} />;
  if (icon === "verdriet") {
    return (
      <span className="w-[18px] h-[18px] flex-shrink-0 flex items-center justify-center relative">
        <Image src="/images/verdriet-icon.png" alt="" fill className="object-contain mix-blend-multiply" sizes="18px" />
      </span>
    );
  }
  return null;
}

export function TopicButtons({ onSelect, topics, theme = "light" }: TopicButtonsProps) {
  const items = topics && topics.length > 0 ? topics : TOPICS;
  const isDark = theme === "dark";

  const btnClass = isDark
    ? "group flex items-center justify-between gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 bg-white/10 text-white border border-white/25 hover:bg-white/20 hover:border-white/40 hover:shadow-sm active:scale-[0.98] text-left backdrop-blur-sm"
    : "group flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 bg-primary-50 text-primary-700 border border-primary-400 hover:bg-primary-100 hover:border-primary-500 hover:shadow-sm active:scale-[0.98] text-left";
  const iconColor = isDark ? "text-white/80" : "text-primary-700";
  const arrowColor = isDark ? "text-white/70" : "text-primary-600";

  return (
    <div className="flex flex-col gap-2 sm:gap-3 items-stretch w-full mt-4">
      {items.map(({ id, label, icon }) => (
        <button
          key={id}
          type="button"
          onClick={() => onSelect(id as TopicId, label)}
          className={btnClass}
        >
          <span className="flex items-center gap-3 min-w-0">
            {renderIcon(icon, iconColor)}
            <span className="break-words text-pretty">{label}</span>
          </span>
          <span className={`inline-flex flex-shrink-0 ${arrowColor} group-hover:translate-x-0.5 transition-transform duration-200`} aria-hidden>→</span>
        </button>
      ))}
    </div>
  );
}

export { TOPICS };
