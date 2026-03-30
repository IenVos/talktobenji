"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mic, Square, Download, ChevronDown, ChevronUp, PenLine, Smile, CalendarCheck, Gem, Moon } from "lucide-react";

const FEATURES = [
  { icon: PenLine, kleur: "text-teal-600 bg-teal-50", naam: "Reflecties", omschrijving: "Schrijven of inspreken, wanneer je wil" },
  { icon: Smile, kleur: "text-amber-500 bg-amber-50", naam: "Emotie-tracker", omschrijving: "Bijhouden hoe je stemming beweegt" },
  { icon: CalendarCheck, kleur: "text-primary-600 bg-primary-50", naam: "Dagelijkse check-in", omschrijving: "Korte vragen om de mist te klaren" },
  { icon: Gem, kleur: "text-violet-500 bg-violet-50", naam: "Memories", omschrijving: "Herinneringen bewaren zodat je ze niet vergeet" },
];

const VRAGEN: { vraag: string; placeholder: string }[] = [
  {
    vraag: "Wat draag je vandaag met je mee dat je nog niet hardop hebt gezegd?",
    placeholder: "Misschien iets wat je al een tijdje met je meedraagt…",
  },
  {
    vraag: "Wat heeft je de laatste tijd het meeste energie gekost?",
    placeholder: "Een situatie, een gevoel, of iemand in je omgeving…",
  },
  {
    vraag: "Wat heb je nodig — van jezelf of van anderen?",
    placeholder: "Rust, ruimte, begrip, of gewoon gehoord worden…",
  },
];

export function BenjiTeaserReflectie() {
  const router = useRouter();
  const [antwoorden, setAntwoorden] = useState(["", "", ""]);
  const [toonFeatures, setToonFeatures] = useState(false);
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

  const buildHtml = () => {
    const esc = (t: string) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, "<br/>");
    const datum = new Date().toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric" });
    return `<!DOCTYPE html>
<html lang="nl">
<head>
<meta charset="utf-8">
<title>Mijn reflectie — ${datum}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #f5f0eb; font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; padding: 48px 16px; }
  .card { background: #faf7f4; max-width: 580px; margin: 0 auto; border-radius: 12px; overflow: hidden; }
  .header { padding: 32px 40px 0; }
  .brand { display: flex; align-items: center; gap: 10px; margin-bottom: 28px; }
  .avatar { width: 40px; height: 40px; border-radius: 50%; background: #6d84a8; color: white; font-size: 14px; font-weight: 700; display: flex; align-items: center; justify-content: center; }
  .brand-name { font-size: 15px; font-weight: 600; color: #2d3748; }
  .brand-sub { font-size: 12px; color: #a0aec0; }
  .body { padding: 0 40px 16px; }
  .intro { font-size: 16px; color: #2d3748; line-height: 1.7; margin-bottom: 28px; }
  .entry { margin-bottom: 24px; page-break-inside: avoid; }
  .vraag { font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; color: #6d84a8; margin-bottom: 8px; }
  .antwoord { font-size: 16px; color: #2d3748; line-height: 1.75; }
  .divider { border: none; border-top: 1px solid #e8e1d9; margin: 24px 0; }
  .footer { padding: 0 40px 36px; font-size: 15px; color: #4a5568; line-height: 1.7; }
  .datum { font-size: 12px; color: #a0aec0; margin-top: 20px; }
  @media print { body { padding: 0; background: #faf7f4; } .card { border-radius: 0; } }
</style>
</head>
<body>
<div class="card">
  <div class="header">
    <div class="brand">
      <div class="avatar">TB</div>
      <div>
        <div class="brand-name">Talk To Benji</div>
        <div class="brand-sub">Jouw reflectie van ${datum}</div>
      </div>
    </div>
  </div>
  <div class="body">
    <p class="intro">Je hebt even de tijd genomen voor jezelf. Dat verdient erkenning.<br/>Hieronder staan jouw gedachten, precies zoals jij ze hebt opgeschreven.</p>
    <hr class="divider"/>
    ${VRAGEN.map(({ vraag }, i) => antwoorden[i].trim() ? `<div class="entry">
      <div class="vraag">${vraag}</div>
      <div class="antwoord">${esc(antwoorden[i].trim())}</div>
    </div>` : "").join("")}
  </div>
  <div class="footer">
    Met zorg bewaard voor jou.<br/><strong>Benji</strong>
    <div class="datum">${datum} · talktobenji.com</div>
  </div>
</div>
</body>
</html>`;
  };

  const triggerDownload = () => {
    const blob = new Blob([buildHtml()], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "mijn-reflectie.html";
    a.click();
    URL.revokeObjectURL(url);
    setAntwoorden(["", "", ""]);
  };

  const handleDownloadEnBenji = () => {
    triggerDownload();
    setTimeout(() => router.push("/"), 400);
  };

  const handleAlleenDownload = () => {
    triggerDownload();
  };

  return (
    <div className="my-10 rounded-2xl bg-primary-50 border border-primary-200 overflow-hidden">
      <div className="px-6 pt-6 pb-4">
        <p className="text-xs uppercase tracking-widest text-primary-500 mb-1">Korte reflectie</p>
        <p className="text-base text-stone-500 mb-5">Neem even de tijd voor jezelf. Je hoeft niets te delen.</p>

        <div className="space-y-5">
          {VRAGEN.map(({ vraag, placeholder }, i) => (
            <div key={i}>
              <p className="text-sm font-semibold text-stone-700 mb-2">{vraag}</p>
              <div className="relative">
                <textarea
                  value={antwoorden[i]}
                  onChange={(e) => setAntwoord(i, e.target.value)}
                  placeholder={placeholder}
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
          <div className="flex flex-col items-start gap-2">
            <button
              type="button"
              onClick={handleDownloadEnBenji}
              className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
            >
              Bewaar mijn gedachten en praat verder met Benji →
            </button>
            <button
              type="button"
              onClick={handleAlleenDownload}
              className="inline-flex items-center gap-2 text-sm text-stone-400 hover:text-stone-600 transition-colors"
            >
              <Download size={14} />
              Alleen downloaden
            </button>
          </div>
        ) : (
          <Link
            href="/"
            className="inline-block bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
          >
            Praat verder met Benji →
          </Link>
        )}
      </div>

      {/* Uitklapbare feature preview */}
      <div className="border-t border-primary-200">
        <button
          type="button"
          onClick={() => setToonFeatures((v) => !v)}
          className="w-full flex items-center justify-between px-6 py-3 text-xs text-primary-500 hover:text-primary-700 hover:bg-primary-100/50 transition-colors"
        >
          <span>Wat kun je nog meer met Benji?</span>
          {toonFeatures ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
        {toonFeatures && (
          <div className="px-6 pb-5 grid grid-cols-2 gap-3">
            {FEATURES.map((f) => (
              <div key={f.naam} className="flex items-start gap-2.5 bg-white rounded-xl px-3 py-3 border border-primary-100">
                <div className={`p-1.5 rounded-lg ${f.kleur} shrink-0`}>
                  <f.icon size={14} />
                </div>
                <div>
                  <p className="text-xs font-semibold text-stone-700">{f.naam}</p>
                  <p className="text-xs text-stone-400 leading-snug mt-0.5">{f.omschrijving}</p>
                </div>
              </div>
            ))}
            <div className="col-span-2 pt-1">
              <Link href="/" className="text-xs text-primary-600 hover:text-primary-800 font-medium transition-colors">
                Ontdek alles wat Benji biedt →
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function BenjiTeaserLanding() {
  return (
    <div className="my-8 rounded-2xl bg-stone-50 border border-stone-200 px-7 py-6 flex flex-col sm:flex-row items-start sm:items-center gap-5">
      <div className="flex-1">
        <p className="text-[15px] text-stone-600 leading-relaxed">
          Soms zijn woorden op een scherm te veel voor een hoofd dat vol zit met verdriet. Als lezen nu niet lukt, kun je direct je hart luchten bij Benji. Hij luistert terwijl jij je weg zoekt.
        </p>
      </div>
      <Link
        href="/"
        className="shrink-0 inline-block bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors whitespace-nowrap"
      >
        Praat direct met Benji
      </Link>
    </div>
  );
}

export function BenjiTeaserHerinnering() {
  const [tekst, setTekst] = useState("");

  return (
    <div className="my-10 rounded-2xl bg-primary-50 border border-primary-200 overflow-hidden">
      <div className="px-6 pt-6 pb-4">
        <p className="text-xs uppercase tracking-widest text-primary-500 mb-3">Een herinnering bewaren</p>
        <p className="text-[15px] text-stone-600 leading-relaxed mb-5">
          Rouw voelt vaak als een onmogelijke berg. Laten we beginnen met één klein detail. Welk ding van degene die je mist wil je vandaag absoluut niet vergeten? Schrijf het hieronder op om het een plekje te geven.
        </p>
        <textarea
          value={tekst}
          onChange={(e) => setTekst(e.target.value)}
          placeholder="Typ hier je herinnering…"
          rows={4}
          className="w-full px-4 py-3 rounded-xl border border-primary-200 bg-white text-sm text-stone-700 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-primary-300 resize-none leading-relaxed"
        />
      </div>
      <div className="px-6 pb-6 pt-2">
        <Link
          href="/"
          className="inline-block bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
        >
          {tekst.trim() ? "Deel dit met Benji →" : "Praat met Benji →"}
        </Link>
      </div>
    </div>
  );
}

export function BenjiTeaserNacht() {
  return (
    <div className="my-10 rounded-2xl overflow-hidden relative" style={{ background: "linear-gradient(135deg, #1a1f2e 0%, #2d3561 60%, #1e2a4a 100%)" }}>
      {/* Sterren decoratie */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none select-none" aria-hidden>
        {["top-4 left-8", "top-6 right-12", "top-12 left-1/3", "top-3 right-1/3", "top-8 left-2/3"].map((pos, i) => (
          <span key={i} className={`absolute ${pos} text-white/20 text-xs`}>✦</span>
        ))}
      </div>

      <div className="relative px-7 pt-8 pb-3">
        <div className="flex items-center gap-2 mb-5">
          <Moon size={14} className="text-indigo-300" />
          <p className="text-xs uppercase tracking-widest text-indigo-300">Midden in de nacht</p>
        </div>
        <p className="text-[17px] leading-relaxed text-white/90 mb-2">
          Het is 03:00 uur en de wereld slaapt, maar jouw gedachten staan aan.
        </p>
        <p className="text-[17px] leading-relaxed text-white/70 mb-6">
          Je wilt niemand wakker maken, maar je hart is vol. Benji is de luisteraar die nooit slaapt. Deel je gedachten nu, ongefilterd en in alle rust.
        </p>
        <Link
          href="/"
          className="inline-block text-sm font-semibold px-6 py-3 rounded-xl transition-opacity hover:opacity-90"
          style={{ background: "#4f5fa8", color: "white" }}
        >
          Lucht nu je hart bij Benji
        </Link>
      </div>

      <div className="relative px-7 pb-6 pt-4 border-t border-white/10 mt-4">
        <p className="text-xs text-white/30">Benji luistert — zonder oordeel, zonder haast. Altijd.</p>
      </div>
    </div>
  );
}
