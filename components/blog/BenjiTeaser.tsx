"use client";

import { useState } from "react";
import Link from "next/link";

const REFLECTIE_VRAGEN = [
  "Wat draag je vandaag met je mee dat je nog niet hardop hebt gezegd?",
  "Als je gevoel een kleur zou zijn vandaag, welke zou dat zijn en waarom?",
  "Wat heeft je de afgelopen tijd het meeste energie gekost?",
  "Is er iets wat je mist, maar nog niet de ruimte hebt gegeven?",
  "Wat zou je tegen jezelf zeggen als je je beste vriend was?",
];

function getDailyVraag() {
  const day = new Date().getDate();
  return REFLECTIE_VRAGEN[day % REFLECTIE_VRAGEN.length];
}

export function BenjiTeaserReflectie() {
  const [tekst, setTekst] = useState("");
  const vraag = getDailyVraag();

  const href = tekst.trim()
    ? `/registreren?q=${encodeURIComponent(tekst.trim())}`
    : "/registreren";

  return (
    <div className="my-10 rounded-2xl bg-primary-50 border border-primary-200 overflow-hidden">
      <div className="px-6 pt-6 pb-2">
        <p className="text-xs uppercase tracking-widest text-primary-500 mb-3">Korte reflectie</p>
        <p className="text-lg font-semibold text-stone-800 leading-snug mb-4">{vraag}</p>
        <textarea
          value={tekst}
          onChange={(e) => setTekst(e.target.value)}
          placeholder="Schrijf hier wat er in je opkomt — zonder te oordelen…"
          rows={4}
          className="w-full px-4 py-3 rounded-xl border border-primary-200 bg-white text-sm text-stone-700 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-primary-300 resize-none leading-relaxed"
        />
      </div>
      <div className="px-6 pb-6 pt-3 flex flex-col items-start gap-2">
        <Link
          href={href}
          className="inline-block bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
        >
          {tekst.trim() ? "Praat hierover met Benji →" : "Begin gesprek met Benji →"}
        </Link>
        <p className="text-xs text-stone-400">7 dagen gratis · geen creditcard nodig</p>
      </div>
    </div>
  );
}
