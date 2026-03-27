"use client";

import { useState } from "react";
import { X } from "lucide-react";

export function HouvastePopup({ onClose }: { onClose: () => void }) {
  const [naam, setNaam] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus("loading");
    try {
      const res = await fetch("/api/houvast/registreer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), name: naam.trim() || undefined }),
      });
      if (!res.ok) throw new Error("Fout");
      setStatus("done");
    } catch {
      setStatus("error");
    }
  };

  return (
    <div
      className="fixed bottom-[70px] right-4 z-50 w-80 max-h-[calc(100dvh-80px)] overflow-y-auto rounded-2xl shadow-2xl"
      style={{ background: "#2d3a4f" }}
    >
      {/* Sluitknop */}
      <div className="flex justify-end px-4 pt-3">
        <button
          onClick={onClose}
          className="p-1 rounded-lg text-white/40 hover:text-white/80 transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      <div className="px-5 pb-5 pt-0">
        {status === "done" ? (
          <div className="text-center py-4 space-y-2 bg-white/10 rounded-xl px-4">
            <p className="text-2xl">✓</p>
            <p className="font-semibold text-white">Check je inbox</p>
            <p className="text-sm text-white/90 leading-relaxed">
              Houvast staat klaar voor je. Je ontvangt zo dadelijk een e-mail met de link.
            </p>
            <button
              onClick={onClose}
              className="mt-2 text-xs text-white/70 hover:text-white underline"
            >
              Sluiten
            </button>
          </div>
        ) : (
          <>
            <h2 className="text-base font-semibold text-white mb-3">Helemaal begrijpelijk.</h2>
            <p className="text-sm text-white/70 leading-relaxed mb-2">
              Niet iedereen is er klaar voor om meteen te beginnen.
            </p>
            <p className="text-sm text-white/70 leading-relaxed mb-2">
              Soms wil je eerst gewoon even iets hebben om op terug te vallen.
            </p>
            <p className="text-sm text-white/70 leading-relaxed mb-4">
              Ontvang &lsquo;Houvast&rsquo; gratis. Voor de momenten dat het verdriet te dichtbij
              komt en je niet weet wat je moet doen. Vijf herkenbare situaties, met telkens één
              kleine concrete stap.
            </p>
            <form onSubmit={handleSubmit} className="space-y-2">
              <input
                type="text"
                placeholder="Jouw voornaam"
                value={naam}
                onChange={(e) => setNaam(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none bg-white/10 border border-white/15 text-white placeholder-white/40 focus:ring-2 focus:ring-white/30"
              />
              <input
                type="email"
                required
                placeholder="jouw@emailadres.nl"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none bg-white/10 border border-white/15 text-white placeholder-white/40 focus:ring-2 focus:ring-white/30"
              />
              <button
                type="submit"
                disabled={status === "loading"}
                className="w-full py-2.5 rounded-xl font-medium text-white text-sm transition-colors disabled:opacity-60"
                style={{ background: "#4a6080" }}
              >
                {status === "loading" ? "Bezig…" : "Even Houvast"}
              </button>
              {status === "error" && (
                <p className="text-xs text-red-400">Er ging iets mis. Probeer het opnieuw.</p>
              )}
            </form>
          </>
        )}
      </div>
    </div>
  );
}
