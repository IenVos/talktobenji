"use client";

import { useState, useRef } from "react";
import { Lock, AlertTriangle } from "lucide-react";
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
      {/* Introtekst met regelafbreking zoals opgegeven */}
      <div className="w-full max-w-xl mx-auto space-y-4 sm:space-y-5 mb-4 sm:mb-6">
        <p className="text-sm sm:text-base text-gray-600 break-words leading-relaxed text-center whitespace-pre-line">
          {`Ik ben Benji, je luisterend oor, een AI die er altijd voor je is
om te luisteren, zonder te oordelen, dag en nacht.`}
        </p>
      </div>
      {showTopicButtons && (
        <div className="w-full flex flex-col items-center">
          <p className="text-sm sm:text-base text-gray-600 break-words text-center max-w-xl mx-auto mb-1">
            Kies een onderwerp of typ hieronder om direct te starten
          </p>
          <p className="text-sm sm:text-base text-gray-600 mb-4 break-words text-center max-w-xl mx-auto">
            Waar wil je over praten?
          </p>
          <TopicButtons onSelect={onTopicSelect} />
        </div>
      )}
      {/* Info-block: alleen bij eerste bezoek (vóór eerste chatbericht) */}
      {showInfoBlock && (
        <button
          type="button"
          onClick={() => setShowAbout(true)}
          className="mt-6 flex flex-row items-center justify-center gap-2 text-xs text-gray-500 hover:text-primary-600 transition-colors py-2 px-3 cursor-pointer touch-manipulation relative z-10"
        >
          <IconWithTooltip icon={Lock} tooltip="Gesprekken zijn privé en versleuteld" />
          <IconWithTooltip
            icon={AlertTriangle}
            tooltip="Benji is steun, geen vervanging voor professionele therapie"
            tooltipPrefix={<span className="text-orange-500 font-bold">! </span>}
          />
          <span>Meer info over Benji, privacy en hoe het werkt</span>
        </button>
      )}
    </div>
  );
}
