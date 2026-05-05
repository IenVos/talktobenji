"use client";

import { useState, useEffect } from "react";
import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAdminQuery, useAdminMutation } from "../AdminAuthContext";
import { Mail, Save, CheckCircle, RotateCcw, Send, FlaskConical, UserPlus, ChevronDown, ChevronRight, Pencil, Plus, Trash2, Copy, Eye } from "lucide-react";
import { useMutation } from "convex/react";
import { DEFAULT_TEMPLATES } from "@/convex/emailTemplatesDefaults";
import { NIET_ALLEEN_CONTENT, type NietAlleenVerliesType, getMailTekst, getDagInhoud } from "@/convex/nietAlleenContent";
import { ANKER_DAGEN } from "@/convex/nietAlleenAnkerContent";

const OEFENING_DAGEN = [2, 12, 18] as const;
const OEFENING_TEKSTEN: Record<number, string> = {
  2: "Ga zitten zoals je zit. Je hoeft niets te veranderen.\n\nLeg een hand op je borst als dat goed voelt. Voel hoe je ademhaalt, niet om het te veranderen, alleen om het te merken.\n\nEr is een moment dat je vandaag gaat aanraken. Dat vraagt iets van je. Je lichaam weet dat al, ook voor je begint.\n\nAdem één keer langzaam in. Gewoon een ademhaling die iets ruimer is dan de vorige.\n\nEn terwijl je uitademt: je hoeft dit moment niet te dragen alsof het te zwaar is om aan te raken. Je mag er gewoon naar kijken. Van een kleine afstand. Het is van jou, het gaat nergens heen.\n\nNog één ademhaling. En dan begin je, als je er klaar voor bent.",
  12: "Er zijn dingen die we met ons meedragen zonder dat we ze een naam geven. Onuitgesproken woorden. Gemiste momenten. Dingen die er niet van zijn gekomen.\n\nDat gewicht zit ergens in je lichaam. Misschien in je keel. Misschien in je schouders. Misschien dieper.\n\nLeg je handen in je schoot. Voel het gewicht van je eigen handen.\n\nAdem in, en stel je voor dat je even ruimte maakt voor wat er is. Niet om het op te lossen. Alleen om het een plek te geven naast je, in plaats van in je.\n\nAdem uit, en laat je schouders zakken, ook als ze maar een millimeter zakken.\n\nWat onafgemaakt is gebleven hoeft vandaag niet af te worden. Je schrijft het alleen op. Dat is genoeg.",
  18: "Boosheid heeft een slechte reputatie. We leren vroeg dat we hem moeten inslikken, ombuigen, verklaren. Maar boosheid is informatie. Het vertelt je wat je belangrijk vond. Wat je pijn heeft gedaan. Wat er niet klopte.\n\nVoordat je schrijft: laat de boosheid er even gewoon zijn, zonder er iets mee te doen.\n\nAdem in door je neus. Voel of er spanning zit in je kaak, je handen, je buik. Je hoeft het niet weg te ademen.\n\nAdem uit door je mond, iets langzamer dan normaal.\n\nZeg in jezelf, of hardop als je dat wilt: het is logisch dat ik boos ben.\n\nNiet als oordeel. Niet als excuus. Gewoon als erkenning.\n\nNog één keer. En dan schrijf je.",
};

type TemplateKey = "niet_alleen_welkom" | "niet_alleen_dag" | "niet_alleen_dag28" | "niet_alleen_dag30";

const TEMPLATE_META: Record<TemplateKey, { title: string; subtitle: string; knopUrl: string }> = {
  niet_alleen_welkom: {
    title: "Welkomstmail",
    subtitle: "Verstuurd direct na aankoop van Niet Alleen",
    knopUrl: "https://talktobenji.com/niet-alleen",
  },
  niet_alleen_dag: {
    title: "Dagelijkse herinneringsmail",
    subtitle: "Verstuurd elke ochtend op dag 1 t/m 30 — {dag} wordt vervangen door het dagnummer",
    knopUrl: "https://talktobenji.com/niet-alleen",
  },
  niet_alleen_dag28: {
    title: "Dag 28 — voorbereidingsmail",
    subtitle: "Verstuurd op dag 28 (2 dagen voor het einde)",
    knopUrl: "https://talktobenji.com/niet-alleen/ontdek",
  },
  niet_alleen_dag30: {
    title: "Dag 30 — afsluitmail",
    subtitle: "Verstuurd op dag 30 — {dagen} wordt vervangen door het aantal ingevulde dagen",
    knopUrl: "https://talktobenji.com/niet-alleen/ontdek",
  },
};

function TemplateEditor({
  templateKey,
  savedSubject,
  savedBodyText,
  onSave,
}: {
  templateKey: TemplateKey;
  savedSubject: string | undefined;
  savedBodyText: string | undefined;
  onSave: (key: TemplateKey, subject: string, bodyText: string) => Promise<void>;
}) {
  const meta = TEMPLATE_META[templateKey];
  const defaults = DEFAULT_TEMPLATES[templateKey];

  const [subject, setSubject] = useState(savedSubject ?? defaults.subject);
  const [bodyText, setBodyText] = useState(savedBodyText ?? defaults.bodyText);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (savedSubject !== undefined) setSubject(savedSubject);
    if (savedBodyText !== undefined) setBodyText(savedBodyText);
  }, [savedSubject, savedBodyText]);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      await onSave(templateKey, subject, bodyText);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setSubject(defaults.subject);
    setBodyText(defaults.bodyText);
  };

  const isDirty =
    subject !== (savedSubject ?? defaults.subject) ||
    bodyText !== (savedBodyText ?? defaults.bodyText);

  const [open, setOpen] = useState(false);

  return (
    <div className="bg-white rounded-xl border border-primary-200 shadow-sm overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-primary-50 transition-colors"
      >
        <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0 border border-primary-200">
          <Mail className="w-4 h-4 text-primary-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-primary-900">{meta.title}</p>
          <p className="text-xs text-primary-500">{meta.subtitle}</p>
        </div>
        {isDirty && <span className="text-xs text-amber-600 font-medium flex-shrink-0">Gewijzigd</span>}
        {open ? <ChevronDown size={16} className="text-gray-400 flex-shrink-0" /> : <ChevronRight size={16} className="text-gray-400 flex-shrink-0" />}
      </button>

      {open && <div className="px-5 pb-5 space-y-4 border-t border-primary-100">

      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1">Onderwerp</label>
        <input
          type="text"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1">
          Inhoud{" "}
          <span className="font-normal text-gray-400">
            (lege regel = nieuwe alinea — de aanhef &quot;Hi [naam],&quot; en de handtekening worden automatisch toegevoegd)
          </span>
        </label>
        <textarea
          value={bodyText}
          onChange={(e) => setBodyText(e.target.value)}
          rows={8}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-y font-mono"
        />
      </div>

      {/* Voorbeeld */}
      <details className="group">
        <summary className="text-xs font-semibold text-primary-600 cursor-pointer hover:text-primary-800 select-none">
          Voorbeeld e-mail
        </summary>
        <div className="mt-3 border border-gray-200 rounded-lg p-4 bg-gray-50 text-sm text-gray-800 space-y-3">
          <p className="text-base">Hi [naam],</p>
          {bodyText.split(/\n\n+/).map((para, i) => (
            <p key={i} className="leading-relaxed text-gray-600">{para}</p>
          ))}
          <div className="my-4">
            <span className="inline-block bg-[#6d84a8] text-white px-6 py-2 rounded-lg text-sm font-semibold">
              {templateKey === "niet_alleen_welkom" ? "Begin dag 1" :
               templateKey === "niet_alleen_dag" ? "Schrijf vandaag" : "Bekijk wat er meer is"}
            </span>
          </div>
          {templateKey === "niet_alleen_dag" ? (
            <p className="font-medium text-gray-500">Benji</p>
          ) : (
            <>
              <p className="text-gray-600">Met warme groet,</p>
              <p className="font-semibold">Ien</p>
              <p className="text-xs text-gray-400">Founder van TalkToBenji</p>
            </>
          )}
        </div>
      </details>

      <div className="flex items-center gap-3 pt-1">
        <button
          onClick={handleSave}
          disabled={saving || !isDirty}
          className="flex items-center gap-2 px-5 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
        >
          <Save size={15} />
          {saving ? "Opslaan..." : "Opslaan"}
        </button>
        <button
          onClick={handleReset}
          className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <RotateCcw size={14} />
          Standaard
        </button>
        {saved && (
          <span className="flex items-center gap-1 text-sm text-green-600 font-medium">
            <CheckCircle size={15} />
            Opgeslagen
          </span>
        )}
      </div>
    </div>}
    </div>
  );
}

const VERLIES_TYPES_TEST = [
  { key: "persoon", label: "Persoon" },
  { key: "huisdier", label: "Huisdier" },
  { key: "relatie", label: "Scheiding / relatie" },
  { key: "kinderloos", label: "Kinderloos" },
];

function ProgrammaPreviewBlok({ verliesTypen }: { verliesTypen: { code: string; naam: string }[] | undefined }) {
  const [open, setOpen] = useState(false);
  const [niche, setNiche] = useState("persoon");
  const [gekozenDag, setGekozenDag] = useState<number>(1);

  const types = verliesTypen ?? VERLIES_TYPES_TEST.map(t => ({ code: t.key, naam: t.label }));

  const gekozenInhoud = getDagInhoud(gekozenDag, niche);
  const heeftOefening = (OEFENING_DAGEN as readonly number[]).includes(gekozenDag);
  const isAnkerDag = (ANKER_DAGEN as readonly number[]).includes(gekozenDag);

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-gray-50 transition-colors"
      >
        <Eye className="w-4 h-4 text-gray-500 flex-shrink-0" />
        <span className="text-sm font-semibold text-gray-700 flex-1">Dagprogramma bekijken</span>
        <span className="text-xs text-gray-400 mr-1">wat de gebruiker ziet per dag</span>
        {open ? <ChevronDown size={16} className="text-gray-400 flex-shrink-0" /> : <ChevronRight size={16} className="text-gray-400 flex-shrink-0" />}
      </button>

      {open && (
        <div className="px-5 pb-5 border-t border-gray-100 space-y-4 pt-4">
          {/* Verliestype tabs */}
          <div className="flex gap-2 flex-wrap">
            {types.map(n => (
              <button
                key={n.code}
                onClick={() => { setNiche(n.code); setGekozenDag(1); }}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors"
                style={{
                  background: niche === n.code ? "#6d84a8" : "white",
                  color: niche === n.code ? "white" : "#6b7280",
                  borderColor: niche === n.code ? "#6d84a8" : "#d1d5db",
                }}
              >
                {NICHE_LABELS[n.code] ?? n.naam.split(" — ")[0]}
              </button>
            ))}
          </div>

          {/* Legenda */}
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-blue-400 inline-block" /> luisteroefening</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-green-400 inline-block" /> ankerzin-dag</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-purple-400 inline-block" /> als je wilt</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-yellow-400 inline-block" /> doedingetje</span>
          </div>

          {/* Grid 10 × 3 */}
          <div className="grid grid-cols-10 gap-1.5">
            {Array.from({ length: 30 }, (_, i) => {
              const d = i + 1;
              const inhoud = getDagInhoud(d, niche);
              const isGekomen = gekozenDag === d;
              return (
                <button
                  key={d}
                  onClick={() => setGekozenDag(d)}
                  className="rounded-lg border py-1.5 flex flex-col items-center transition-colors"
                  style={{
                    background: isGekomen ? "#eef1f6" : "#f9f9f9",
                    borderColor: isGekomen ? "#6d84a8" : "#e5e7eb",
                  }}
                >
                  <span className="text-xs font-semibold" style={{ color: isGekomen ? "#6d84a8" : "#6b7280" }}>{d}</span>
                  <div className="flex gap-0.5 mt-0.5">
                    {(OEFENING_DAGEN as readonly number[]).includes(d) && <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />}
                    {(ANKER_DAGEN as readonly number[]).includes(d) && <span className="w-1.5 h-1.5 rounded-full bg-green-400" />}
                    {inhoud?.alsjewilt && <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />}
                    {inhoud?.doedingetje && <span className="w-1.5 h-1.5 rounded-full bg-yellow-400" />}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Detail panel */}
          {gekozenInhoud && (
            <div className="bg-[#fdf9f4] border border-[#e8e0d8] rounded-xl p-5 space-y-4">
              <p className="text-xs uppercase tracking-widest font-medium" style={{ color: "#b0a8a0" }}>
                Dag {gekozenDag} · {gekozenInhoud.thema}
              </p>

              {heeftOefening && (
                <details className="group">
                  <summary className="cursor-pointer text-xs font-semibold text-blue-700 flex items-center gap-1.5 list-none">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-400 inline-block flex-shrink-0" />
                    Luisteroefening (wordt getoond vóór het schrijven)
                    <ChevronRight size={13} className="text-blue-400 group-open:hidden" />
                    <ChevronDown size={13} className="text-blue-400 hidden group-open:block" />
                  </summary>
                  <p className="mt-2 text-xs leading-relaxed whitespace-pre-wrap text-blue-600 pl-4 border-l-2 border-blue-200">
                    {OEFENING_TEKSTEN[gekozenDag]}
                  </p>
                </details>
              )}

              {isAnkerDag && (
                <div className="flex items-center gap-2 text-xs font-medium text-green-700">
                  <span className="w-2.5 h-2.5 rounded-full bg-green-400 flex-shrink-0" />
                  Ankerzin-dag — gebruiker kiest een persoonlijke zin als anker voor de komende dagen
                </div>
              )}

              <div>
                <p className="text-xs font-semibold text-gray-500 mb-1.5">Schrijfprompt (in het account)</p>
                <p className="text-sm leading-relaxed" style={{ color: "#3d3530" }}>{gekozenInhoud.inHetAccount}</p>
              </div>

              {gekozenInhoud.alsjewilt && (
                <div className="border-l-2 border-purple-200 pl-3 space-y-0.5">
                  <p className="text-xs font-semibold text-purple-600">Als je wilt</p>
                  <p className="text-sm leading-relaxed text-gray-600">{gekozenInhoud.alsjewilt}</p>
                </div>
              )}

              {gekozenInhoud.doedingetje && (
                <div className="border-l-2 border-yellow-300 pl-3 space-y-0.5">
                  <p className="text-xs font-semibold text-yellow-700">Klein doedingetje</p>
                  <p className="text-sm leading-relaxed text-gray-600">{gekozenInhoud.doedingetje}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function TestProfielBlok() {
  const maakTestProfiel = useMutation(api.nietAlleen.maakTestProfiel);
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [naam, setNaam] = useState("");
  const [verliesType, setVerliesType] = useState("persoon");
  const [dagOffset, setDagOffset] = useState(9);
  const [bezig, setBezig] = useState(false);
  const [resultaat, setResultaat] = useState("");
  const [fout, setFout] = useState("");

  const handleMaak = async () => {
    if (!email || !naam || bezig) return;
    const userId = email; // userId = email zodat getProfile het vindt via email fallback
    setBezig(true);
    setResultaat("");
    setFout("");
    try {
      const res = await maakTestProfiel({ userId, email, naam, verliesType, dagOffset });
      setResultaat(`Profiel ${res}! Ga naar talktobenji.com/niet-alleen om te testen.`);
    } catch (e: any) {
      setFout(e?.message ?? "Onbekende fout");
    } finally {
      setBezig(false);
    }
  };

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-blue-100 transition-colors"
      >
        <UserPlus className="w-4 h-4 text-blue-600 flex-shrink-0" />
        <span className="text-sm font-semibold text-blue-800 flex-1">Testprofiel aanmaken</span>
        {open ? <ChevronDown size={16} className="text-blue-400 flex-shrink-0" /> : <ChevronRight size={16} className="text-blue-400 flex-shrink-0" />}
      </button>
      {open && (
        <div className="px-5 pb-5 space-y-4 border-t border-blue-200">
          <p className="text-xs text-blue-700 pt-3">
            Vul je e-mailadres in. Als er al een profiel bestaat wordt het volledig gereset — dagboek, anker, alles begint opnieuw.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">E-mailadres</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="jouw@email.nl" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Naam</label>
              <input type="text" value={naam} onChange={(e) => setNaam(e.target.value)}
                placeholder="Voornaam" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Startdag simuleren</label>
              <select value={dagOffset} onChange={(e) => setDagOffset(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none">
                {[0,1,2,3,4,5,6,7,10,13,14,15,17,18,20,21,25,27,28,29].map(d => (
                  <option key={d} value={d}>Dag {d + 1} (gestart {d} dagen geleden)</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Verliestype</label>
            <div className="flex flex-wrap gap-2">
              {VERLIES_TYPES_TEST.map((t) => (
                <button key={t.key} onClick={() => setVerliesType(t.key)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors"
                  style={{ background: verliesType === t.key ? "#3b82f6" : "white", color: verliesType === t.key ? "white" : "#6b7280", borderColor: verliesType === t.key ? "#3b82f6" : "#d1d5db" }}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={handleMaak} disabled={!email || !naam || bezig}
              className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-50"
              style={{ background: "#3b82f6" }}>
              <UserPlus size={14} />
              {bezig ? "Bezig…" : "Maak testprofiel"}
            </button>
            {resultaat && <span className="text-sm text-green-600">{resultaat}</span>}
            {fout && <span className="text-sm text-red-600">{fout}</span>}
          </div>
        </div>
      )}
    </div>
  );
}

function TestEmailBlok() {
  const stuurTestEmails = useAction(api.nietAlleen.stuurTestEmails);
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [naam, setNaam] = useState("");
  const [verliesType, setVerliesType] = useState("persoon");
  const [bezig, setBezig] = useState(false);
  const [klaar, setKlaar] = useState(false);
  const [fout, setFout] = useState("");

  const handleTest = async () => {
    if (!email || !naam || bezig) return;
    setBezig(true);
    setKlaar(false);
    setFout("");
    try {
      await stuurTestEmails({ email, naam, verliesType });
      setKlaar(true);
      setTimeout(() => setKlaar(false), 5000);
    } catch (e: any) {
      setFout(e?.message ?? "Onbekende fout");
    } finally {
      setBezig(false);
    }
  };

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-amber-100 transition-colors"
      >
        <FlaskConical className="w-4 h-4 text-amber-600 flex-shrink-0" />
        <span className="text-sm font-semibold text-amber-800 flex-1">Test — stuur alle 32 emails naar je inbox</span>
        {open ? <ChevronDown size={16} className="text-amber-400 flex-shrink-0" /> : <ChevronRight size={16} className="text-amber-400 flex-shrink-0" />}
      </button>
      {open && (
        <div className="px-5 pb-5 space-y-4 border-t border-amber-200">
          <p className="text-xs text-amber-700 pt-3">
            Verstuurt de welkomstmail + alle 30 dagelijkse emails + dag 28 voorbereiding + dag 30 afsluiting.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">E-mailadres</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jouw@email.nl"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Naam</label>
              <input
                type="text"
                value={naam}
                onChange={(e) => setNaam(e.target.value)}
                placeholder="Voornaam"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Verliestype</label>
            <div className="flex flex-wrap gap-2">
              {VERLIES_TYPES_TEST.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setVerliesType(t.key)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors"
                  style={{
                    background: verliesType === t.key ? "#f59e0b" : "white",
                    color: verliesType === t.key ? "white" : "#6b7280",
                    borderColor: verliesType === t.key ? "#f59e0b" : "#d1d5db",
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleTest}
              disabled={!email || !naam || bezig}
              className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold text-white transition-colors disabled:opacity-50"
              style={{ background: "#f59e0b" }}
            >
              <Send size={14} />
              {bezig ? "Bezig met versturen (even geduld)…" : "Stuur alle 32 emails"}
            </button>
            {klaar && (
              <span className="flex items-center gap-1 text-sm text-green-600 font-medium">
                <CheckCircle size={15} /> Verstuurd!
              </span>
            )}
            {fout && <span className="text-sm text-red-600">{fout}</span>}
          </div>
        </div>
      )}
    </div>
  );
}

const NICHE_LABELS: Record<string, string> = {
  persoon: "Persoon",
  huisdier: "Huisdier",
  scheiding: "Scheiding / relatie",
};

function DagRij({
  dag,
  niche,
  override,
  onSave,
  onReset,
}: {
  dag: (typeof NIET_ALLEEN_CONTENT)[0];
  niche: string;
  override: { subject: string; mailTekst: string } | undefined;
  onSave: (dag: number, verliesType: string, subject: string, mailTekst: string) => Promise<void>;
  onReset: (dag: number, verliesType: string) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const defaultSubject = dag.subject;
  const defaultTekst = getMailTekst(dag.dag, niche);
  const [subject, setSubject] = useState(override?.subject ?? defaultSubject);
  const [mailTekst, setMailTekst] = useState(override?.mailTekst ?? defaultTekst);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setSubject(override?.subject ?? defaultSubject);
    setMailTekst(override?.mailTekst ?? defaultTekst);
  }, [override?.subject, override?.mailTekst, defaultSubject, defaultTekst]);

  const isEdited = !!override;
  const isDirty = subject !== (override?.subject ?? defaultSubject) || mailTekst !== (override?.mailTekst ?? defaultTekst);

  return (
    <div className={`border rounded-xl overflow-hidden ${isEdited ? "border-primary-300 bg-primary-50/30" : "border-gray-200 bg-white"}`}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors"
      >
        {open ? <ChevronDown size={15} className="text-gray-400 flex-shrink-0" /> : <ChevronRight size={15} className="text-gray-400 flex-shrink-0" />}
        <span className="text-xs font-bold text-gray-500 w-10 flex-shrink-0">Dag {dag.dag}</span>
        <span className="text-sm font-medium text-gray-700 flex-1 truncate">{dag.thema}</span>
        <span className="text-xs text-gray-400 truncate hidden sm:block max-w-[200px]">{subject}</span>
        {isEdited && (
          <span className="flex-shrink-0 text-[10px] font-semibold text-primary-600 bg-primary-100 border border-primary-200 rounded-full px-2 py-0.5">
            aangepast
          </span>
        )}
      </button>

      {open && (
        <div className="px-4 pb-4 pt-1 space-y-3 border-t border-gray-100">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Onderwerp</label>
            <input
              type="text"
              value={subject}
              onChange={e => setSubject(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              Mailtekst <span className="font-normal text-gray-400">(aanhef + handtekening worden automatisch toegevoegd — gebruik &#123;link&#125; voor de CTA-knop)</span>
            </label>
            <textarea
              value={mailTekst}
              onChange={e => setMailTekst(e.target.value)}
              rows={8}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 resize-y font-mono"
            />
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={async () => {
                setSaving(true);
                await onSave(dag.dag, niche, subject, mailTekst);
                setSaving(false);
                setSaved(true);
                setTimeout(() => setSaved(false), 2500);
              }}
              disabled={saving || !isDirty}
              className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
            >
              <Save size={14} />
              {saving ? "Opslaan…" : "Opslaan"}
            </button>
            {isEdited && (
              <button
                type="button"
                onClick={async () => {
                  await onReset(dag.dag, niche);
                  setSubject(defaultSubject);
                  setMailTekst(defaultTekst);
                }}
                className="flex items-center gap-2 px-3 py-2 text-sm text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <RotateCcw size={13} />
                Terugzetten naar standaard
              </button>
            )}
            {saved && (
              <span className="flex items-center gap-1 text-sm text-green-600 font-medium">
                <CheckCircle size={14} /> Opgeslagen
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function DertigDagenEditor({ dagTemplates, niches }: { dagTemplates: any[]; niches: { code: string; naam: string }[] }) {
  const upsertDag = useAdminMutation(api.emailTemplates.upsertDagTemplate);
  const deleteDag = useAdminMutation(api.emailTemplates.deleteDagTemplate);
  const dupliceerReeks = useAdminMutation(api.verliesTypen.dupliceerReeks);
  const removeVerliesType = useAdminMutation(api.verliesTypen.remove);

  const [niche, setNiche] = useState<string>(niches[0]?.code ?? "persoon");
  const [showNieuw, setShowNieuw] = useState(false);
  const [nieuwCode, setNieuwCode] = useState("");
  const [nieuwNaam, setNieuwNaam] = useState("");
  const [bronCode, setBronCode] = useState("persoon");
  const [bezig, setBezig] = useState(false);
  const [fout, setFout] = useState("");

  const overrideMap = new Map(
    dagTemplates.map(t => [`${t.dag}-${t.verliesType}`, { subject: t.subject, mailTekst: t.mailTekst }])
  );

  // Haal de standaard mailtekst op voor de actieve niche
  const getNicheDefault = (dag: typeof NIET_ALLEEN_CONTENT[0], code: string) => {
    return getMailTekst(dag.dag, code);
  };

  const handleDuplicate = async () => {
    if (!nieuwCode.trim() || !nieuwNaam.trim()) return;
    setBezig(true);
    setFout("");
    try {
      await dupliceerReeks({ bronCode, nieuwCode: nieuwCode.trim(), nieuwNaam: nieuwNaam.trim() });
      setNiche(nieuwCode.trim().toLowerCase().replace(/\s+/g, "_"));
      setShowNieuw(false);
      setNieuwCode("");
      setNieuwNaam("");
    } catch (e: any) {
      setFout(e?.message ?? "Onbekende fout");
    } finally {
      setBezig(false);
    }
  };

  const INGEBOUWD = ["persoon", "huisdier", "scheiding"];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Pencil size={18} className="text-primary-500" />
            30 dagelijkse mails
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">Klik op een dag om de inhoud te bewerken. Aanpassingen overschrijven de standaardtekst.</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {niches.map(n => (
            <button
              key={n.code}
              onClick={() => setNiche(n.code)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors"
              style={{
                background: niche === n.code ? "#6d84a8" : "white",
                color: niche === n.code ? "white" : "#6b7280",
                borderColor: niche === n.code ? "#6d84a8" : "#d1d5db",
              }}
            >
              {NICHE_LABELS[n.code] ?? n.naam.split(" — ")[0]}
            </button>
          ))}
          <button
            onClick={() => setShowNieuw(v => !v)}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-dashed border-gray-300 text-gray-500 hover:border-primary-400 hover:text-primary-600 transition-colors flex items-center gap-1"
          >
            <Plus size={13} />
            Nieuw type
          </button>
        </div>
      </div>

      {/* Reset alle aanpassingen voor actieve niche */}
      {dagTemplates.some(t => t.verliesType === niche) && (
        <div className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-lg px-4 py-2.5">
          <p className="text-xs text-amber-700">
            Er zijn opgeslagen aanpassingen voor <strong>{NICHE_LABELS[niche] ?? niche}</strong> die de standaardtekst overschrijven.
          </p>
          <button
            onClick={async () => {
              if (!confirm(`Alle aanpassingen voor ${NICHE_LABELS[niche] ?? niche} verwijderen en terugzetten naar standaard?`)) return;
              await Promise.all(
                dagTemplates.filter(t => t.verliesType === niche).map(t => deleteDag({ dag: t.dag, verliesType: t.verliesType }))
              );
            }}
            className="ml-4 flex-shrink-0 px-3 py-1.5 text-xs font-semibold text-amber-700 hover:bg-amber-100 border border-amber-300 rounded-lg transition-colors flex items-center gap-1.5"
          >
            <RotateCcw size={12} />
            Reset alle dagen
          </button>
        </div>
      )}

      {/* Nieuw verliestype aanmaken */}
      {showNieuw && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Copy size={15} className="text-blue-600" />
            <h3 className="text-sm font-semibold text-blue-800">Nieuw verliestype — dupliceer een bestaande reeks</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Code <span className="font-normal text-gray-400">(kleine letters, geen spaties)</span></label>
              <input
                type="text"
                placeholder="werkloosheid"
                value={nieuwCode}
                onChange={e => setNieuwCode(e.target.value.toLowerCase().replace(/\s+/g, "_"))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Weergavenaam</label>
              <input
                type="text"
                placeholder="Werkloosheid — verlies van werk"
                value={nieuwNaam}
                onChange={e => setNieuwNaam(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Kopieer mails van</label>
            <div className="flex gap-2 flex-wrap">
              {niches.map(n => (
                <button key={n.code} onClick={() => setBronCode(n.code)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors"
                  style={{ background: bronCode === n.code ? "#3b82f6" : "white", color: bronCode === n.code ? "white" : "#6b7280", borderColor: bronCode === n.code ? "#3b82f6" : "#d1d5db" }}>
                  {NICHE_LABELS[n.code] ?? n.naam.split(" — ")[0]}
                </button>
              ))}
            </div>
          </div>
          {fout && <p className="text-sm text-red-600">{fout}</p>}
          <div className="flex gap-2">
            <button onClick={handleDuplicate} disabled={bezig || !nieuwCode || !nieuwNaam}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold disabled:opacity-50">
              <Copy size={14} />
              {bezig ? "Bezig…" : "Aanmaken & kopiëren"}
            </button>
            <button onClick={() => { setShowNieuw(false); setFout(""); }}
              className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
              Annuleren
            </button>
          </div>
        </div>
      )}

      {/* Verwijder-knop voor custom types */}
      {!INGEBOUWD.includes(niche) && (
        <div className="flex justify-end">
          <button
            onClick={async () => {
              if (!confirm(`Verliestype "${niche}" en alle bijbehorende mails verwijderen?`)) return;
              await removeVerliesType({ code: niche });
              setNiche(niches[0]?.code ?? "persoon");
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-red-600 border border-red-200 rounded-lg hover:bg-red-50"
          >
            <Trash2 size={13} />
            Verliestype verwijderen
          </button>
        </div>
      )}

      <div className="space-y-2">
        {NIET_ALLEEN_CONTENT.map(dag => (
          <DagRij
            key={dag.dag}
            dag={dag}
            niche={niche}
            override={overrideMap.get(`${dag.dag}-${niche}`)}
            onSave={async (d, vType, subject, mailTekst) => {
              await upsertDag({ dag: d, verliesType: vType, subject, mailTekst });
            }}
            onReset={async (d, vType) => {
              await deleteDag({ dag: d, verliesType: vType });
            }}
          />
        ))}
      </div>
    </div>
  );
}

export default function NietAlleenEmailsPage() {
  const templates = useAdminQuery(api.emailTemplates.listTemplates, {});
  const dagTemplates = useAdminQuery(api.emailTemplates.listDagTemplates, {});
  const verliesTypen = useAdminQuery(api.verliesTypen.list, {});
  const upsertTemplate = useAdminMutation(api.emailTemplates.upsertTemplate);
  const seedVerliesTypen = useAdminMutation(api.verliesTypen.seed);

  const basisTypesMissing = verliesTypen !== undefined &&
    !verliesTypen.some((t: { code: string }) => t.code === "persoon");

  const getTemplate = (key: TemplateKey) => templates?.find((t: any) => t.key === key);

  const handleSave = async (key: TemplateKey, subject: string, bodyText: string) => {
    await upsertTemplate({ key, subject, bodyText });
  };

  const keys: TemplateKey[] = ["niet_alleen_welkom", "niet_alleen_dag", "niet_alleen_dag28", "niet_alleen_dag30"];

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Niet Alleen e-mails</h1>
        <p className="text-sm text-gray-500 mt-1">
          Pas de inhoud aan van de automatische e-mails tijdens de 30 dagen begeleiding
        </p>
      </div>

      {basisTypesMissing && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center justify-between gap-4">
          <p className="text-sm text-amber-800">De basistypes (persoon, huisdier, scheiding) ontbreken nog.</p>
          <button
            onClick={() => seedVerliesTypen({})}
            className="px-4 py-2 bg-amber-500 text-white rounded-lg text-sm font-semibold hover:bg-amber-600 shrink-0"
          >
            Basistypes toevoegen
          </button>
        </div>
      )}

      <TestProfielBlok />
      <TestEmailBlok />
      <ProgrammaPreviewBlok verliesTypen={verliesTypen as { code: string; naam: string }[] | undefined} />

      {keys.map((key) => {
        const t = getTemplate(key);
        return (
          <TemplateEditor
            key={key}
            templateKey={key}
            savedSubject={t?.subject}
            savedBodyText={t?.bodyText}
            onSave={handleSave}
          />
        );
      })}

      <div className="border-t border-gray-200 pt-6">
        {dagTemplates !== undefined && verliesTypen !== undefined ? (
          <DertigDagenEditor
            dagTemplates={dagTemplates}
            niches={verliesTypen as { code: string; naam: string }[]}
          />
        ) : (
          <p className="text-sm text-gray-400">Laden…</p>
        )}
      </div>
    </div>
  );
}
