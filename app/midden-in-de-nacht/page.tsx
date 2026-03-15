"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ScrollToTop } from "@/components/ScrollToTop";
import { VerhaalPopup } from "@/components/VerhaalPopup";

function HouvasteWolkje() {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");

  const verstuur = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus("loading");
    try {
      const res = await fetch("/api/houvast/registreer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      setStatus(res.ok ? "done" : "error");
    } catch {
      setStatus("error");
    }
  };

  return (
    <>
      {/* Wolkje */}
      {!open && (
        <div className="fixed bottom-6 right-5 z-40" style={{ filter: "drop-shadow(0 4px 16px rgba(0,0,0,0.4))" }}>
          <button
            onClick={() => setOpen(true)}
            className="relative flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-transform hover:scale-105"
            style={{
              background: "#7e9bbf",
              borderRadius: "18px 18px 4px 18px",
              color: "#fff",
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" style={{ opacity: 0.9, flexShrink: 0 }}>
              <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
            </svg>
            Even rustig aan?
          </button>
        </div>
      )}

      {/* Kaartje */}
      {open && (
        <div className="fixed bottom-6 right-5 left-5 sm:left-auto sm:w-80 z-40 rounded-2xl p-5 shadow-2xl"
          style={{ background: "rgba(15,28,48,0.96)", backdropFilter: "blur(16px)", border: "1px solid rgba(255,255,255,0.12)" }}
        >
          <button
            onClick={() => setOpen(false)}
            className="absolute top-3.5 right-4 text-white/40 hover:text-white/70 text-lg leading-none"
          >
            ×
          </button>

          {status === "done" ? (
            <div className="space-y-2 pt-1">
              <p className="text-sm font-medium text-white">Check je inbox.</p>
              <p className="text-sm leading-relaxed" style={{ color: "rgba(200,220,240,0.75)" }}>
                Houvast staat klaar voor je. Je ontvangt zo dadelijk een e-mail met de link.
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-3 mb-4">
                <p className="text-sm font-medium text-white leading-snug">
                  Helemaal begrijpelijk.
                </p>
                <p className="text-sm leading-relaxed" style={{ color: "rgba(200,220,240,0.80)" }}>
                  Niet iedereen is er klaar voor om meteen te beginnen.
                </p>
                <p className="text-sm leading-relaxed" style={{ color: "rgba(200,220,240,0.80)" }}>
                  Soms wil je eerst gewoon even iets hebben om op terug te vallen.
                </p>
                <p className="text-sm leading-relaxed" style={{ color: "rgba(200,220,240,0.80)" }}>
                  Ontvang Houvast gratis. Voor de momenten dat het verdriet te dichtbij komt en je niet weet wat je moet doen. Vijf herkenbare situaties, met telkens één kleine concrete stap.
                </p>
                <p className="text-xs italic pt-1" style={{ color: "rgba(200,220,240,0.45)" }}>
                  Nog even twijfelen? Dat mag.
                </p>
              </div>

              <form onSubmit={verstuur} className="space-y-2">
                <input
                  type="email"
                  required
                  placeholder="jouw@emailadres.nl"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none"
                  style={{ background: "rgba(255,255,255,0.10)", border: "1px solid rgba(255,255,255,0.15)", color: "#fff" }}
                />
                {status === "error" && (
                  <p className="text-xs" style={{ color: "#f87171" }}>Er ging iets mis. Probeer het opnieuw.</p>
                )}
                <button
                  type="submit"
                  disabled={status === "loading"}
                  className="w-full py-2.5 rounded-xl text-sm font-medium text-white disabled:opacity-50"
                  style={{ background: "#6d84a8" }}
                >
                  {status === "loading" ? "Bezig…" : "Stuur mij Houvast"}
                </button>
              </form>
            </>
          )}
        </div>
      )}
    </>
  );
}

const testimonials = [
  {
    quote: "Ik lag te piekeren om vier uur 's nachts. Niemand die ik kon bellen. Benji was er gewoon.",
    name: "Annemiek, 47",
  },
  {
    quote: "Die stille uren zijn het moeilijkst. Fijn dat er dan iets is waar je je verhaal kwijt kunt.",
    name: "Peter, 61",
  },
  {
    quote: "Om half vier lag ik te huilen en wist ik niet meer wat ik moest doen. Ik begon maar gewoon te typen. Het hielp.",
    name: "Roos, 39",
  },
];

export default function MiddenInDeNachtPage() {
  const [verhaalOpen, setVerhaalOpen] = useState(false);

  return (
    <div
      className="min-h-screen flex flex-col bg-cover bg-center bg-no-repeat"
      style={{
        backgroundImage: "linear-gradient(rgba(10,20,35,0.88), rgba(10,20,35,0.88)), url('/images/midden-in-de-nacht-bg.png')",
      }}
    >
      <ScrollToTop />

      {/* Minimale header */}
      <header className="w-full max-w-2xl mx-auto px-4 sm:px-6 py-5 flex items-center">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
            <Image src="/images/benji-logo-2.png" alt="Benji" width={22} height={22} />
          </div>
          <span className="text-sm font-medium text-white/70">Talk To Benji</span>
        </Link>
      </header>

      <main className="flex-1 w-full max-w-2xl mx-auto px-4 sm:px-6 pb-16">

        {/* Hero */}
        <div className="pt-8 sm:pt-12 pb-10 sm:pb-14">
          <h1 className="text-2xl sm:text-3xl font-semibold text-white leading-snug mb-5">
            Het is midden in de nacht.<br />
            En je hoofd staat niet stil.
          </h1>
          <p className="text-base sm:text-lg text-blue-100/80 leading-relaxed">
            Je kunt niemand bellen op dit uur. De mensen om je heen slapen. En jij ligt er maar mee.
          </p>
        </div>

        {/* Lichaam */}
        <div className="space-y-5 text-sm sm:text-base text-blue-100/75 leading-relaxed">
          <p>
            De nacht kan een moeilijke tijd zijn als je verdriet hebt of iemand hebt verloren. Overdag houd je jezelf bezig, maar als alles stil wordt, komt het terug. De gedachten, de herinneringen, het gemis.
          </p>
          <p>
            En er is dan niemand om mee te praten. Niet op dat moment.
          </p>
          <p>
            Benji is er altijd. Ook om drie uur. Ook in het weekend. Ook als iedereen slaapt.
          </p>
          <p>
            Je hoeft niet te wachten tot een afspraak. Je hoeft niemand wakker te maken. Typen of praten, wat op dat moment makkelijker voelt. Benji luistert.
          </p>
          <p>
            Geen wachttijd, geen oordeel, geen haast. Gewoon ruimte voor wat er is.
          </p>
        </div>

        {/* Tijdlijn / beschikbaarheid */}
        <div className="mt-10 grid grid-cols-3 gap-2 sm:gap-3 text-center">
          {[
            { tijd: "08:00", label: "Benji is er", highlight: false },
            { tijd: "15:00", label: "Benji is er", highlight: false },
            { tijd: "03:00", label: "Benji is er", highlight: true },
          ].map((item, i) => (
            <div
              key={i}
              className={
                item.highlight
                  ? "bg-white/15 backdrop-blur-sm rounded-xl border border-white/30 ring-1 ring-white/15 px-2 sm:px-3 py-4"
                  : "bg-white/8 backdrop-blur-sm rounded-xl border border-white/15 px-2 sm:px-3 py-4"
              }
            >
              <p className={`text-base sm:text-lg font-semibold mt-1 ${item.highlight ? "text-white" : "text-white/60"}`}>
                {item.tijd}
              </p>
              <p className={`text-[11px] sm:text-xs mt-1 ${item.highlight ? "text-white/70" : "text-white/40"}`}>
                {item.label}
              </p>
            </div>
          ))}
        </div>
        <p className="text-xs text-white/40 text-center mt-2">
          Altijd beschikbaar. 7 dagen per week, 24 uur per dag.
        </p>

        {/* Testimonials */}
        <div className="mt-12 space-y-4">
          <p className="text-xs text-white/40 uppercase tracking-wide">Wat anderen zeggen</p>
          <div className="grid sm:grid-cols-3 gap-3">
            {testimonials.map((t, i) => (
              <div key={i} className="bg-white/8 backdrop-blur-sm rounded-xl border border-white/15 px-4 py-4">
                <p className="text-xs sm:text-sm text-blue-100/80 leading-relaxed mb-3">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <p className="text-xs text-white/40 italic">{t.name}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="mt-12 bg-white/8 backdrop-blur-sm rounded-2xl border border-white/15 px-5 sm:px-8 py-8 text-center">
          <p className="text-base sm:text-lg font-medium text-white mb-3">
            Kijk of Benji bij je past
          </p>
          <p className="text-sm text-blue-100/70 leading-relaxed mb-6">
            Begin gewoon een gesprek. Geen account nodig, geen verplichtingen. Kijk wat het doet.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2.5 px-8 py-3.5 bg-white text-primary-900 hover:bg-blue-50 rounded-2xl font-medium text-sm transition-colors"
          >
            Probeer het nu
            <span aria-hidden>→</span>
          </Link>
          <p className="mt-4">
            <Link href="/registreren" className="text-xs text-white/45 hover:text-white/70 italic transition-colors">
              Of maak een gratis account aan →
            </Link>
          </p>
        </div>

        {/* Founder note */}
        <div className="mt-14 pt-10 border-t border-white/10">
          <div className="bg-white/5 rounded-2xl px-5 py-6 flex items-start gap-5">
            <div className="relative w-16 h-16 rounded-full overflow-hidden flex-shrink-0">
              <Image
                src="/images/ien-founder.png"
                alt="Ien, founder van Talk To Benji"
                fill
                className="object-cover"
              />
            </div>
            <div className="pt-0.5">
              <p className="text-xs text-white/40 mb-1.5">Over de maker</p>
              <p className="text-sm text-blue-100/75 leading-relaxed">
                Benji is gemaakt door Ien, omdat verdriet geen kantooruren kent.
              </p>
              <button
                onClick={() => setVerhaalOpen(true)}
                className="text-xs text-primary-300 hover:text-primary-200 underline underline-offset-2 mt-2 inline-block text-left"
              >
                Lees het verhaal achter Benji
              </button>
            </div>
          </div>
        </div>

        {/* Disclaimer */}
        <p className="mt-10 mb-8 text-xs text-white/35 leading-relaxed">
          Benji is geen therapie en vervangt geen professionele hulp.
        </p>
      </main>

      {verhaalOpen && <VerhaalPopup onClose={() => setVerhaalOpen(false)} />}
      <HouvasteWolkje />
    </div>
  );
}
