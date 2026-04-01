"use client";

import { useState } from "react";
import { useAdminQuery, useAdminMutation } from "../AdminAuthContext";
import { api } from "@/convex/_generated/api";
import { Plus, Edit, Trash2, Save, X, ChevronDown, ChevronUp } from "lucide-react";

const THEME_OPTIONS = [
  { key: "primary", label: "Blauw (Reflectie)" },
  { key: "amber",   label: "Oranje (Emotie)" },
  { key: "teal",    label: "Groen (Check-in)" },
  { key: "violet",  label: "Paars (Herinnering / Memories)" },
];

const DEFAULT_TYPES = [
  { type: "reflectie",  label: "Korte reflectie",        themeKey: "primary" },
  { type: "nacht",      label: "Nachtgedachte",           themeKey: "primary" },
  { type: "herinnering",label: "Een herinnering bewaren", themeKey: "violet"  },
  { type: "landing",    label: "Landing",                 themeKey: "teal"    },
  { type: "emotie",     label: "Emotie-tracker",          themeKey: "amber"   },
  { type: "checkin",    label: "Dagelijkse check-in",     themeKey: "teal"    },
  { type: "memories",   label: "Memories",                themeKey: "violet"  },
];

type Vraag = { vraag: string; placeholder: string };

const EMPTY_FORM = {
  type: "", label: "", intro: "", themeKey: "primary",
  downloadTitel: "", bestandsnaam: "",
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
  const [expandedType, setExpandedType] = useState<string | null>(null);

  type TeaserDoc = { type: string; label: string; intro: string; themeKey: string; downloadTitel: string; bestandsnaam: string; vragen: Vraag[] };
  const dbMap = new Map<string, TeaserDoc>((teasers ?? []).map((t: any) => [t.type, t as TeaserDoc]));

  function startNew() {
    setEditing({ ...EMPTY_FORM, vragen: EMPTY_FORM.vragen.map(v => ({ ...v })) });
  }

  function startEdit(type: string) {
    const db = dbMap.get(type);
    if (db) {
      setEditing({ type: db.type, label: db.label, intro: db.intro, themeKey: db.themeKey,
        downloadTitel: db.downloadTitel, bestandsnaam: db.bestandsnaam,
        vragen: db.vragen.length >= 3 ? db.vragen : [...db.vragen, ...EMPTY_FORM.vragen].slice(0, 3) });
    } else {
      const def = DEFAULT_TYPES.find(d => d.type === type);
      setEditing({ ...EMPTY_FORM, type, label: def?.label ?? "", themeKey: def?.themeKey ?? "primary",
        vragen: EMPTY_FORM.vragen.map(v => ({ ...v })) });
    }
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
              <input value={editing.type} onChange={e => setEditing({ ...editing, type: e.target.value })}
                placeholder="bijv. reflectie" className={inputClass}
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
          <div className="grid grid-cols-2 gap-4 mb-5">
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
            .map((t: any) => ({ type: t.type, label: t.label, themeKey: t.themeKey })),
        ].map(({ type, label }) => {
          const db = dbMap.get(type);
          const isOpen = expandedType === type;
          return (
            <div key={type} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3">
                <div className="flex items-center gap-3">
                  <button onClick={() => setExpandedType(isOpen ? null : type)} className="text-gray-400 hover:text-gray-600">
                    {isOpen ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                  </button>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{db?.label ?? label}</p>
                    <p className="text-xs text-gray-400 font-mono">[benji:{type}]</p>
                  </div>
                  {db && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Aangepast</span>}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => startEdit(type)}
                    className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 rounded-lg text-xs text-gray-600 hover:bg-gray-50">
                    <Edit size={13} /> Bewerken
                  </button>
                  {db && (
                    <button onClick={() => handleDelete(type)}
                      className="flex items-center gap-1.5 px-3 py-1.5 border border-red-200 rounded-lg text-xs text-red-500 hover:bg-red-50">
                      <Trash2 size={13} /> Reset
                    </button>
                  )}
                </div>
              </div>
              {isOpen && (
                <div className="border-t border-gray-100 px-5 py-4 bg-gray-50 space-y-2">
                  <p className="text-xs text-gray-500 italic">{db?.intro ?? "— standaard tekst —"}</p>
                  {(db?.vragen ?? []).map((v: Vraag, i: number) => (
                    <div key={i} className="text-xs">
                      <span className="font-medium text-gray-700">{i + 1}. {v.vraag}</span>
                      <span className="text-gray-400"> · {v.placeholder}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
