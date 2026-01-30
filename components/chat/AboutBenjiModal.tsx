"use client";

import { AlertCircle, X } from "lucide-react";

type AboutBenjiModalProps = {
  open: boolean;
  onClose: () => void;
};

export function AboutBenjiModal({ open, onClose }: AboutBenjiModalProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-xl max-w-md w-full p-5 sm:p-6 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 p-1 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          aria-label="Sluiten"
        >
          <X size={20} />
        </button>
        <div className="flex gap-3 mb-3">
          <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center flex-shrink-0">
            <AlertCircle className="text-primary-600" size={22} />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Over Benji</h3>
            <p className="text-xs text-gray-500">Geen professionele hulp</p>
          </div>
        </div>
        <p className="text-sm text-gray-700 leading-relaxed">
          Ik ben Benji, een AI-chatbot. Ik denk graag met je mee en sta voor je
          klaar, maar ik bied geen professionele hulp. Bij grote vragen of
          problemen raad ik altijd aan om professionele hulp te zoeken.
        </p>
      </div>
    </div>
  );
}
