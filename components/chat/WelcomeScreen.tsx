"use client";

import { MessageCircle } from "lucide-react";
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
    <div className="text-center py-8 sm:py-16 px-4">
      <div className="w-12 h-12 sm:w-20 sm:h-20 mx-auto mb-4 sm:mb-6 bg-primary-700 rounded-xl flex items-center justify-center">
        <MessageCircle className="text-white" size={40} strokeWidth={1.5} />
      </div>
      <p className="text-sm sm:text-base text-gray-600 max-w-md mx-auto mb-3">
        Soms wil je het gewoon even kwijt. Dat kan hier.
      </p>
      <p className="text-sm sm:text-base text-gray-600 max-w-md mx-auto">
        Ik ben Benji, en ik luister.
      </p>
      {showTopicButtons && (
        <>
          <p className="text-sm sm:text-base text-gray-700 font-medium mt-4">
            Waar wil je over praten?
          </p>
          <TopicButtons onSelect={onTopicSelect} />
        </>
      )}
    </div>
  );
}
