"use client";

import { useState, useEffect } from "react";
import { useAdminQuery, useAdminMutation } from "../AdminAuthContext";
import { api } from "@/convex/_generated/api";
import { ClipboardList, ExternalLink, Edit, Save, ArrowLeft, RotateCcw, Plus, Trash2, Inbox } from "lucide-react";
import { mergeIntake, defaultIntake, INTAKE_GROEPEN, type IntakeConfig } from "@/components/intakeDefaults";

function typeLabel(verliestype: string): string {
  if (verliestype === "kinderloos") return "Ongewenste kinderloosheid";
  if (verliestype === "persoon") return "Verlies van iemand";
  if (verliestype === "relatie") return "Relatiebreuk of scheiding";
  if (verliestype === "eenzaamheid") return "Eenzaamheid";
  if (verliestype === "huisdier") return "Verlies van een huisdier";
  return verliestype || "Onbekend";
}

// ── Editor voor één verliestype ─────────────────────────────────────────
function FormEditor({ verliestype, voorbeeldSlug, onClose }: { verliestype: string; voorbeeldSlug?: string; onClose: () => void }) {
  const stored = useAdminQuery(api.blokPaginas.getIntakeFormAdmin, { verliestype });
  const save = useAdminMutation(api.blokPaginas.saveIntakeForm);
  const [cfg, setCfg] = useState<IntakeConfig | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (stored !== undefined && cfg === null) {
      let opgeslagen: any = null;
      if (stored) { try { opgeslagen = JSON.parse(stored); } catch { opgeslagen = null; } }
      setCfg(mergeIntake(verliestype, opgeslagen));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stored]);

  if (stored === undefined || cfg === null) return <div className="p-8 text-gray-400">Laden...</div>;

  const setVeld = (k: keyof IntakeConfig, v: any) => setCfg((c) => (c ? { ...c, [k]: v } : c));

  const handleSave = async () => {
    setSaving(true); setMsg("");
    try {
      await save({ verliestype, configJson: JSON.stringify(cfg) });
      setMsg("Opgeslagen ✓");
      setTimeout(() => setMsg(""), 2500);
    } catch (e: any) {
      setMsg("Fout: " + (e?.message || e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto pb-24">
      <div className="flex items-center justify-between mb-6 sticky top-0 bg-gray-50 py-3 z-10 -mx-4 px-4 border-b border-gray-200">
        <button onClick={onClose} className="flex items-center gap-1.5 text-gray-600 hover:text-gray-900 text-sm">
          <ArrowLeft size={16} /> Overzicht
        </button>
        <div className="flex items-center gap-3">
          {msg && <span className={`text-sm ${msg.startsWith("Fout") ? "text-red-600" : "text-green-600"}`}>{msg}</span>}
          <button onClick={() => { if (confirm("Alle teksten terugzetten naar de standaard? (nog niet opgeslagen)")) setCfg(defaultIntake(verliestype)); }}
            className="flex items-center gap-1.5 text-gray-600 hover:text-gray-900 text-sm">
            <RotateCcw size={15} /> Standaard
          </button>
          {voorbeeldSlug && (
            <a href={`/lp/${voorbeeldSlug}/kennismaken`} target="_blank" rel="noreferrer"
              className="flex items-center gap-1.5 text-gray-600 hover:text-gray-900 text-sm">
              <ExternalLink size={15} /> Bekijken
            </a>
          )}
          <button onClick={handleSave} disabled={saving}
            className="flex items-center gap-1.5 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-60">
            <Save size={15} /> {saving ? "Opslaan..." : "Opslaan"}
          </button>
        </div>
      </div>

      <h1 className="text-xl font-bold text-gray-900 mb-1">Intakeformulier · {typeLabel(verliestype)}</h1>
      <p className="text-gray-500 text-sm mb-6">Pas de teksten en vragen aan. Leeg laten valt terug op de standaardtekst.</p>

      <div className="space-y-6">
        {INTAKE_GROEPEN.map((g) => (
          <div key={g.groep} className="bg-white border border-gray-300 rounded-xl p-5">
            <h2 className="font-semibold text-gray-800 mb-4">{g.groep}</h2>
            <div className="space-y-4">
              {g.velden.map((f) => (
                <div key={f.key as string}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{f.label}</label>
                  {f.kind === "text" && (
                    <input type="text" value={(cfg as any)[f.key] ?? ""} onChange={(e) => setVeld(f.key, e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                  )}
                  {f.kind === "textarea" && (
                    <textarea rows={2} value={(cfg as any)[f.key] ?? ""} onChange={(e) => setVeld(f.key, e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-y" />
                  )}
                  {f.kind === "stringList" && (
                    <StringList value={(cfg as any)[f.key] ?? []} onChange={(v) => setVeld(f.key, v)} />
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function StringList({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const arr = Array.isArray(value) ? value : [];
  return (
    <div className="space-y-2">
      {arr.map((item, i) => (
        <div key={i} className="flex gap-2 items-start">
          <input type="text" value={item}
            onChange={(e) => onChange(arr.map((x, j) => (j === i ? e.target.value : x)))}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          <button type="button" onClick={() => onChange(arr.filter((_, j) => j !== i))}
            className="p-2 text-gray-400 hover:text-red-500" title="Verwijderen"><Trash2 size={16} /></button>
        </div>
      ))}
      <button type="button" onClick={() => onChange([...arr, ""])}
        className="text-sm text-primary-600 hover:text-primary-800 flex items-center gap-1"><Plus size={14} /> Optie toevoegen</button>
    </div>
  );
}

// ── Overzicht ───────────────────────────────────────────────────────────
export default function IntakeformulierenPage() {
  const paginas = useAdminQuery(api.blokPaginas.list, {}) as any[] | undefined;
  const [editType, setEditType] = useState<string | null>(null);

  // Unieke verliestypes uit de pagina's, met een voorbeeld-slug per type.
  const perType = new Map<string, string>();
  for (const p of paginas ?? []) {
    const vt = p.verliestype || "persoon";
    if (!perType.has(vt)) perType.set(vt, p.slug);
  }
  const types = Array.from(perType.keys());

  if (editType) {
    return <FormEditor verliestype={editType} voorbeeldSlug={perType.get(editType)} onClose={() => setEditType(null)} />;
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-2">
        <ClipboardList className="text-primary-600" size={24} />
        <h1 className="text-2xl font-bold text-gray-900">Intakeformulieren</h1>
      </div>
      <p className="text-gray-500 mb-6 text-sm">
        Elk verliestype heeft een eigen kennismakingsformulier. Bewerk hier de teksten en vragen. De inzendingen komen binnen bij{" "}
        <span className="font-medium text-gray-700">Aanmeldingen</span>.
      </p>

      {paginas === undefined ? (
        <div className="text-gray-400">Laden...</div>
      ) : types.length === 0 ? (
        <div className="text-gray-500 bg-white border border-gray-200 rounded-xl p-8 text-center">
          Nog geen landingspagina's. Maak eerst een blok-pagina aan.
        </div>
      ) : (
        <div className="space-y-3">
          {types.map((vt) => (
            <div key={vt} className="bg-white border border-gray-300 rounded-xl p-4 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <span className="font-medium text-gray-800">{typeLabel(vt)}</span>
                <p className="text-xs text-gray-400 mt-0.5">/lp/{perType.get(vt)}/kennismaken</p>
              </div>
              <a href={`/lp/${perType.get(vt)}/kennismaken`} target="_blank" rel="noreferrer"
                className="p-2 text-gray-400 hover:text-gray-700" title="Bekijken"><ExternalLink size={17} /></a>
              <button onClick={() => setEditType(vt)}
                className="flex items-center gap-1.5 bg-primary-600 hover:bg-primary-700 text-white px-3 py-1.5 rounded-lg text-sm">
                <Edit size={14} /> Bewerken
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 flex items-center gap-2 text-sm text-gray-500 bg-gray-50 border border-gray-200 rounded-xl p-4">
        <Inbox size={16} className="text-gray-400" />
        Ingevulde formulieren vind je onder <span className="font-medium text-gray-700">Zij aan Zij → Aanmeldingen</span>.
      </div>
    </div>
  );
}
