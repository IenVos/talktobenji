"use client";

import { useState } from "react";
import { useAdminQuery, useAdminMutation } from "../AdminAuthContext";
import { api } from "@/convex/_generated/api";
import { Plus, Edit, Trash2, Save, X, Copy } from "lucide-react";

const THEME_OPTIONS = [
  { key: "primary", label: "Blauw (Reflectie)" },
  { key: "amber",   label: "Oranje (Emotie)" },
  { key: "teal",    label: "Groen (Check-in)" },
  { key: "violet",  label: "Paars (Herinnering / Memories)" },
];

const DEFAULT_TYPES = [
  {
    type: "reflectie", label: "Korte reflectie", themeKey: "primary",
    intro: "Neem even de tijd voor jezelf. Je hoeft niets te delen.",
    downloadTitel: "Mijn reflectie", bestandsnaam: "mijn-reflectie.html",
    vragen: [
      { vraag: "Wat draag je vandaag met je mee dat je nog niet hardop hebt gezegd?", placeholder: "Misschien iets wat je al een tijdje met je meedraagt…" },
      { vraag: "Wat heeft je de laatste tijd het meeste energie gekost?",             placeholder: "Een situatie, een gevoel, of iemand in je omgeving…" },
      { vraag: "Wat heb je nodig — van jezelf of van anderen?",                       placeholder: "Rust, ruimte, begrip, of gewoon gehoord worden…" },
    ],
  },
  {
    type: "nacht", label: "Nachtgedachte", themeKey: "primary",
    intro: "", downloadTitel: "", bestandsnaam: "", vragen: [],
  },
  {
    type: "herinnering", label: "Een herinnering bewaren", themeKey: "violet",
    intro: "Rouw voelt vaak als een onmogelijke berg. Laten we beginnen met één klein detail.",
    downloadTitel: "Mijn herinnering", bestandsnaam: "mijn-herinnering.html",
    vragen: [
      { vraag: "Welk ding van degene die je mist wil je vandaag absoluut niet vergeten?", placeholder: "Een gebaar, een geur, een stem, een blik…" },
      { vraag: "Wat deed die persoon dat jou altijd aan hem of haar herinnert?",           placeholder: "Een gewoontetje, een uitdrukking, iets wat hij of zij altijd zei…" },
      { vraag: "Is er een moment dat je koestert en nooit wil loslaten?",                  placeholder: "Een dag, een uur, een blik die alles zei…" },
    ],
  },
  {
    type: "landing", label: "Landing", themeKey: "teal",
    intro: "", downloadTitel: "", bestandsnaam: "", vragen: [],
  },
  {
    type: "emotie", label: "Emotie-tracker", themeKey: "amber",
    intro: "Hoe voel je je vandaag — echt? Je hoeft het niet te verklaren, alleen te benoemen.",
    downloadTitel: "Mijn emoties vandaag", bestandsnaam: "mijn-emoties.html",
    vragen: [
      { vraag: "Hoe voel je je vandaag — echt?",          placeholder: "Zwaar, leeg, verdrietig, oké, of iets anders…" },
      { vraag: "Wat triggerde vandaag een gevoel bij je?", placeholder: "Een herinnering, een situatie, een geur, een lied…" },
      { vraag: "Wat hielp je vandaag, al was het maar even?", placeholder: "Een kopje thee, een wandeling, een gesprek, een moment…" },
    ],
  },
  {
    type: "checkin", label: "Dagelijkse check-in", themeKey: "teal",
    intro: "Korte vragen om je gedachten te ordenen. Je kunt dit zo vaak doen als je wil.",
    downloadTitel: "Mijn check-in", bestandsnaam: "mijn-checkin.html",
    vragen: [
      { vraag: "Hoe voel ik me vandaag?",    placeholder: "Beschrijf je stemming in je eigen woorden…" },
      { vraag: "Wat hielp me vandaag?",      placeholder: "Groot of klein, het mag allemaal…" },
      { vraag: "Waar ben ik dankbaar voor?", placeholder: "Een persoon, een moment, iets simpels…" },
    ],
  },
  {
    type: "memories", label: "Memories", themeKey: "violet",
    intro: "Bewaar wat je niet wil vergeten. Het verdient een plekje.",
    downloadTitel: "Mijn memories", bestandsnaam: "mijn-memories.html",
    vragen: [
      { vraag: "Welke herinnering wil je vandaag bewaren?",                 placeholder: "Een moment, een dag, een detail dat je bijblijft…" },
      { vraag: "Hoe voelde die herinnering toen je eraan dacht?",            placeholder: "Warm, pijnlijk, lief, gemengd…" },
      { vraag: "Wat zou je tegen die persoon zeggen als je dat zou kunnen?", placeholder: "Zeg het hier, voor jezelf…" },
    ],
  },
];

type Vraag = { vraag: string; placeholder: string };

const EMPTY_FORM = {
  type: "", label: "", intro: "", themeKey: "primary",
  downloadTitel: "", bestandsnaam: "", buttonUrl: "", buttonText: "", featureText: "",
  vragen: [
    { vraag: "", placeholder: "" },
    { vraag: "", placeholder: "" },
    { vraag: "", placeholder: "" },
  ] as Vraag[],
};

export default function BenjiTeasersAdmin() {
  const teasers = useAdminQuery(api.benjiTeasers.list, {});
  const upsert  = useAdminMutation(api.benjiTeasers.upsert);
  const remove  = useAdminMutation(api.benjiTeasers.remove);

  const [editing, setEditing] = useState<typeof EMPTY_FORM | null>(null);
  const [saving, setSaving] = useState(false);
  const [collapsedTypes, setCollapsedTypes] = useState<Set<string>>(new Set());

  type TeaserDoc = { type: string; label: string; intro: string; themeKey: string; downloadTitel: string; bestandsnaam: string; buttonUrl?: string; buttonText?: string; featureText?: string; vragen: Vraag[] };
  const dbMap = new Map<string, TeaserDoc>((teasers ?? []).map((t: any) => [t.type, t as TeaserDoc]));

  function startNew() {
    setEditing({ ...EMPTY_FORM, vragen: EMPTY_FORM.vragen.map(v => ({ ...v })) });
  }

  function startEdit(type: string) {
    const db = dbMap.get(type);
    if (db) {
      setEditing({ type: db.type, label: db.label, intro: db.intro, themeKey: db.themeKey,
        downloadTitel: db.downloadTitel, bestandsnaam: db.bestandsnaam, buttonUrl: db.buttonUrl ?? "", buttonText: db.buttonText ?? "", featureText: db.featureText ?? "",
        vragen: db.vragen.length >= 3 ? db.vragen : [...db.vragen, ...EMPTY_FORM.vragen].slice(0, 3) });
    } else {
      const def = DEFAULT_TYPES.find(d => d.type === type);
      const defVragen = def?.vragen ?? [];
      const padded = defVragen.length >= 3 ? defVragen : [...defVragen, ...EMPTY_FORM.vragen].slice(0, 3);
      setEditing({
        type,
        label: def?.label ?? "",
        intro: def?.intro ?? "",
        themeKey: def?.themeKey ?? "primary",
        downloadTitel: def?.downloadTitel ?? "",
        bestandsnaam: def?.bestandsnaam ?? "",
        buttonUrl: "",
        buttonText: "",
        featureText: "",
        vragen: padded,
      });
    }
  }

  function startDuplicate(type: string) {
    const db = dbMap.get(type);
    const def = DEFAULT_TYPES.find(d => d.type === type);
    const source = db ?? (def ? { ...def, buttonUrl: "" } : null);
    if (!source) return;
    const vragen = (source.vragen.length >= 3 ? source.vragen : [...source.vragen, ...EMPTY_FORM.vragen]).slice(0, 3);
    setEditing({
      type: "",
      label: source.label + " (kopie)",
      intro: source.intro,
      themeKey: source.themeKey,
      downloadTitel: source.downloadTitel,
      bestandsnaam: source.bestandsnaam,
      buttonUrl: (source as any).buttonUrl ?? "",
      buttonText: (source as any).buttonText ?? "",
      featureText: (source as any).featureText ?? "",
      vragen,
    });
    setTimeout(() => document.getElementById("teaser-type-input")?.focus(), 50);
  }

  async function handleSave() {
    if (!editing) return;
    setSaving(true);
    try {
      await upsert({
        type: editing.type.trim(),
        label: editing.label.trim(),
        intro: editing.intro.trim(),
        themeKey: editing.themeKey,
        downloadTitel: editing.downloadTitel.trim(),
        bestandsnaam: editing.bestandsnaam.trim(),
        buttonUrl: editing.buttonUrl.trim() || undefined,
        buttonText: editing.buttonText.trim() || undefined,
        featureText: editing.featureText.trim() || undefined,
        vragen: editing.vragen.filter(v => v.vraag.trim()),
      });
      setEditing(null);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(type: string) {
    if (!confirm(`Teaser "${type}" resetten naar standaard?`)) return;
    await remove({ type });
  }

  const setVraag = (i: number, field: "vraag" | "placeholder", val: string) => {
    if (!editing) return;
    const vragen = editing.vragen.map((v, j) => j === i ? { ...v, [field]: val } : v);
    setEditing({ ...editing, vragen });
  };

  const inputClass = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300";
  const labelClass = "block text-xs font-medium text-gray-500 mb-1";

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-800">Benji Teasers</h1>
        <button onClick={startNew}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700">
          <Plus size={16} /> Nieuwe teaser
        </button>
      </div>

      {/* Bewerkingsformulier */}
      {editing && (
        <div className="mb-8 bg-white border border-primary-200 rounded-2xl p-6 shadow-sm">
          <h2 className="text-base font-semibold text-gray-800 mb-5">
            {dbMap.has(editing.type) ? `Bewerken: ${editing.type}` : "Nieuwe teaser"}
          </h2>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className={labelClass}>Type (shortcode sleutel)</label>
              <input id="teaser-type-input" value={editing.type} onChange={e => setEditing({ ...editing, type: e.target.value })}
                placeholder="bijv. reflectie-niet-alleen" className={inputClass}
                disabled={DEFAULT_TYPES.some(d => d.type === editing.type)} />
            </div>
            <div>
              <label className={labelClass}>Kleurthema</label>
              <select value={editing.themeKey} onChange={e => setEditing({ ...editing, themeKey: e.target.value })}
                className={inputClass}>
                {THEME_OPTIONS.map(t => <option key={t.key} value={t.key}>{t.label}</option>)}
              </select>
            </div>
          </div>
          <div className="mb-4">
            <label className={labelClass}>Label (kleine koptekst bovenaan)</label>
            <input value={editing.label} onChange={e => setEditing({ ...editing, label: e.target.value })}
              placeholder="bijv. Korte reflectie" className={inputClass} />
          </div>
          <div className="mb-4">
            <label className={labelClass}>Intro (beschrijvende zin)</label>
            <textarea value={editing.intro} onChange={e => setEditing({ ...editing, intro: e.target.value })}
              rows={2} className={inputClass} />
          </div>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className={labelClass}>Download titel</label>
              <input value={editing.downloadTitel} onChange={e => setEditing({ ...editing, downloadTitel: e.target.value })}
                placeholder="bijv. Mijn reflectie" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Bestandsnaam (.html)</label>
              <input value={editing.bestandsnaam} onChange={e => setEditing({ ...editing, bestandsnaam: e.target.value })}
                placeholder="bijv. mijn-reflectie.html" className={inputClass} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-5">
            <div>
              <label className={labelClass}>Knoptekst <span className="text-gray-400 font-normal">(leeg = standaard)</span></label>
              <input value={editing.buttonText} onChange={e => setEditing({ ...editing, buttonText: e.target.value })}
                placeholder="Praat verder met Benji →"
                className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Knop URL <span className="text-gray-400 font-normal">(leeg = /)</span></label>
              <input value={editing.buttonUrl} onChange={e => setEditing({ ...editing, buttonUrl: e.target.value })}
                placeholder="https://www.talktobenji.com/niet-alleen-b"
                className={inputClass + " font-mono text-xs"} />
            </div>
          </div>

          <div className="mb-5">
            <label className={labelClass}>Tekst onderaan <span className="text-gray-400 font-normal">(leeg = standaard)</span></label>
            <input value={editing.featureText} onChange={e => setEditing({ ...editing, featureText: e.target.value })}
              placeholder="Ontdek hoe Benji er op elk moment voor je is."
              className={inputClass} />
          </div>

          <p className="text-xs font-medium text-gray-500 mb-3">Vragen (max. 3)</p>
          <div className="space-y-4 mb-6">
            {editing.vragen.map((v, i) => (
              <div key={i} className="bg-gray-50 rounded-xl p-4 space-y-2">
                <p className="text-xs text-gray-400 font-medium">Vraag {i + 1}</p>
                <input value={v.vraag} onChange={e => setVraag(i, "vraag", e.target.value)}
                  placeholder="De vraag zelf" className={inputClass} />
                <input value={v.placeholder} onChange={e => setVraag(i, "placeholder", e.target.value)}
                  placeholder="Placeholder in het tekstvak" className={inputClass} />
              </div>
            ))}
          </div>

          <div className="flex gap-3">
            <button onClick={handleSave} disabled={saving || !editing.type.trim() || !editing.label.trim()}
              className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50">
              <Save size={15} /> {saving ? "Bezig…" : "Opslaan"}
            </button>
            <button onClick={() => setEditing(null)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
              <X size={15} /> Annuleren
            </button>
          </div>
        </div>
      )}

      {/* Lijst van standaard types + eventuele extra DB-teasers */}
      <div className="space-y-2">
        {[
          ...DEFAULT_TYPES,
          ...(teasers ?? []).filter((t: any) => !DEFAULT_TYPES.some(d => d.type === t.type))
            .map((t: any) => ({ type: t.type, label: t.label, themeKey: t.themeKey, intro: t.intro ?? "", downloadTitel: t.downloadTitel ?? "", bestandsnaam: t.bestandsnaam ?? "", vragen: t.vragen ?? [] })),
        ].map(({ type, label }) => {
          const db = dbMap.get(type);
          const def = DEFAULT_TYPES.find(d => d.type === type);
          const intro = db?.intro ?? def?.intro ?? "";
          const vragen: Vraag[] = db?.vragen ?? def?.vragen ?? [];
          const buttonUrl = db?.buttonUrl;
          const isCollapsed = collapsedTypes.has(type);
          const toggle = () => setCollapsedTypes(prev => {
            const next = new Set(prev);
            next.has(type) ? next.delete(type) : next.add(type);
            return next;
          });
          return (
            <div key={type} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3">
                <div className="flex items-center gap-3 min-w-0">
                  <button onClick={toggle} className="text-gray-400 hover:text-gray-600 shrink-0 text-xs w-4 text-center select-none">
                    {isCollapsed ? "▶" : "▼"}
                  </button>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-800">{db?.label ?? label}</p>
                    <p className="text-xs text-gray-400 font-mono">[benji:{type}]</p>
                  </div>
                  {db && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full shrink-0">Aangepast</span>}
                </div>
                <div className="flex gap-2 shrink-0 ml-3">
                  <button onClick={() => startEdit(type)}
                    className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 rounded-lg text-xs text-gray-600 hover:bg-gray-50">
                    <Edit size={13} /> Bewerken
                  </button>
                  <button onClick={() => startDuplicate(type)}
                    className="flex items-center gap-1.5 px-3 py-1.5 border border-primary-200 rounded-lg text-xs text-primary-600 hover:bg-primary-50"
                    title="Kopieer vragen naar nieuwe teaser">
                    <Copy size={13} /> Dupliceer
                  </button>
                  {db && (
                    <button onClick={() => handleDelete(type)}
                      className="flex items-center gap-1.5 px-3 py-1.5 border border-red-200 rounded-lg text-xs text-red-500 hover:bg-red-50">
                      <Trash2 size={13} /> Reset
                    </button>
                  )}
                </div>
              </div>
              {!isCollapsed && (
                <div className="border-t border-gray-100 px-5 py-4 bg-gray-50 space-y-2">
                  {intro && <p className="text-xs text-gray-500 italic mb-1">{intro}</p>}
                  {vragen.length > 0 ? vragen.map((v, i) => (
                    <div key={i} className="text-xs">
                      <span className="font-medium text-gray-700">{i + 1}. {v.vraag}</span>
                      {v.placeholder && <span className="text-gray-400"> · {v.placeholder}</span>}
                    </div>
                  )) : (
                    <p className="text-xs text-gray-400">— geen vragen (visueel blok) —</p>
                  )}
                  {buttonUrl && (
                    <p className="text-xs text-primary-500 font-mono pt-1">→ {buttonUrl}</p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
