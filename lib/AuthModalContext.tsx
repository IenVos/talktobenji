"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import { AuthModal } from "@/components/chat/AuthModal";

type AuthModalContextType = {
  showAuthModal: boolean;
  setShowAuthModal: (v: boolean) => void;
};

const AuthModalContext = createContext<AuthModalContextType | null>(null);

export function AuthModalProvider({ children }: { children: ReactNode }) {
  const [showAuthModal, setShowAuthModal] = useState(false);
  return (
    <AuthModalContext.Provider value={{ showAuthModal, setShowAuthModal }}>
      {children}
      <AuthModal
        open={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </AuthModalContext.Provider>
  );
}

export function useAuthModal() {
  const ctx = useContext(AuthModalContext);
  if (!ctx) throw new Error("useAuthModal must be used within AuthModalProvider");
  return ctx;
}
