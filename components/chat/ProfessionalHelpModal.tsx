"use client";

import { UserCircle, X } from "lucide-react";

type ProfessionalHelpModalProps = {
  open: boolean;
  onClose: () => void;
};

export function ProfessionalHelpModal({ open, onClose }: ProfessionalHelpModalProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-xl max-w-md w-full p-5 sm:p-6 relative max-h-[85vh] overflow-y-auto"
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
        <div className="flex gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-[#e8eded] flex items-center justify-center flex-shrink-0">
            <UserCircle className="text-[#5a8a8a]" size={22} />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Professionele hulp zoeken</h3>
            <p className="text-xs text-gray-500">Hulplijnen en hulpverleners</p>
          </div>
        </div>
        <p className="text-sm text-gray-700 leading-relaxed mb-4">
          Benji is geen vervanging voor professionele hulp. Bij aanhoudend verdriet,
          depressie of behoefte aan gesprek met een professional kun je terecht bij:
        </p>
        <ul className="text-sm text-gray-700 space-y-2 list-disc list-inside">
          <li><strong>113 Zelfmoordpreventie:</strong> 0800-0113 (24/7)</li>
          <li><strong>De Luisterlijn:</strong> 088-0767000</li>
          <li><strong>Slachtofferhulp Nederland:</strong> 0900-0101</li>
          <li>Huisarts of praktijkondersteuner (POH-GGZ)</li>
        </ul>
      </div>
    </div>
  );
}
