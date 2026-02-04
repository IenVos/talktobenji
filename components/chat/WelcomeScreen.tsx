"use client";

import { useState, useRef } from "react";
import { Lock, AlertTriangle, Moon, MessageCircle, Heart } from "lucide-react";
import { TopicButtons, type TopicId } from "./TopicButtons";
import { useAboutModal } from "@/lib/AboutModalContext";

type WelcomeScreenProps = {
  showTopicButtons: boolean;
  onTopicSelect: (topicId: TopicId, label: string) => void;
  showInfoBlock?: boolean;
};

function IconWithTooltip({
  icon: Icon,
  tooltip,
  tooltipPrefix,
}: {
  icon: React.ElementType;
  tooltip: string;
  tooltipPrefix?: React.ReactNode;
}) {
  const [show, setShow] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showTooltip = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = null;
    setShow(true);
  };

  const hideTooltip = () => {
    timeoutRef.current = setTimeout(() => setShow(false), 1500);
  };

  return (
    <span
      className="relative inline-flex group"
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onClick={(e) => {
        e.stopPropagation();
        setShow((s) => !s);
      }}
    >
      <Icon
        size={18}
        strokeWidth={2}
        className="text-primary-600 group-hover:text-orange-500 transition-colors flex-shrink-0"
      />
      {show && (
        <span
          className="absolute left-1/2 -translate-x-1/2 top-full mt-1.5 px-3 py-1.5 bg-primary-50 text-primary-700 text-xs font-medium rounded-lg border border-primary-400 whitespace-nowrap z-10 shadow-md"
          style={{ pointerEvents: "none" }}
          role="tooltip"
        >
          {tooltipPrefix}
          {tooltip}
        </span>
      )}
    </span>
  );
}

export function WelcomeScreen({
  showTopicButtons,
  onTopicSelect,
  showInfoBlock = true,
}: WelcomeScreenProps) {
  const { setShowAbout } = useAboutModal();

  return (
    <div className="w-full flex flex-col items-center justify-center text-center pt-2 sm:pt-4 pb-4 sm:pb-8 px-4 sm:px-6">
      {/* Introtekst */}
      <p className="text-sm sm:text-base text-gray-600 break-words leading-relaxed text-center whitespace-pre-line text-pretty mb-4">
        {`Ik ben Benji, je luisterend oor,
een AI die er altijd voor je is
om te luisteren, zonder te oordelen,
dag en nacht.`}
      </p>

      {/* Kenmerken-box:zelfde breedte als buttons, licht standaard, donkerblauw bij hover */}
      <div className="w-full max-w-sm mx-auto mb-4 sm:mb-5">
        <button
          type="button"
          onClick={() => setShowAbout(true)}
          className="w-full flex flex-col items-center rounded-xl px-4 py-3 border border-primary-400 bg-white/60 backdrop-blur-sm transition-all duration-200 group hover:bg-primary-800 hover:border-primary-700"
        >
          <div className="flex flex-col items-center gap-2 text-sm text-gray-600 transition-colors group-hover:text-primary-100">
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
              <span className="flex items-center gap-1.5">
                <Moon size={16} strokeWidth={2} className="text-primary-500 flex-shrink-0 group-hover:text-primary-300 transition-colors" />
                24/7
              </span>
              <span className="flex items-center gap-1.5">
                <Lock size={16} strokeWidth={2} className="text-primary-500 flex-shrink-0 group-hover:text-primary-300 transition-colors" />
                Privé
              </span>
              <span className="flex items-center gap-1.5">
                <Heart size={16} strokeWidth={2} className="text-primary-500 flex-shrink-0 group-hover:text-primary-300 transition-colors" />
                Voor jou
              </span>
            </div>
            <span className="flex items-center gap-1.5">
              <MessageCircle size={16} strokeWidth={2} className="text-primary-500 flex-shrink-0 group-hover:text-primary-300 transition-colors" />
              Zeg wat je voelt
            </span>
          </div>
          <span className="mt-2.5 flex items-center gap-2 text-xs text-primary-600 group-hover:text-primary-200 transition-colors border border-primary-400/60 group-hover:border-primary-300 rounded-lg px-3 py-1.5">
            Meer over Benji
            <span aria-hidden>→</span>
          </span>
        </button>
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
      {/* Info-block: alleen bij eerste bezoek (vóór eerste chatbericht) */}
      {showInfoBlock && (
        <button
          type="button"
          onClick={() => setShowAbout(true)}
          className="mt-6 flex flex-row items-center justify-center gap-3 py-2 px-3 cursor-pointer touch-manipulation relative z-10 w-full"
        >
          <IconWithTooltip icon={Lock} tooltip="Gesprekken zijn privé en beveiligd (encryptie in transit en bij opslag)" />
          <IconWithTooltip
            icon={AlertTriangle}
            tooltip="Benji is steun, geen vervanging voor professionele therapie"
            tooltipPrefix={<span className="text-orange-500 font-bold">! </span>}
          />
        </button>
      )}
    </div>
  );
}
