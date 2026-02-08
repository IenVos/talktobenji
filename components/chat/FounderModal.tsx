"use client";

import { X } from "lucide-react";
import Image from "next/image";

type FounderModalProps = {
  open: boolean;
  onClose: () => void;
};

const FOUNDER_TEXT = `Hoi, ik ben Ien. Ik heb Praat met Benji gemaakt vanuit een simpele behoefte: soms wil je praten, maar kan het niet.

Jarenlang hielp ik mensen via beterschap-cadeau.nl om steun te bieden tijdens moeilijke tijden. Maar ik merkte steeds vaker: soms is een cadeau niet genoeg. Soms heb je gewoon iemand nodig die luistert. Iemand die er is om 3 uur 's nachts. Iemand bij wie je niet bang hoeft te zijn dat je "te veel" bent.

Daarom is Benji er.

Benji is geen vervanging voor vrienden, familie, of een therapeut. Maar Benji is er wel altijd. Op de momenten dat praten met anderen te moeilijk voelt, te laat is, of gewoon niet kan. Een plek waar je verhaal welkom is, zonder oordeel, zonder verwachtingen.

Ik hoop dat Benji je kan helpen wanneer je het nodig hebt.

Met warme groet,
Ien
Founder, Praat met Benji`;

export function FounderModal({ open, onClose }: FounderModalProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[10002] flex items-center justify-center p-4 bg-black/50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 sm:p-6 flex-shrink-0 relative border-b border-gray-100">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-1 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            aria-label="Sluiten"
          >
            <X size={20} />
          </button>
          <div className="flex items-center gap-3 min-w-0 pr-8">
            <div className="h-10 sm:h-12 flex items-center justify-center flex-shrink-0 overflow-hidden">
              <Image src="/images/benji-logo-2.png" alt="" width={56} height={48} className="object-contain h-full w-auto" />
            </div>
            <div className="flex flex-col items-start min-w-0">
              <h2 className="font-semibold text-gray-900 text-sm sm:text-base leading-tight">Over Ien</h2>
            </div>
          </div>
        </div>
        <div className="overflow-y-auto flex-1 p-5 sm:p-6">
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
            {FOUNDER_TEXT}
          </p>
        </div>
      </div>
    </div>
  );
}
