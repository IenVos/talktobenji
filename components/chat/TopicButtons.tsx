"use client";

import { Heart, PawPrint, MessageSquare } from "lucide-react";
import Image from "next/image";

const TOPICS = [
  { id: "verlies-dierbare", label: "Ik heb iemand verloren", icon: "heart" },
  { id: "omgaan-verdriet", label: "Ik zit met verdriet", icon: "verdriet" },
  { id: "afscheid-huisdier", label: "Ik mis mijn huisdier", icon: "paw" },
  { id: "gewoon-praten", label: "Deel je gevoel. Soms is dat al genoeg.", icon: "message" },
] as const;

export type TopicId = (typeof TOPICS)[number]["id"];

type TopicButtonsProps = {
  onSelect: (topicId: TopicId, label: string) => void;
};

export function TopicButtons({ onSelect }: TopicButtonsProps) {
  return (
    <div className="flex flex-col gap-2 sm:gap-3 items-stretch w-full mt-4">
      {TOPICS.map(({ id, label, icon }) => (
        <button
          key={id}
          type="button"
          onClick={() => onSelect(id, label)}
          className="group flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 bg-primary-50 text-primary-700 border border-primary-400 hover:bg-primary-100 hover:border-primary-500 hover:shadow-sm active:scale-[0.98] text-left"
        >
          <span className="flex items-center gap-3 min-w-0">
            {icon === "message" && <MessageSquare size={18} strokeWidth={2} className="flex-shrink-0 text-primary-700" />}
            {icon === "heart" && <Heart size={18} strokeWidth={2} className="flex-shrink-0 text-primary-700" />}
            {icon === "verdriet" && (
              <span className="w-[18px] h-[18px] flex-shrink-0 flex items-center justify-center relative">
                <Image 
                  src="/images/verdriet-icon.png" 
                  alt="" 
                  fill
                  className="object-contain mix-blend-multiply"
                  sizes="18px"
                />
              </span>
            )}
            {icon === "paw" && <PawPrint size={18} strokeWidth={2} className="flex-shrink-0 text-primary-700" />}
            <span className="break-words text-pretty">{label}</span>
          </span>
          <span className="inline-flex flex-shrink-0 text-primary-600 group-hover:translate-x-0.5 transition-transform duration-200" aria-hidden>→</span>
        </button>
      ))}
    </div>
  );
}

export { TOPICS };
