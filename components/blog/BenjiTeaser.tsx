"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Mic, Square, Printer } from "lucide-react";

const VRAGEN = [
  "Wat draag je vandaag met je mee dat je nog niet hardop hebt gezegd?",
  "Wat heeft je de laatste tijd het meeste energie gekost?",
  "Wat heb je nodig — van jezelf of van anderen?",
];

export function BenjiTeaserReflectie() {
  const [antwoorden, setAntwoorden] = useState(["", "", ""]);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [opnameIndex, setOpnameIndex] = useState<number | null>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    setSpeechSupported(!!SR);
  }, []);

  const setAntwoord = (i: number, v: string) =>
    setAntwoorden((prev) => prev.map((a, j) => (j === i ? v : a)));

  const toggleMic = (i: number) => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;

    if (opnameIndex === i) {
      recognitionRef.current?.stop();
      setOpnameIndex(null);
      return;
    }

    recognitionRef.current?.stop();
    const rec = new SR();
    rec.lang = "nl-NL";
    rec.interimResults = false;
    rec.onresult = (e: any) => {
      const transcript = e.results[0][0].transcript;
      setAntwoord(i, antwoorden[i] ? antwoorden[i] + " " + transcript : transcript);
    };
    rec.onend = () => setOpnameIndex(null);
    rec.start();
    recognitionRef.current = rec;
    setOpnameIndex(i);
  };

  const ingevuld = antwoorden.some((a) => a.trim());

  const handlePrint = () => {
    const esc = (t: string) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, "<br/>");
    const datum = new Date().toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric" });
    const html = `<!DOCTYPE html>
<html lang="nl">
<head>
<meta charset="utf-8">
<title>Mijn reflectie — ${datum}</title>
<style>
  body { font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 48px auto; color: #2d3748; line-height: 1.8; }
  h1 { font-size: 24px; font-weight: normal; color: #1a202c; margin: 0 0 4px; }
  .meta { font-size: 13px; color: #a0aec0; margin-bottom: 40px; }
  .entry { margin-bottom: 32px; page-break-inside: avoid; }
  .vraag { font-size: 13px; font-weight: 600; color: #718096; margin-bottom: 8px; }
  .antwoord { font-size: 15px; color: #2d3748; border-left: 3px solid #e2e8f0; padding-left: 18px; }
  @media print { body { margin: 24px; } }
</style>
</head>
<body>
<h1>Mijn reflectie</h1>
<div class="meta">${datum} · Talk To Benji</div>
${VRAGEN.map((v, i) => `<div class="entry">
  <div class="vraag">${v}</div>
  <div class="antwoord">${antwoorden[i].trim() ? esc(antwoorden[i].trim()) : "<em style='color:#a0aec0'>— niet ingevuld</em>"}</div>
</div>`).join("")}
</body>
</html>`;
    const win = window.open("", "_blank");
    if (win) { win.document.write(html); win.document.close(); win.focus(); setTimeout(() => win.print(), 300); }
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
                {speechSupported && (
                  <button
                    type="button"
                    onClick={() => toggleMic(i)}
                    title={opnameIndex === i ? "Stop opname" : "Inspreken"}
                    className={`absolute right-2 bottom-2 p-1.5 rounded-lg transition-colors ${
                      opnameIndex === i
                        ? "bg-red-100 text-red-600 hover:bg-red-200"
                        : "bg-primary-100 text-primary-500 hover:bg-primary-200"
                    }`}
                  >
                    {opnameIndex === i ? <Square size={13} /> : <Mic size={13} />}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="px-6 pb-6 pt-2 flex flex-col sm:flex-row items-start sm:items-center gap-3">
        {ingevuld ? (
          <>
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
            >
              <Printer size={15} />
              Opslaan of afdrukken
            </button>
            <Link
              href="/"
              className="inline-flex items-center gap-1 text-sm text-primary-600 hover:text-primary-800 font-medium transition-colors"
            >
              Praat verder met Benji →
            </Link>
          </>
        ) : (
          <Link
            href="/"
            className="inline-block bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
          >
            Praat verder met Benji →
          </Link>
        )}
      </div>
    </div>
  );
}
