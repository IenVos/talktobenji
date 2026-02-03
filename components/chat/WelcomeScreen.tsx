"use client";

import { useState } from "react";
import { Lock, AlertTriangle } from "lucide-react";
import { TopicButtons, type TopicId } from "./TopicButtons";
import { useAboutModal } from "@/lib/AboutModalContext";

type WelcomeScreenProps = {
  showTopicButtons: boolean;
  onTopicSelect: (topicId: TopicId, label: string) => void;
};

function IconWithTooltip({
  icon: Icon,
  tooltip,
}: {
  icon: React.ElementType;
  tooltip: string;
}) {
  const [show, setShow] = useState(false);

  return (
    <span
      className="relative inline-flex cursor-default"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      <Icon size={18} strokeWidth={2} className="text-primary-600 flex-shrink-0" />
      {show && (
        <span
          className="absolute left-1/2 -translate-x-1/2 top-full mt-2 px-4 py-2.5 bg-primary-50 text-primary-700 font-medium rounded-xl border border-primary-400 whitespace-nowrap z-10 shadow-sm pointer-events-none"
          role="tooltip"
        >
          {tooltip}
        </span>
      )}
    </span>
  );
}

export function WelcomeScreen({
  showTopicButtons,
  onTopicSelect,
}: WelcomeScreenProps) {
  const { setShowAbout } = useAboutModal();

  return (
    <div className="text-center pt-2 sm:pt-4 pb-4 sm:pb-8 px-4 sm:px-6">
      <div className="max-w-md mx-auto space-y-4 sm:space-y-5 mb-4 sm:mb-6">
        <p className="text-sm sm:text-base text-gray-600 break-words leading-relaxed">
          Als praten je helpt, luister ik graag. Ik ben Benji, je steun in stilte en in woorden.
        </p>
        <p className="text-sm sm:text-base text-gray-600 break-words leading-relaxed">
          Woorden hebben kracht, dus deel wat je bezighoudt. Ik luister zonder oordeel, met aandacht en begrip.
        </p>
        <p className="text-sm sm:text-base text-gray-600 break-words leading-relaxed">
          Soms is het delen van je gevoel al een belangrijke stap.
        </p>
      </div>
      {showTopicButtons && (
        <>
          <p className="text-sm sm:text-base text-gray-600 mb-4 break-words">
            Waar wil je over praten?
          </p>
          <TopicButtons onSelect={onTopicSelect} />
        </>
      )}
      {/* Waarschuwingen: iconen naast elkaar, zelfde primary-kleur, tooltip onder icoon */}
      <div className="flex flex-row items-center justify-center gap-3 mt-6">
        <IconWithTooltip icon={Lock} tooltip="Gesprekken zijn privé en versleuteld" />
        <IconWithTooltip icon={AlertTriangle} tooltip="Benji is steun, geen vervanging voor professionele therapie" />
      </div>
      <button
        type="button"
        onClick={() => setShowAbout(true)}
        className="mt-4 mx-auto text-xs text-gray-500 hover:text-primary-600 transition-colors block py-2 px-3 cursor-pointer touch-manipulation relative z-10"
      >
        Meer info over Benji, privacy en hoe het werkt
      </button>
    </div>
  );
}
