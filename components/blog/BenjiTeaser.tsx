"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { Mic, MicOff, Download } from "lucide-react";

const VRAGEN = [
  "Wat draag je vandaag met je mee dat je nog niet hardop hebt gezegd?",
  "Wat heeft je de laatste tijd het meeste energie gekost?",
  "Wat heb je nodig — van jezelf of van anderen?",
];

function MicButton({ onResult }: { onResult: (text: string) => void }) {
  const [luistert, setLuistert] = useState(false);
  const recRef = useRef<any>(null);

  const toggle = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;
    if (luistert) {
      recRef.current?.stop();
      setLuistert(false);
      return;
    }
    const rec = new SR();
    rec.lang = "nl-NL";
    rec.interimResults = false;
    rec.onresult = (e: any) => onResult(e.results[0][0].transcript);
    rec.onend = () => setLuistert(false);
    rec.start();
    recRef.current = rec;
    setLuistert(true);
  };

  return (
    <button
      type="button"
      onClick={toggle}
      title={luistert ? "Stop opname" : "Inspreken"}
      className={`absolute right-2 bottom-2 p-1.5 rounded-lg transition-colors ${
        luistert
          ? "bg-red-100 text-red-600 hover:bg-red-200"
          : "bg-primary-50 text-primary-500 hover:bg-primary-100"
      }`}
    >
      {luistert ? <MicOff size={14} /> : <Mic size={14} />}
    </button>
  );
}

export function BenjiTeaserReflectie() {
  const [antwoorden, setAntwoorden] = useState(["", "", ""]);

  const setAntwoord = (i: number, v: string) =>
    setAntwoorden((prev) => prev.map((a, j) => (j === i ? v : a)));

  const ingevuld = antwoorden.some((a) => a.trim());

  const handleDownload = () => {
    const tekst = VRAGEN.map((v, i) => `${v}\n\n${antwoorden[i].trim() || "—"}`).join("\n\n---\n\n");
    const blob = new Blob([tekst], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "mijn-reflectie.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="my-10 rounded-2xl bg-primary-50 border border-primary-200 overflow-hidden">
      <div className="px-6 pt-6 pb-4">
        <p className="text-xs uppercase tracking-widest text-primary-500 mb-1">Korte reflectie</p>
        <p className="text-base text-stone-500 mb-5">Neem even de tijd voor jezelf. Je hoeft niets te delen.</p>

        <div className="space-y-5">
          {VRAGEN.map((vraag, i) => (
            <div key={i}>
              <p className="text-sm font-semibold text-stone-700 mb-2">{vraag}</p>
              <div className="relative">
                <textarea
                  value={antwoorden[i]}
                  onChange={(e) => setAntwoord(i, e.target.value)}
                  placeholder="Schrijf hier wat er in je opkomt…"
                  rows={3}
                  className="w-full px-4 py-3 pr-10 rounded-xl border border-primary-200 bg-white text-sm text-stone-700 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-primary-300 resize-none leading-relaxed"
                />
                <MicButton onResult={(t) => setAntwoord(i, antwoorden[i] ? antwoorden[i] + " " + t : t)} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="px-6 pb-6 pt-2 flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <Link
          href="/"
          className="inline-block bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
        >
          Praat verder met Benji →
        </Link>
        {ingevuld && (
          <button
            type="button"
            onClick={handleDownload}
            className="inline-flex items-center gap-2 text-sm text-primary-600 hover:text-primary-800 transition-colors"
          >
            <Download size={15} />
            Download mijn antwoorden
          </button>
        )}
      </div>
    </div>
  );
}
