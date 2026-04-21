"use client";

import { useState } from "react";
import { HouvastePopup } from "@/components/HouvastePopup";

export function HouvasteKnop() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {open && <HouvastePopup onClose={() => setOpen(false)} />}
      <button
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-20 right-4 z-40 flex items-center gap-2 text-white text-sm font-medium px-4 py-2.5 rounded-full shadow-lg transition-colors"
        style={{ backgroundColor: "#7ec8e3" }}
        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#5bb8d4")}
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#7ec8e3")}
        aria-label="Ontvang Houvast gratis"
      >
        <span className="text-base leading-none">👋</span>
        Even Houvast
      </button>
    </>
  );
}
