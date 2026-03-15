"use client";

import Image from "next/image";
import { useState } from "react";

export default function HouvasteePage() {
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
        body: JSON.stringify({ email: email.trim() }),
      });
      if (!res.ok) throw new Error("Fout");
      setStatus("done");
    } catch {
      setStatus("error");
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#fdf9f4", position: "relative" }}>

      <div style={{ position: "fixed", inset: 0, zIndex: 0 }}>
        <Image src="/images/achtergrond.png" alt="" fill className="object-cover" priority />
        <div style={{ position: "absolute", inset: 0, background: "rgba(253,249,244,0.84)" }} />
      </div>

      <div style={{ position: "relative", zIndex: 1 }}>
        <section className="flex items-center justify-center px-5 pt-16 pb-20">
          <div className="w-full max-w-md text-center">

            <p
              className="text-xs uppercase tracking-widest mb-5 font-medium"
              style={{ color: "#8a8078", letterSpacing: "0.14em" }}
            >
              gratis mini-gids
            </p>

            <h1
              className="text-3xl sm:text-4xl font-semibold mb-5 leading-snug"
              style={{ color: "#3d3530", textWrap: "balance" } as React.CSSProperties}
            >
              Houvast
            </h1>

            <p
              className="text-base leading-relaxed mb-3"
              style={{ color: "#6b6460", textWrap: "balance" } as React.CSSProperties}
            >
              Voor de momenten dat het extra zwaar voelt. Vijf kleine oefeningen die je nu meteen kunt doen.
            </p>

            <p
              className="text-sm leading-relaxed mb-10"
              style={{ color: "#8a8078", textWrap: "balance" } as React.CSSProperties}
            >
              Laat je e-mailadres achter en je ontvangt direct de link in je inbox.
            </p>

            {status === "done" ? (
              <div
                className="rounded-2xl px-6 py-8"
                style={{ background: "rgba(255,255,255,0.90)", boxShadow: "0 2px 20px rgba(0,0,0,0.07)" }}
              >
                <p className="text-2xl mb-3" style={{ color: "#3d3530" }}>✓</p>
                <p className="text-base font-medium mb-2" style={{ color: "#3d3530" }}>
                  Check je inbox
                </p>
                <p className="text-sm leading-relaxed" style={{ color: "#6b6460" }}>
                  Houvast staat klaar voor je. Je ontvangt zo dadelijk een e-mail met de link.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3">
                <input
                  type="email"
                  required
                  placeholder="jouw@emailadres.nl"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3.5 rounded-2xl text-sm outline-none"
                  style={{
                    background: "rgba(255,255,255,0.90)",
                    boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
                    color: "#3d3530",
                    border: "1px solid rgba(0,0,0,0.08)",
                  }}
                />
                <button
                  type="submit"
                  disabled={status === "loading"}
                  className="w-full py-3.5 rounded-2xl font-medium text-white text-sm disabled:opacity-60"
                  style={{ background: "#6d84a8" }}
                >
                  {status === "loading" ? "Bezig…" : "Stuur mij Houvast"}
                </button>
                {status === "error" && (
                  <p className="text-xs" style={{ color: "#c0392b" }}>
                    Er ging iets mis. Probeer het opnieuw.
                  </p>
                )}
              </form>
            )}

            <p className="text-xs mt-6" style={{ color: "#a09890" }}>
              Geen spam. Alleen Houvast.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
