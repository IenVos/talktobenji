"use client";

import { Lock, AlertTriangle, Moon, MessageCircle, Heart } from "lucide-react";
import { TopicButtons, type TopicId } from "./TopicButtons";
import { useAboutModal } from "@/lib/AboutModalContext";

type WelcomeScreenProps = {
  showTopicButtons: boolean;
  onTopicSelect: (topicId: TopicId, label: string) => void;
};

export function WelcomeScreenInfoIcons({ variant = "dark" }: { variant?: "light" | "dark" }) {
  const isDark = variant === "dark";
  const iconClass = isDark ? "text-primary-200" : "text-primary-500";
  const textClass = isDark ? "text-primary-200" : "text-primary-600";

  return (
    <div className="flex flex-col items-center gap-1.5 sm:gap-2 w-full max-w-sm sm:max-w-md mx-auto px-3 sm:px-4 py-3 sm:py-4 text-center">
      <div className="flex gap-2 justify-center items-center flex-wrap">
        <Lock size={18} strokeWidth={2} className={`${iconClass} flex-shrink-0`} />
        <span className={`${textClass} text-[10px] sm:text-xs leading-snug text-center`}>Gesprekken zijn privé en beveiligd.</span>
      </div>
      <div className="flex gap-2 justify-center items-center flex-wrap">
        <AlertTriangle size={18} strokeWidth={2} className={`${iconClass} flex-shrink-0`} />
        <span className={`${textClass} text-[10px] sm:text-xs leading-snug break-words text-center`}>Benji is geen vervanging van professionele hulp.</span>
      </div>
    </div>
  );
}

export function WelcomeScreen({
  showTopicButtons,
  onTopicSelect,
}: WelcomeScreenProps) {
  const { setShowAbout } = useAboutModal();

  return (
    <div className="w-full flex flex-col items-center justify-center text-center pt-2 sm:pt-4 pb-4 sm:pb-8 px-4 sm:px-6">
      {/* Introtekst –zelfde breedte als buttonblok, tekst loopt door en verdeelt netjes */}
      <div className="w-full max-w-sm mx-auto mb-4">
        <p className="text-sm sm:text-base text-gray-600 break-words leading-relaxed text-center text-pretty">
          Ik ben Benji, je luisterend oor, een AI die er altijd voor je is om te luisteren. Dag en nacht.
        </p>
      </div>

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
    </div>
  );
}
