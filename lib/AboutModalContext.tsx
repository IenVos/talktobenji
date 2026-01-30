"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import { AboutBenjiModal } from "@/components/chat/AboutBenjiModal";

type AboutModalContextType = {
  showAbout: boolean;
  setShowAbout: (v: boolean) => void;
};

const AboutModalContext = createContext<AboutModalContextType | null>(null);

export function AboutModalProvider({ children }: { children: ReactNode }) {
  const [showAbout, setShowAbout] = useState(false);
  return (
    <AboutModalContext.Provider value={{ showAbout, setShowAbout }}>
      {children}
      <AboutBenjiModal open={showAbout} onClose={() => setShowAbout(false)} />
    </AboutModalContext.Provider>
  );
}

export function useAboutModal() {
  const ctx = useContext(AboutModalContext);
  if (!ctx) throw new Error("useAboutModal must be used within AboutModalProvider");
  return ctx;
}
