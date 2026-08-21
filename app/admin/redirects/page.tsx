"use client";

import { useState } from "react";
import { useAdminQuery, useAdminMutation } from "../AdminAuthContext";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Plus, Trash2, Save, X, Edit, ArrowRight } from "lucide-react";

type Form = {
  from: string;
  to: string;
  permanent: boolean;
  active: boolean;
  note: string;
};

const EMPTY: Form = { from: "", to: "", permanent: true, active: true, note: "" };

export default function RedirectsAdminPage() {
  const rows = useAdminQuery(api.redirects.listAll, {});
  const upsert = useAdminMutation(api.redirects.upsert);
  const remove = useAdminMutation(api.redirects.remove);
  const toggle = useAdminMutation(api.redirects.toggle);

  const [editingId, setEditingId] = useState<Id<"redirects"> | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Form>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const input = "w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-400";

  const openNew = () => { setForm(EMPTY); setEditingId(null); setError(null); setShowForm(true); };
  const openEdit = (r: any) => {
    setForm({ from: r.from, to: r.to, permanent: r.permanent, active: r.active, note: r.note ?? "" });
    setEditingId(r._id); setError(null); setShowForm(true);
  };

  const save = async () => {
    setError(null);
    if (!form.from.trim() || !form.to.trim()) { setError("Vul zowel 'van' als 'naar' in."); return; }
    setSaving(true);
    try {
      await upsert({
        id: editingId ?? undefined,
        from: form.from.trim(),
        to: form.to.trim(),
        permanent: form.permanent,
        active: form.active,
        note: form.note.trim() || undefined,
      });
      setShowForm(false); setEditingId(null);
    } catch (e: any) {
      setError(e?.message?.replace(/^\[.*?\]\s*/, "") || "Opslaan mislukt.");
    } finally {
      setSaving(false);
    }
  };

  const del = async (id: Id<"redirects">) => {
    if (!confirm("Deze redirect verwijderen?")) return;
    await remove({ id });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Redirects</h1>
          <p className="text-sm text-gray-500 mt-1">
            Stuur oude of gewijzigde URL's door naar de juiste pagina. Zo krijgen bezoekers en Google geen doodlopende pagina, maar het echte antwoord.
          </p>
        </div>
        <button onClick={openNew} className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700">
          <Plus size={16} /> Nieuwe redirect
        </button>
      </div>

      <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-sm text-blue-800">
        <p className="font-medium mb-1">Hoe werkt het?</p>
        <ul className="list-disc list-inside space-y-0.5 text-blue-700">
          <li><strong>Van</strong>: het oude pad, bijv. <code className="bg-white px-1 rounded">/blog/oude-titel</code></li>
          <li><strong>Naar</strong>: het nieuwe pad of een volledige URL, bijv. <code className="bg-white px-1 rounded">/blog/nieuwe-titel</code></li>
          <li><strong>301</strong> = blijvend (voor hernoemde/verplaatste pagina's, geeft SEO-waarde door). <strong>302</strong> = tijdelijk.</li>
          <li>Wijzigingen zijn binnen ongeveer een minuut live.</li>
        </ul>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-800">{editingId ? "Redirect bewerken" : "Nieuwe redirect"}</h2>
            <button onClick={() => setShowForm(false)} className="p-1 text-gray-400 hover:text-gray-600"><X size={18} /></button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Van (oud pad) *</label>
              <input type="text" value={form.from} onChange={(e) => setForm(f => ({ ...f, from: e.target.value }))} placeholder="/blog/oude-titel" className={input + " font-mono"} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Naar (nieuw pad of URL) *</label>
              <input type="text" value={form.to} onChange={(e) => setForm(f => ({ ...f, to: e.target.value }))} placeholder="/blog/nieuwe-titel" className={input + " font-mono"} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Notitie (optioneel)</label>
            <input type="text" value={form.note} onChange={(e) => setForm(f => ({ ...f, note: e.target.value }))} placeholder="Bijv. artikel hernoemd op 21-8" className={input} />
          </div>
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" checked={form.permanent} onChange={(e) => setForm(f => ({ ...f, permanent: e.target.checked }))} className="rounded" />
              Blijvend (301)
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" checked={form.active} onChange={(e) => setForm(f => ({ ...f, active: e.target.checked }))} className="rounded" />
              Actief
            </label>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-3">
            <button onClick={save} disabled={saving} className="flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50">
              <Save size={15} /> {saving ? "Opslaan..." : "Opslaan"}
            </button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2.5 bg-gray-100 text-gray-600 rounded-lg text-sm hover:bg-gray-200">Annuleer</button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {rows === undefined ? (
          <p className="p-5 text-sm text-gray-400">Laden...</p>
        ) : rows.length === 0 ? (
          <p className="p-5 text-sm text-gray-400">Nog geen redirects. Voeg er een toe met de knop rechtsboven.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
              <tr>
                <th className="text-left px-4 py-2 font-medium">Van</th>
                <th className="text-left px-4 py-2 font-medium">Naar</th>
                <th className="text-left px-4 py-2 font-medium">Type</th>
                <th className="text-left px-4 py-2 font-medium">Status</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r: any) => (
                <tr key={r._id} className="border-t border-gray-100">
                  <td className="px-4 py-2.5 font-mono text-gray-800 break-all">{r.from}</td>
                  <td className="px-4 py-2.5 font-mono text-gray-600 break-all">
                    <span className="inline-flex items-center gap-1"><ArrowRight size={12} className="text-gray-300 flex-shrink-0" />{r.to}</span>
                  </td>
                  <td className="px-4 py-2.5">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${r.permanent ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"}`}>{r.permanent ? "301" : "302"}</span>
                  </td>
                  <td className="px-4 py-2.5">
                    <button onClick={() => toggle({ id: r._id, active: !r.active })} className={`text-xs px-2 py-0.5 rounded-full ${r.active ? "bg-primary-50 text-primary-700" : "bg-gray-100 text-gray-500"}`}>
                      {r.active ? "Actief" : "Uit"}
                    </button>
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => openEdit(r)} className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded"><Edit size={15} /></button>
                      <button onClick={() => del(r._id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"><Trash2 size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
