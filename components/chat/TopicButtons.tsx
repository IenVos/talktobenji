"use client";

const TOPICS = [
  { id: "verlies-dierbare", label: "Ik heb iemand verloren" },
  { id: "omgaan-verdriet", label: "Ik zit met verdriet" },
  { id: "afscheid-huisdier", label: "Ik mis mijn huisdier" },
] as const;

export type TopicId = (typeof TOPICS)[number]["id"];

type TopicButtonsProps = {
  onSelect: (topicId: TopicId, label: string) => void;
};

export function TopicButtons({ onSelect }: TopicButtonsProps) {
  return (
    <div className="flex flex-col gap-2 sm:gap-3 items-stretch max-w-xs mx-auto mt-6">
      {TOPICS.map(({ id, label }) => (
        <button
          key={id}
          type="button"
          onClick={() => onSelect(id, label)}
          className="px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 bg-[#e8eded] text-[#5a8a8a] hover:bg-[#d8e0e0] hover:border-[#c8d4d4] border border-transparent hover:shadow-sm active:scale-[0.98]"
        >
          {label}
        </button>
      ))}
    </div>
  );
}

export { TOPICS };
