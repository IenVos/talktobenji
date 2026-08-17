"use client";

import { useState } from "react";
import Link from "next/link";
import { Lock, AlertTriangle, ChevronDown } from "lucide-react";
import { TopicButtons, type TopicId, type TopicButtonItem } from "./TopicButtons";

type WelcomeScreenProps = {
  showTopicButtons: boolean;
  onTopicSelect: (topicId: TopicId, label: string) => void;
  /** "dark" voor op een donkere/nacht-achtergrond. */
  theme?: "light" | "dark";
  /** Introtekst bovenaan (vervangt de standaardtekst). */
  introText?: string;
  /** De vraag boven de knoppen (standaard: "Waar wil je over praten?"). */
  question?: string;
  /** Tekst onder de knoppen (optioneel). */
  subText?: string;
  /** Eigen knoppen (nacht-pagina). Leeg = standaard onderwerpen. */
  buttons?: readonly TopicButtonItem[];
  /** Toon de "Waarom TalkToBenji"-knop (standaard ja). */
  showWaaromButton?: boolean;
  /** Toon het uitlegkaartje ("Benji is geen zoekmachine…"). Standaard ja; zet uit
   *  voor wie al eerder met Benji heeft gepraat (kent het al). */
  toonIntroKader?: boolean;
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
  theme = "light",
  introText,
  question,
  subText,
  buttons,
  showWaaromButton = true,
  toonIntroKader = true,
}: WelcomeScreenProps) {
  const isDark = theme === "dark";
  const [kaderOpen, setKaderOpen] = useState(false);
  const introClass = isDark ? "text-white/85" : "text-gray-600";
  const questionClass = isDark ? "text-white/90" : "text-gray-600";
  const subTextClass = isDark ? "text-gray-300/80" : "text-gray-500";

  return (
    <div className="w-full flex flex-col items-center text-center pt-2 sm:pt-4 pb-4 sm:pb-8 px-4 sm:px-6">
      {/* Inklapbaar uitlegkader – bovenaan, dichtgeklapt zodat het weinig ruimte kost.
          Alleen voor wie nog niet eerder met Benji heeft gepraat. */}
      {toonIntroKader && showTopicButtons && (
        <div className="w-full max-w-sm mx-auto mb-4">
          <button
            type="button"
            onClick={() => setKaderOpen((o) => !o)}
            aria-expanded={kaderOpen}
            className={`w-full flex items-center gap-2 rounded-xl px-4 py-2.5 text-left backdrop-blur-sm border transition-colors ${isDark ? "bg-white/10 border-primary-300/50 hover:bg-white/15" : "bg-white/60 border-primary-300 shadow-sm hover:bg-white/70"}`}
          >
            <span className={`flex-1 text-xs sm:text-[13px] font-semibold leading-snug ${isDark ? "text-white" : "text-primary-900"}`}>
              Hoe meer je deelt, hoe beter Benji je begrijpt
            </span>
            <ChevronDown size={16} className={`flex-shrink-0 transition-transform duration-200 ${kaderOpen ? "rotate-180" : ""} ${isDark ? "text-primary-200" : "text-primary-500"}`} />
          </button>
          {kaderOpen && (
            <div className={`animate-card-in mt-2 rounded-xl px-4 py-3 text-left backdrop-blur-sm border space-y-2 ${isDark ? "bg-white/10 border-primary-300/50" : "bg-white/60 border-primary-300 shadow-sm"}`}>
              <p className={`text-xs sm:text-[13px] font-semibold leading-snug ${isDark ? "text-white" : "text-primary-900"}`}>
                Benji is geen zoekmachine, zie hem als een buddy
              </p>
              <p className={`text-xs sm:text-[13px] leading-relaxed ${isDark ? "text-white/80" : "text-gray-600"}`}>
                Begin gewoon met je verhaal: wie je bent en wat er speelt.
              </p>
              <p className={`text-xs sm:text-[13px] leading-relaxed ${isDark ? "text-white/80" : "text-gray-600"}`}>
                Geef hem even de tijd, zoals in een echt gesprek.
              </p>
              <p className={`text-xs sm:text-[13px] leading-relaxed ${isDark ? "text-white/80" : "text-gray-600"}`}>
                &ldquo;Ik weet niet waar ik moet beginnen&rdquo; is ook een prima eerste zin.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Introtekst – eigen regelafbrekingen behouden (\n) */}
      <div className="w-full max-w-sm mx-auto mb-4 flex justify-center">
        <p className={`text-xs sm:text-sm break-words leading-relaxed text-center text-pretty max-w-xs sm:max-w-sm whitespace-pre-line ${introClass}`}>
          {introText?.trim() ||
            "Een warme plek voor je verhaal.\nZonder oordeel. Ook om 03:00 's nachts."}
        </p>
      </div>

      {/* Waarom Benji-knop – gecentreerd */}
      {showWaaromButton && (
        <div className="w-full flex justify-center mb-4 sm:mb-5">
          <Link
            href="/waarom-benji"
            className={`welcome-btn flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 ${isDark ? "!bg-white/10 !text-white !border-white/25 backdrop-blur-sm" : ""}`}
          >
            Waarom TalkToBenji
            <span aria-hidden>→</span>
          </Link>
        </div>
      )}

      {/* Vraag en topic-sectie */}
      <div className="w-full max-w-sm mx-auto">
        <div className="space-y-4 sm:space-y-5 mb-4 sm:mb-6">
          {showTopicButtons && (
            <p className={`text-sm sm:text-base break-words text-center text-pretty ${questionClass}`}>
              {question?.trim() || "Waar wil je over praten?"}
            </p>
          )}
        </div>
        {showTopicButtons && (
          <div className="flex flex-col items-center">
            <TopicButtons onSelect={onTopicSelect} topics={buttons} theme={theme} />
            {subText?.trim() && (
              <p className={`mt-3 text-[11px] sm:text-xs leading-relaxed text-center text-pretty ${subTextClass}`}>
                {subText.trim()}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
