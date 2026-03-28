"use client";

import { useState } from "react";
import Link from "next/link";
import { Lock, AlertTriangle } from "lucide-react";
import { ErvaringenTrigger } from "./ErvaringenPopup";

// variant prop wordt geaccepteerd maar heeft geen effect meer — footer is altijd hetzelfde
export function SiteFooter({ variant }: { variant?: "light" | "dark" }) {
  const [popup, setPopup] = useState<"lock" | "warning" | null>(null);

  return (
    <footer className="bg-primary-900 px-5 py-8 text-center">
      {/* Nav links — 3×2 grid */}
      <div className="max-w-xs mx-auto grid grid-cols-3 gap-x-4 gap-y-2 text-xs text-white/50 mb-5">
        <Link href="/faq" className="hover:text-white/80 transition-colors">Veelgestelde vragen</Link>
        <Link href="/privacy" className="hover:text-white/80 transition-colors">Privacy</Link>
        <Link href="/algemene-voorwaarden" className="hover:text-white/80 transition-colors">Algemene voorwaarden</Link>
        <Link href="/blog" className="hover:text-white/80 transition-colors">Blog</Link>
        <ErvaringenTrigger className="hover:text-white/80 transition-colors cursor-pointer text-white/50">Ervaringen</ErvaringenTrigger>
        <Link href="/contact" className="hover:text-white/80 transition-colors">Contact</Link>
      </div>

      {/* Disclaimer icoontjes */}
      <div className="flex justify-center gap-4 mb-4">
        <div className="relative">
          <button
            onClick={() => setPopup(popup === "lock" ? null : "lock")}
            className="text-white/30 hover:text-white/60 transition-colors p-1"
            aria-label="Privacy"
          >
            <Lock size={13} />
          </button>
          {popup === "lock" && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setPopup(null)} />
              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-white text-gray-700 text-xs px-3 py-2 rounded-lg shadow-lg whitespace-nowrap z-50">
                Gesprekken zijn privé en beveiligd.
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-white" />
              </div>
            </>
          )}
        </div>

        <div className="relative">
          <button
            onClick={() => setPopup(popup === "warning" ? null : "warning")}
            className="text-white/30 hover:text-white/60 transition-colors p-1"
            aria-label="Disclaimer"
          >
            <AlertTriangle size={13} />
          </button>
          {popup === "warning" && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setPopup(null)} />
              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-white text-gray-700 text-xs px-3 py-2 rounded-lg shadow-lg whitespace-nowrap z-50">
                Geen vervanging van professionele hulp.
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-white" />
              </div>
            </>
          )}
        </div>
      </div>

      <p className="text-[11px] text-white/25">© Talk To Benji · talktobenji.com</p>
    </footer>
  );
}
