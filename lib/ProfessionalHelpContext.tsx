"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import { ProfessionalHelpModal } from "@/components/chat/ProfessionalHelpModal";

type ProfessionalHelpContextType = {
  showProfessionalHelp: boolean;
  setShowProfessionalHelp: (v: boolean) => void;
};

const ProfessionalHelpContext = createContext<ProfessionalHelpContextType | null>(null);

export function ProfessionalHelpProvider({ children }: { children: ReactNode }) {
  const [showProfessionalHelp, setShowProfessionalHelp] = useState(false);
  return (
    <ProfessionalHelpContext.Provider value={{ showProfessionalHelp, setShowProfessionalHelp }}>
      {children}
      <ProfessionalHelpModal
        open={showProfessionalHelp}
        onClose={() => setShowProfessionalHelp(false)}
      />
    </ProfessionalHelpContext.Provider>
  );
}

export function useProfessionalHelp() {
  const ctx = useContext(ProfessionalHelpContext);
  if (!ctx) throw new Error("useProfessionalHelp must be used within ProfessionalHelpProvider");
  return ctx;
}
