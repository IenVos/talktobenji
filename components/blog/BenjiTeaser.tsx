"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mic, Square, Download, ChevronDown, ChevronUp, PenLine, Smile, CalendarCheck, Gem, Moon } from "lucide-react";

// ─── Shared feature preview ──────────────────────────────────────────────────

const FEATURES = [
  { icon: PenLine, kleur: "text-teal-600 bg-teal-50",       naam: "Reflecties",         omschrijving: "Schrijven of inspreken, wanneer je wil" },
  { icon: Smile,    kleur: "text-amber-500 bg-amber-50",     naam: "Emotie-tracker",     omschrijving: "Bijhouden hoe je stemming beweegt" },
  { icon: CalendarCheck, kleur: "text-primary-600 bg-primary-50", naam: "Dagelijkse check-in", omschrijving: "Korte vragen om de mist te klaren" },
  { icon: Gem,      kleur: "text-violet-500 bg-violet-50",   naam: "Memories",           omschrijving: "Herinneringen bewaren zodat je ze niet vergeet" },
];

function FeaturePreview({ borderColor }: { borderColor: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ borderTopColor: borderColor }} className="border-t">
      <button type="button" onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-6 py-3 text-xs text-stone-400 hover:text-stone-600 hover:bg-black/5 transition-colors">
        <span>Wat kun je nog meer met Benji?</span>
        {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>
      {open && (
        <div className="px-6 pb-5 grid grid-cols-2 gap-3">
          {FEATURES.map((f) => (
            <div key={f.naam} className="flex items-start gap-2.5 bg-white rounded-xl px-3 py-3 border border-stone-100">
              <div className={`p-1.5 rounded-lg ${f.kleur} shrink-0`}><f.icon size={14} /></div>
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
  );
}

// ─── Shared download HTML builder ────────────────────────────────────────────

function buildDownloadHtml(titel: string, vragen: { vraag: string }[], antwoorden: string[]) {
  const esc = (t: string) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, "<br/>");
  const datum = new Date().toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric" });
  return `<!DOCTYPE html>
<html lang="nl"><head><meta charset="utf-8"><title>${titel} — ${datum}</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{background:#f5f0eb;font-family:system-ui,-apple-system,sans-serif;padding:48px 16px}
  .card{background:#faf7f4;max-width:580px;margin:0 auto;border-radius:12px;overflow:hidden}
  .header{padding:32px 40px 0}.brand{display:flex;align-items:center;gap:10px;margin-bottom:28px}
  .avatar{width:40px;height:40px;border-radius:50%;background:#6d84a8;color:white;font-size:14px;font-weight:700;display:flex;align-items:center;justify-content:center}
  .brand-name{font-size:15px;font-weight:600;color:#2d3748}.brand-sub{font-size:12px;color:#a0aec0}
  .body{padding:0 40px 16px}.intro{font-size:16px;color:#2d3748;line-height:1.7;margin-bottom:28px}
  .entry{margin-bottom:24px;page-break-inside:avoid}
  .vraag{font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:.08em;color:#6d84a8;margin-bottom:8px}
  .antwoord{font-size:16px;color:#2d3748;line-height:1.75}
  .divider{border:none;border-top:1px solid #e8e1d9;margin:24px 0}
  .footer{padding:0 40px 36px;font-size:15px;color:#4a5568;line-height:1.7}
  .datum{font-size:12px;color:#a0aec0;margin-top:20px}
  @media print{body{padding:0;background:#faf7f4}.card{border-radius:0}}
</style></head><body>
<div class="card">
  <div class="header"><div class="brand"><div class="avatar">TB</div>
    <div><div class="brand-name">Talk To Benji</div><div class="brand-sub">${titel} van ${datum}</div></div>
  </div></div>
  <div class="body">
    <p class="intro">Je hebt even de tijd genomen voor jezelf. Dat verdient erkenning.<br/>Hieronder staan jouw gedachten, precies zoals jij ze hebt opgeschreven.</p>
    <hr class="divider"/>
    ${vragen.map(({ vraag }, i) => antwoorden[i]?.trim() ? `<div class="entry"><div class="vraag">${vraag}</div><div class="antwoord">${esc(antwoorden[i].trim())}</div></div>` : "").join("")}
  </div>
  <div class="footer">Met zorg bewaard voor jou.<br/><strong>Benji</strong><div class="datum">${datum} · talktobenji.com</div></div>
</div></body></html>`;
}

// ─── Shared form teaser base ──────────────────────────────────────────────────

type Vraag = { vraag: string; placeholder: string };
type Theme = { bg: string; border: string; accent: string; ring: string; micBg: string };

function BenjiTeaserForm({ label, intro, vragen, theme, downloadTitel, bestandsnaam }: {
  label: string; intro: string; vragen: Vraag[];
  theme: Theme; downloadTitel: string; bestandsnaam: string;
}) {
  const router = useRouter();
  const [antwoorden, setAntwoorden] = useState(vragen.map(() => ""));
  const [speechSupported, setSpeechSupported] = useState(false);
  const [opnameIndex, setOpnameIndex] = useState<number | null>(null);
  const [uitgebreid, setUitgebreid] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    setSpeechSupported(!!SR);
  }, []);

  const setAntwoord = (i: number, v: string) =>
    setAntwoorden(prev => prev.map((a, j) => j === i ? v : a));

  const toggleMic = (i: number) => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;
    if (opnameIndex === i) { recognitionRef.current?.stop(); setOpnameIndex(null); return; }
    recognitionRef.current?.stop();
    const rec = new SR();
    rec.lang = "nl-NL"; rec.interimResults = false;
    rec.onresult = (e: any) => {
      const t = e.results[0][0].transcript;
      setAntwoord(i, antwoorden[i] ? antwoorden[i] + " " + t : t);
    };
    rec.onend = () => setOpnameIndex(null);
    rec.start(); recognitionRef.current = rec; setOpnameIndex(i);
  };

  const ingevuld = antwoorden.some(a => a.trim());

  const triggerDownload = () => {
    const html = buildDownloadHtml(downloadTitel, vragen, antwoorden);
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = bestandsnaam; a.click();
    URL.revokeObjectURL(url);
    setAntwoorden(vragen.map(() => ""));
  };

  return (
    <div className={`my-10 rounded-2xl overflow-hidden border ${theme.bg} ${theme.border}`}>
      <div className="px-6 pt-6 pb-4">
        <p className={`text-xs uppercase tracking-widest mb-1 ${theme.accent}`}>{label}</p>
        <p className="text-base text-stone-500 mb-5">{intro}</p>
        <div className="space-y-5">
          {vragen.map(({ vraag, placeholder }, i) => {
            if (i > 0 && !uitgebreid) return null;
            return (
              <div key={i}>
                <p className="text-sm font-semibold text-stone-700 mb-2">{vraag}</p>
                <div className="relative">
                  <textarea value={antwoorden[i]} onChange={e => setAntwoord(i, e.target.value)}
                    placeholder={placeholder} rows={3}
                    className={`w-full px-4 py-3 pr-10 rounded-xl border bg-white text-sm text-stone-700 placeholder-stone-400 focus:outline-none resize-none leading-relaxed ${theme.border} ${theme.ring}`} />
                  {speechSupported && (
                    <button type="button" onClick={() => toggleMic(i)}
                      title={opnameIndex === i ? "Stop opname" : "Inspreken"}
                      className={`absolute right-2 bottom-2 p-1.5 rounded-lg transition-colors ${opnameIndex === i ? "bg-red-100 text-red-600 hover:bg-red-200" : `${theme.micBg} ${theme.accent} hover:opacity-80`}`}>
                      {opnameIndex === i ? <Square size={13} /> : <Mic size={13} />}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
          {!uitgebreid && vragen.length > 1 && (
            <button type="button" onClick={() => setUitgebreid(true)}
              className="text-xs text-stone-400 hover:text-stone-600 transition-colors flex items-center gap-1">
              <ChevronDown size={13} /> Er is nog meer ruimte, als je wilt
            </button>
          )}
        </div>
      </div>

      <div className="px-6 pb-6 pt-2">
        {ingevuld ? (
          <div className="flex flex-col items-start gap-2">
            <button type="button" onClick={() => { triggerDownload(); setTimeout(() => router.push("/"), 400); }}
              className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors">
              Bewaar mijn gedachten en praat verder met Benji →
            </button>
            <button type="button" onClick={triggerDownload}
              className="inline-flex items-center gap-2 text-sm text-stone-400 hover:text-stone-600 transition-colors">
              <Download size={14} /> Alleen downloaden
            </button>
          </div>
        ) : (
          <Link href="/" className="inline-block bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors">
            Praat verder met Benji →
          </Link>
        )}
      </div>

      <FeaturePreview borderColor="rgb(226 232 240 / 0.6)" />
    </div>
  );
}

// ─── Kleurthema's ─────────────────────────────────────────────────────────────

const THEME_PRIMARY: Theme = {
  bg: "bg-primary-50", border: "border-primary-200",
  accent: "text-primary-500", ring: "focus:ring-2 focus:ring-primary-300",
  micBg: "bg-primary-100",
};
const THEME_AMBER: Theme = {
  bg: "bg-amber-50", border: "border-amber-200",
  accent: "text-amber-600", ring: "focus:ring-2 focus:ring-amber-300",
  micBg: "bg-amber-100",
};
const THEME_TEAL: Theme = {
  bg: "bg-teal-50", border: "border-teal-200",
  accent: "text-teal-600", ring: "focus:ring-2 focus:ring-teal-300",
  micBg: "bg-teal-100",
};
const THEME_VIOLET: Theme = {
  bg: "bg-violet-50", border: "border-violet-200",
  accent: "text-violet-600", ring: "focus:ring-2 focus:ring-violet-300",
  micBg: "bg-violet-100",
};

// ─── Exports ──────────────────────────────────────────────────────────────────

export function BenjiTeaserReflectie() {
  return (
    <BenjiTeaserForm
      label="Korte reflectie"
      intro="Neem even de tijd voor jezelf. Je hoeft niets te delen."
      theme={THEME_PRIMARY}
      downloadTitel="Mijn reflectie"
      bestandsnaam="mijn-reflectie.html"
      vragen={[
        { vraag: "Wat draag je vandaag met je mee dat je nog niet hardop hebt gezegd?", placeholder: "Misschien iets wat je al een tijdje met je meedraagt…" },
        { vraag: "Wat heeft je de laatste tijd het meeste energie gekost?",             placeholder: "Een situatie, een gevoel, of iemand in je omgeving…" },
        { vraag: "Wat heb je nodig — van jezelf of van anderen?",                       placeholder: "Rust, ruimte, begrip, of gewoon gehoord worden…" },
      ]}
    />
  );
}

export function BenjiTeaserHerinnering() {
  return (
    <BenjiTeaserForm
      label="Een herinnering bewaren"
      intro="Rouw voelt vaak als een onmogelijke berg. Laten we beginnen met één klein detail."
      theme={THEME_VIOLET}
      downloadTitel="Mijn herinnering"
      bestandsnaam="mijn-herinnering.html"
      vragen={[
        { vraag: "Welk ding van degene die je mist wil je vandaag absoluut niet vergeten?", placeholder: "Een gebaar, een geur, een stem, een blik…" },
        { vraag: "Wat deed die persoon dat jou altijd aan hem of haar herinnert?",           placeholder: "Een gewoontefje, een uitdrukking, iets wat hij of zij altijd zei…" },
        { vraag: "Is er een moment dat je koestert en nooit wil loslaten?",                  placeholder: "Een dag, een uur, een blik die alles zei…" },
      ]}
    />
  );
}

export function BenjiTeaserEmotie() {
  return (
    <BenjiTeaserForm
      label="Emotie-tracker"
      intro="Hoe voel je je vandaag — echt? Je hoeft het niet te verklaren, alleen te benoemen."
      theme={THEME_AMBER}
      downloadTitel="Mijn emoties vandaag"
      bestandsnaam="mijn-emoties.html"
      vragen={[
        { vraag: "Hoe voel je je vandaag — echt?",                     placeholder: "Zwaar, leeg, verdrietig, oké, of iets anders…" },
        { vraag: "Wat triggerde vandaag een gevoel bij je?",            placeholder: "Een herinnering, een situatie, een geur, een lied…" },
        { vraag: "Wat hielp je vandaag, al was het maar even?",         placeholder: "Een kopje thee, een wandeling, een gesprek, een moment…" },
      ]}
    />
  );
}

export function BenjiTeaserCheckin() {
  return (
    <BenjiTeaserForm
      label="Dagelijkse check-in"
      intro="Korte vragen om je gedachten te ordenen. Je kunt dit zo vaak doen als je wil."
      theme={THEME_TEAL}
      downloadTitel="Mijn check-in"
      bestandsnaam="mijn-checkin.html"
      vragen={[
        { vraag: "Hoe voel ik me vandaag?",       placeholder: "Beschrijf je stemming in je eigen woorden…" },
        { vraag: "Wat hielp me vandaag?",          placeholder: "Groot of klein, het mag allemaal…" },
        { vraag: "Waar ben ik dankbaar voor?",     placeholder: "Een persoon, een moment, iets simpels…" },
      ]}
    />
  );
}

export function BenjiTeaserMemories() {
  return (
    <BenjiTeaserForm
      label="Memories"
      intro="Bewaar wat je niet wil vergeten. Het verdient een plekje."
      theme={THEME_VIOLET}
      downloadTitel="Mijn memories"
      bestandsnaam="mijn-memories.html"
      vragen={[
        { vraag: "Welke herinnering wil je vandaag bewaren?",                        placeholder: "Een moment, een dag, een detail dat je bijblijft…" },
        { vraag: "Hoe voelde die herinnering toen je eraan dacht?",                   placeholder: "Warm, pijnlijk, lief, gemengd…" },
        { vraag: "Wat zou je tegen die persoon zeggen als je dat zou kunnen?",        placeholder: "Zeg het hier, voor jezelf…" },
      ]}
    />
  );
}

export function BenjiTeaserLanding() {
  return (
    <div className="my-8 rounded-2xl bg-primary-50 border border-primary-200 px-7 py-6 flex flex-col sm:flex-row items-start sm:items-center gap-5">
      <div className="flex-1">
        <p className="text-[15px] text-stone-600 leading-relaxed">
          Soms zijn woorden op een scherm te veel voor een hoofd dat vol zit met verdriet. Als lezen nu niet lukt, kun je direct je hart luchten bij Benji. Hij luistert terwijl jij je weg zoekt.
        </p>
      </div>
      <Link href="/"
        className="shrink-0 inline-block bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors whitespace-nowrap">
        Praat direct met Benji
      </Link>
    </div>
  );
}

export function BenjiTeaserNacht() {
  return (
    <div className="my-10 rounded-2xl overflow-hidden relative" style={{ background: "linear-gradient(135deg, #1a1f2e 0%, #2d3561 60%, #1e2a4a 100%)" }}>
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
        <Link href="/"
          className="inline-block text-sm font-semibold px-6 py-3 rounded-xl transition-opacity hover:opacity-90"
          style={{ background: "#4f5fa8", color: "white" }}>
          Lucht nu je hart bij Benji
        </Link>
      </div>
      <div className="relative px-7 pb-6 pt-4 border-t border-white/10 mt-4">
        <p className="text-xs text-white/30">Benji luistert — zonder oordeel, zonder haast. Altijd.</p>
      </div>
    </div>
  );
}
