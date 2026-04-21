"use client";

import { useState } from "react";
import Link from "next/link";
import { Lock, AlertTriangle } from "lucide-react";
import { ErvaringenTrigger } from "./ErvaringenPopup";

export function SiteFooter({ variant }: { variant?: "light" | "dark" }) {
  const [popup, setPopup] = useState<"lock" | "warning" | null>(null);

  return (
    <footer className="bg-primary-900 px-4 py-8 text-center">
      <div className="flex items-center justify-center gap-4 flex-wrap">
        <Link href="/faq" className="text-xs text-white/50 hover:text-white/80 transition-colors">
          Veelgestelde vragen
        </Link>
        <Link href="/privacy" className="text-xs text-white/50 hover:text-white/80 transition-colors">
          Privacy
        </Link>
        <Link href="/algemene-voorwaarden" className="text-xs text-white/50 hover:text-white/80 transition-colors">
          Algemene voorwaarden
        </Link>
        <Link href="/contact" className="text-xs text-white/50 hover:text-white/80 transition-colors">
          Contact
        </Link>
        <ErvaringenTrigger className="hidden sm:inline text-xs text-white/50 hover:text-white/80 transition-colors cursor-pointer">
          Ervaringen
        </ErvaringenTrigger>
        <Link href="/blog" className="hidden sm:inline text-xs text-white/50 hover:text-white/80 transition-colors">
          Blog
        </Link>

        {/* Slot-icoontje */}
        <div className="relative">
          <button
            onClick={() => setPopup(popup === "lock" ? null : "lock")}
            className="text-amber-400 hover:text-amber-300 transition-colors p-1"
            aria-label="Privacy"
          >
            <Lock size={12} />
          </button>
          {popup === "lock" && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setPopup(null)} />
              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-white text-gray-700 text-xs px-3 py-2 rounded-lg shadow-lg z-50" style={{ whiteSpace: "nowrap" }}>
                Gesprekken zijn privé en beveiligd.
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-white" />
              </div>
            </>
          )}
        </div>

        {/* Driehoek-icoontje */}
        <div className="relative">
          <button
            onClick={() => setPopup(popup === "warning" ? null : "warning")}
            className="text-amber-400 hover:text-amber-300 transition-colors p-1"
            aria-label="Disclaimer"
          >
            <AlertTriangle size={12} />
          </button>
          {popup === "warning" && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setPopup(null)} />
              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-white text-gray-700 text-xs px-3 py-2 rounded-lg shadow-lg z-50" style={{ whiteSpace: "nowrap" }}>
                Geen vervanging van professionele hulp.
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-white" />
              </div>
            </>
          )}
        </div>
      </div>

      <p className="text-[10px] text-white/40 mt-1">© Talk To Benji · talktobenji.com</p>
    </footer>
  );
}
