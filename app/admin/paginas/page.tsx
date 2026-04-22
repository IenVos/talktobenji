"use client";

import { useState, useEffect } from "react";
import { useAdminQuery, useAdminMutation } from "../AdminAuthContext";
import { api } from "@/convex/_generated/api";
import { Save, LayoutTemplate, ExternalLink } from "lucide-react";

// Definitie van alle bewerkbare velden per pagina
const HOMEPAGE_FIELDS = [
  { section: "Hero", fields: [
    { key: "heroLabel",    label: "Kleine tekst boven titel",   hint: "Bijv: 03:18 's nachts. Niemand om te bellen." },
    { key: "heroTitle",    label: "Hoofdtitel regel 1",          hint: "Bijv: Altijd iemand die luistert," },
    { key: "heroTitleAccent", label: "Hoofdtitel regel 2 (accent)", hint: "Bijv: ook als het moeilijk is" },
    { key: "heroSubtitle", label: "Subtitel",                   hint: "De beschrijvende tekst onder de titel", multiline: true },
    { key: "heroCta1",     label: "Primaire knoptekst",          hint: "Bijv: Praat nu met Benji" },
    { key: "heroCta2",     label: "Secundaire knoptekst",        hint: "Bijv: Lees over verdriet en verlies" },
    { key: "heroNote",     label: "Kleine noot onder knoppen",   hint: "Bijv: Anoniem · Geen registratie nodig" },
  ]},
  { section: "Blok 1 — Gesprek", fields: [
    { key: "blok1Titel",   label: "Titel",       hint: "" },
    { key: "blok1Tekst",   label: "Beschrijving", hint: "", multiline: true },
    { key: "blok1Cta",     label: "Link tekst",  hint: "" },
  ]},
  { section: "Blok 2 — Blog", fields: [
    { key: "blok2Titel",   label: "Titel",       hint: "" },
    { key: "blok2Tekst",   label: "Beschrijving", hint: "", multiline: true },
    { key: "blok2Cta",     label: "Link tekst",  hint: "" },
  ]},
  { section: "Blok 3 — Jaar toegang", fields: [
    { key: "blok3Titel",   label: "Titel",       hint: "" },
    { key: "blok3Tekst",   label: "Beschrijving", hint: "", multiline: true },
    { key: "blok3Cta",     label: "Link tekst",  hint: "" },
  ]},
  { section: "Over Benji", fields: [
    { key: "overTitle",    label: "Titel",        hint: "" },
    { key: "overP1",       label: "Alinea 1",     hint: "", multiline: true },
    { key: "overP2",       label: "Alinea 2",     hint: "", multiline: true },
    { key: "overP3",       label: "Alinea 3",     hint: "", multiline: true },
  ]},
  { section: "Zo werkt een gesprek", fields: [
    { key: "stappenTitel", label: "Sectietitel",  hint: "" },
    { key: "stap1Titel",   label: "Stap 1 titel", hint: "" },
    { key: "stap1Tekst",   label: "Stap 1 tekst", hint: "", multiline: true },
    { key: "stap2Titel",   label: "Stap 2 titel", hint: "" },
    { key: "stap2Tekst",   label: "Stap 2 tekst", hint: "", multiline: true },
    { key: "stap3Titel",   label: "Stap 3 titel", hint: "" },
    { key: "stap3Tekst",   label: "Stap 3 tekst", hint: "", multiline: true },
    { key: "stap4Titel",   label: "Stap 4 titel", hint: "" },
    { key: "stap4Tekst",   label: "Stap 4 tekst", hint: "", multiline: true },
    { key: "stap5Titel",   label: "Stap 5 titel", hint: "" },
    { key: "stap5Tekst",   label: "Stap 5 tekst", hint: "", multiline: true },
  ]},
  { section: "Klaar om te beginnen", fields: [
    { key: "ctaTitel",     label: "Titel",        hint: "" },
    { key: "ctaTekst",     label: "Beschrijving", hint: "", multiline: true },
    { key: "ctaKnop",      label: "Knoptekst",    hint: "" },
  ]},
  { section: "Meer dan een gesprek (screenshot-strip)", fields: [
    { key: "showcaseTitel",    label: "Sectietitel",    hint: "" },
    { key: "showcaseSubtitel", label: "Sectiesubtitel", hint: "" },
  ]},
];

const DEFAULTS: Record<string, string> = {
  heroLabel:       "03:18 's nachts. Niemand om te bellen.",
  heroTitle:       "Altijd iemand die luistert,",
  heroTitleAccent: "ook als het moeilijk is",
  heroSubtitle:    "Benji is er voor je als je verdriet hebt, iets verliest of gewoon je gedachten kwijt wilt. Altijd beschikbaar, zonder oordeel.",
  heroCta1:        "Praat nu met Benji",
  heroCta2:        "Lees over verdriet en verlies",
  heroNote:        "Anoniem · Geen registratie nodig · Direct beschikbaar",
  blok1Titel:      "Praat gratis met Benji",
  blok1Tekst:      "Je eerste vijf gesprekken zijn gratis, zonder account. Maak je een account aan, dan kun je tien gesprekken per maand voeren.",
  blok1Cta:        "Begin een gesprek",
  blok2Titel:      "Samen Omgaan met Verdriet en Pijn",
  blok2Tekst:      "Een plek waar je steun, begrip en praktische tips vindt om sterker door moeilijke tijden te komen.",
  blok2Cta:        "Bekijk alle artikelen",
  blok3Titel:      "Benji voor een heel jaar",
  blok3Tekst:      "Voor wie wil dat Benji er altijd is, ook als het even beter gaat. Ontdek wat erbij zit.",
  blok3Cta:        "Bekijk wat erbij zit",
  overTitle:       "Gemaakt omdat er iets ontbrak en uit eigen ervaring met verlies",
  overP1:          "Ik ben Ien, oprichter van Talk To Benji. Ik vroeg me af waarom er voor mensen met verdriet zo weinig is dat echt laagdrempelig is. Geen wachtlijst, geen intake, geen afspraak, gewoon iemand die luistert, ook om 03:00 's nachts.",
  overP2:          "Dat werd Benji. Zes jaar lang zocht ik naar de beste manier om een plek te maken waar je je verhaal kwijt kunt, je gedachten kunt ordenen en zo beter zicht krijgt op alles wat er in je hoofd zit. Niet om je te vertellen wat je moet doen, maar om je te helpen het zelf te begrijpen.",
  overP3:          "Benji is geen professional, en dat zegt hij ook eerlijk. Maar voor de momenten dat de drempel naar echte hulp te hoog is, of als je gewoon wilt zeggen wat er is, dan is Benji er.",
  stappenTitel:    "Zo werkt een gesprek met Benji",
  stap1Titel:      "Je typt of zegt wat er is",
  stap1Tekst:      "Geen vragen vooraf, geen verplicht onderwerp. Je begint gewoon, ook als je niet precies weet waar je moet starten.",
  stap2Titel:      "Benji luistert en vraagt door",
  stap2Tekst:      "Benji reageert op jou. Stelt vragen, geeft ruimte, en past zich aan wat jij nodig hebt op dat moment.",
  stap3Titel:      "Jij bepaalt wanneer je stopt",
  stap3Tekst:      "Je sluit het gesprek af wanneer jij wilt. Geen verplichtingen, geen follow-up die je niet wilt.",
  stap4Titel:      "Verder waar je gebleven was",
  stap4Tekst:      "Met een gratis account blijven je gesprekken bewaard. Je kunt op elk moment verder waar je gebleven was.",
  stap5Titel:      "Er is meer",
  stap5Tekst:      "Met Benji voor een jaar heb je toegang tot alles: reflecties, doelen, memories, dagelijkse check-ins, inspiratie en een herdenkingskalender.",
  ctaTitel:        "Klaar om te beginnen?",
  ctaTekst:        "Je hoeft je niet te registreren. Begin gewoon een gesprek, anoniem en direct beschikbaar.",
  ctaKnop:         "Praat nu met Benji",
  showcaseTitel:   "Meer dan een gesprek",
  showcaseSubtitel: "Maak een gratis account aan en houd bij wat je bezighoudt. Met Benji voor een jaar heb je toegang tot alles.",
};

function Field({
  label, hint, value, onChange, multiline,
}: {
  label: string; hint: string; value: string; onChange: (v: string) => void; multiline?: boolean;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-700 mb-1">{label}</label>
      {hint && <p className="text-xs text-gray-400 mb-1">{hint}</p>}
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400 resize-y"
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400"
        />
      )}
    </div>
  );
}

export default function PaginasAdminPage() {
  const savedContent = useAdminQuery(api.pageContent.getPageContent, { pageKey: "homepage" });
  const setPageContent = useAdminMutation(api.pageContent.setPageContent);

  const [values, setValues] = useState<Record<string, string>>(DEFAULTS);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (savedContent) {
      setValues({ ...DEFAULTS, ...savedContent });
    }
  }, [savedContent]);

  const set = (key: string, val: string) =>
    setValues((prev) => ({ ...prev, [key]: val }));

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      await setPageContent({ pageKey: "homepage", content: JSON.stringify(values) });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <LayoutTemplate size={22} className="text-primary-500" />
          <div>
            <h1 className="text-xl font-bold text-gray-900">Pagina's</h1>
            <p className="text-sm text-gray-500">Bewerk de teksten op de homepagina</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            <ExternalLink size={14} />
            Bekijk pagina
          </a>
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50 transition-colors"
          >
            <Save size={16} />
            {saving ? "Bezig…" : saved ? "Opgeslagen!" : "Opslaan"}
          </button>
        </div>
      </div>

      {/* Secties */}
      {HOMEPAGE_FIELDS.map(({ section, fields }) => (
        <div key={section} className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-4 pb-3 border-b border-gray-100">{section}</h2>
          <div className="space-y-4">
            {fields.map((f) => (
              <Field
                key={f.key}
                label={f.label}
                hint={f.hint}
                value={values[f.key] ?? ""}
                onChange={(v) => set(f.key, v)}
                multiline={f.multiline}
              />
            ))}
          </div>
        </div>
      ))}

      {/* Opslaan onderaan */}
      <div className="flex justify-end pb-8">
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50 transition-colors"
        >
          <Save size={16} />
          {saving ? "Bezig…" : saved ? "Opgeslagen!" : "Opslaan"}
        </button>
      </div>
    </div>
  );
}
