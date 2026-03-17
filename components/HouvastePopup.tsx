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
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-sm rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden"
        style={{ background: "#2d3a4f" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sluitknop */}
        <div className="flex justify-end px-4 pt-4">
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/50 hover:text-white/80 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-6 pb-7 pt-1">
          {status === "done" ? (
            <div className="text-center py-6 space-y-2">
              <p className="text-3xl">✓</p>
              <p className="font-semibold text-white">Check je inbox</p>
              <p className="text-sm text-white/60 leading-relaxed">
                Houvast staat klaar voor je. Je ontvangt zo dadelijk een e-mail met de link.
              </p>
              <button
                onClick={onClose}
                className="mt-2 text-xs text-white/40 hover:text-white/70 underline"
              >
                Sluiten
              </button>
            </div>
          ) : (
            <>
              <h2 className="text-lg font-semibold text-white mb-4">Helemaal begrijpelijk.</h2>
              <p className="text-sm text-white/70 leading-relaxed mb-3">
                Niet iedereen is er klaar voor om meteen te beginnen.
              </p>
              <p className="text-sm text-white/70 leading-relaxed mb-3">
                Soms wil je eerst gewoon even iets hebben om op terug te vallen.
              </p>
              <p className="text-sm text-white/70 leading-relaxed mb-6">
                Ontvang &lsquo;Houvast&rsquo; gratis. Voor de momenten dat het verdriet te dichtbij
                komt en je niet weet wat je moet doen. Vijf herkenbare situaties, met telkens één
                kleine concrete stap.
              </p>
              <form onSubmit={handleSubmit} className="space-y-3">
                <input
                  type="text"
                  placeholder="Jouw voornaam"
                  value={naam}
                  onChange={(e) => setNaam(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl text-sm outline-none bg-white/10 border border-white/15 text-white placeholder-white/40 focus:ring-2 focus:ring-white/30"
                />
                <input
                  type="email"
                  required
                  placeholder="jouw@emailadres.nl"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl text-sm outline-none bg-white/10 border border-white/15 text-white placeholder-white/40 focus:ring-2 focus:ring-white/30"
                />
                <button
                  type="submit"
                  disabled={status === "loading"}
                  className="w-full py-3 rounded-2xl font-medium text-white text-sm transition-colors disabled:opacity-60"
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
    </div>
  );
}
