"use client";

import { TopicButtons, type TopicId } from "./TopicButtons";

type WelcomeScreenProps = {
  showTopicButtons: boolean;
  onTopicSelect: (topicId: TopicId, label: string) => void;
};

export function WelcomeScreen({
  showTopicButtons,
  onTopicSelect,
}: WelcomeScreenProps) {
  return (
    <div className="text-center pt-2 sm:pt-4 pb-4 sm:pb-8 px-4">
      {/* Eerste 2 zinnen dicht bij elkaar */}
      <p className="text-sm sm:text-base text-gray-600 max-w-md mx-auto mb-0.5">
        Als praten je helpt, luister ik graag.
      </p>
      <p className="text-sm sm:text-base text-gray-600 max-w-md mx-auto mb-4">
        Ik ben Benji, je steun in stilte en in woorden.
      </p>
      {/* Tweede 2 zinnen dicht bij elkaar */}
      <p className="text-sm sm:text-base text-gray-600 max-w-md mx-auto mb-0.5">
        Woorden hebben kracht, dus deel wat je bezighoudt.
      </p>
      <p className="text-sm sm:text-base text-gray-600 max-w-md mx-auto mb-4">
        Ik luister zonder oordeel, met aandacht en begrip.
      </p>
      {/* Derde 2 zinnen dicht bij elkaar */}
      <p className="text-sm sm:text-base text-gray-600 max-w-md mx-auto mb-0.5">
        Soms is het delen van je gevoel al een belangrijke stap.
      </p>
      {showTopicButtons && (
        <>
          <p className="text-sm sm:text-base text-gray-600 mb-4">
            Waar wil je over praten?
          </p>
          <TopicButtons onSelect={onTopicSelect} />
          <p className="text-xs text-gray-500 mt-6 max-w-sm mx-auto space-y-1">
            <span className="block">🔒 Je gesprekken zijn privé en versleuteld</span>
            <span className="block">⚠️ Benji is steun, geen vervanging voor professionele therapie</span>
          </p>
        </>
      )}
    </div>
  );
}
