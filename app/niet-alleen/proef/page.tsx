"use client";

/**
 * Taster-pagina: laat iemand die de Even Houvast-brief kreeg dag 1 (en dag 12 met
 * de ademoefening) van Niet Alleen ervaren, zonder account en zonder te betalen.
 * Bereikbaar via het naschrift in de brief: /niet-alleen/proef?type=huisdier&n=Anna
 * Onward naar de brugpagina: /niet-alleen/waarom.
 */

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { getDagInhoud } from "@/convex/nietAlleenContent";
import { normVerlies, contentTypeVoor } from "@/lib/nietAlleenTypes";

// De ademoefening van dag 12 (zelfde tekst als in het echte programma).
const OEFENING_DAG12 =
  "Er zijn dingen die we met ons meedragen zonder dat we ze een naam geven. Onuitgesproken woorden. Gemiste momenten. Dingen die er niet van zijn gekomen.\n\nDat gewicht zit ergens in je lichaam. Misschien in je keel. Misschien in je schouders. Misschien dieper.\n\nLeg je handen in je schoot. Voel het gewicht van je eigen handen. Adem in, en maak even ruimte voor wat er is. Niet om het op te lossen. Alleen om het een plek te geven naast je, in plaats van in je.\n\nAdem uit, en laat je schouders zakken, ook als ze maar een millimeter zakken.";

const MIC = (
  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="2" width="6" height="12" rx="3" />
    <path d="M5 10a7 7 0 0 0 14 0" />
    <line x1="12" y1="17" x2="12" y2="22" />
  </svg>
);
const IMG = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10" />
    <circle cx="9" cy="9" r="2" />
    <path d="M3 17l4-4 3 3" />
    <line x1="19" y1="16" x2="19" y2="22" />
    <line x1="16" y1="19" x2="22" y2="19" />
  </svg>
);

function ProefInner() {
  const params = useSearchParams();
  const type = normVerlies(params?.get("type"));
  const naam = (params?.get("n") || "").trim();
  const email = (params?.get("e") || "").trim();
  const contentType = contentTypeVoor(type);

  const [dag, setDag] = useState(1);
  const inhoud = getDagInhoud(dag, contentType);

  const naar = (d: number) => {
    setDag(d);
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const brugUrl =
    `/niet-alleen/waarom?type=${type}` +
    (naam ? `&n=${encodeURIComponent(naam)}` : "") +
    (email ? `&e=${encodeURIComponent(email)}` : "");

  return (
    <div className="min-h-screen" style={{ background: "#fdf9f4" }}>
      <style>{`@keyframes adem {0%{transform:scale(0.545);opacity:.55}33%{transform:scale(1);opacity:.78}41%{transform:scale(1);opacity:.78}91%{transform:scale(0.545);opacity:.55}100%{transform:scale(0.545);opacity:.55}}`}</style>

      <div className="max-w-lg mx-auto px-6 py-8 space-y-6">
        {/* Kop met dagteller */}
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-2">
            <span aria-hidden style={{ fontSize: 18 }}>🍃</span>
            <span className="text-sm font-medium" style={{ color: "#6b6460" }}>Niet Alleen</span>
          </div>
          <span className="text-xs font-medium px-3 py-1.5 rounded-full" style={{ color: "#6d84a8", background: "#eef1f6" }}>
            Dag {dag} van 30
          </span>
        </div>

        {/* Dagprompt */}
        <div className="space-y-2 pt-2">
          <p className="text-xs uppercase tracking-widest font-medium" style={{ color: "#b0a8a0", letterSpacing: "0.13em" }}>
            Dag {dag} · {inhoud?.thema ?? ""}
          </p>
          <p className="text-lg leading-relaxed font-medium" style={{ color: "#3d3530" }}>
            {inhoud?.inHetAccount ?? ""}
          </p>
          {inhoud?.alsjewilt && (
            <p className="text-sm leading-relaxed" style={{ color: "#8a8078" }}>
              Als je wilt: {inhoud.alsjewilt}
            </p>
          )}
        </div>

        {/* Ademoefening — alleen op dag 12 */}
        {dag === 12 && (
          <div className="rounded-2xl border" style={{ background: "#f0ebe4", borderColor: "#e8e0d8", padding: "1.25rem 1rem 1.5rem" }}>
            <p className="text-xs uppercase tracking-widest font-medium mb-3" style={{ color: "#b0a8a0" }}>
              Even landen voordat je schrijft
            </p>
            <div className="space-y-2 text-sm leading-relaxed mb-4" style={{ color: "#6b6460" }}>
              {OEFENING_DAG12.split("\n\n").map((a, i) => (
                <p key={i}>{a}</p>
              ))}
            </div>
            <p className="text-sm italic mb-5" style={{ color: "#8a8078" }}>
              Volg de cirkel met je adem, hij ademt voor je.
            </p>
            <div className="flex justify-center" style={{ height: 110 }}>
              <div style={{ width: 110, height: 110, borderRadius: "50%", background: "rgba(109,132,168,0.4)", boxShadow: "0 0 24px 8px rgba(109,132,168,0.18)", transform: "scale(0.545)", animation: "adem 12s ease-in-out infinite" }} />
            </div>
          </div>
        )}

        {/* Schrijfveld met microfoon (in de proef nog niet actief) */}
        <div className="relative">
          <div className="w-full rounded-2xl p-4 text-base leading-relaxed border" style={{ background: "white", borderColor: "#e8e0d8", color: "#b0a8a0", minHeight: 132 }}>
            Schrijf hier wat er in je opkomt, er is geen goed of fout.
          </div>
          <div className="absolute bottom-3 right-3 p-2.5 rounded-full" style={{ background: "#f0ebe4", color: "#8a8078" }}>
            {MIC}
          </div>
        </div>

        {/* Foto toevoegen */}
        <div>
          <span className="inline-flex items-center gap-2 text-sm px-4 py-2 rounded-xl border" style={{ borderColor: "#e8e0d8", color: "#8a8078", background: "white" }}>
            {IMG} Voeg een foto toe
          </span>
        </div>

        {/* Uitnodiging */}
        <div className="pt-4" style={{ borderTop: "1px dashed #e4d8c8", textAlign: "center" }}>
          {dag === 1 ? (
            <>
              <p className="text-sm leading-relaxed mb-4" style={{ color: "#6b6460" }}>
                Deed deze vraag iets met je? Zo gaat het dertig dagen lang. Elke dag één kleine vraag, en soms een moment om even te landen.
              </p>
              <button
                onClick={() => naar(12)}
                className="text-sm font-semibold px-5 py-3 rounded-xl"
                style={{ background: "#fdf9f4", color: "#9a8168", border: "1.5px solid #9a8168" }}
              >
                Proef ook een dag met een oefening →
              </button>
            </>
          ) : (
            <>
              <p className="text-sm leading-relaxed mb-3" style={{ color: "#6b6460" }}>
                En zo dertig dagen lang, elke dag net even anders. Geen huiswerk, geen druk.
              </p>
              <p className="text-sm leading-relaxed mb-5" style={{ color: "#6b6460" }}>
                Gewoon elke dag iets dat er voor je is.
              </p>
              <Link
                href={brugUrl}
                className="inline-block text-sm font-semibold px-5 py-3 rounded-xl"
                style={{ background: "#fdf9f4", color: "#9a8168", border: "1.5px solid #9a8168" }}
              >
                Kijk wat Niet Alleen je brengt →
              </Link>
              <div>
                <button onClick={() => naar(1)} className="text-sm mt-4" style={{ color: "#8a8078", background: "none" }}>
                  ‹ Terug naar dag 1
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ProefPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", background: "#fdf9f4" }} />}>
      <ProefInner />
    </Suspense>
  );
}
