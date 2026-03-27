"use client";

import { useState } from "react";
import { useAdminQuery, useAdminMutation } from "../AdminAuthContext";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Layers, Plus, Edit, Trash2, Save, X, ExternalLink } from "lucide-react";

type FormState = {
  slug: string;
  title: string;
  metaDescription: string;
  content: string;
  isLive: boolean;
};

const EMPTY: FormState = { slug: "", title: "", metaDescription: "", content: "", isLive: false };

function slugify(t: string) {
  return t.toLowerCase().replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-").slice(0, 80);
}

export default function AdminPillarsPage() {
  const pillars = useAdminQuery(api.pillars.list, {});
  const createPillar = useAdminMutation(api.pillars.create);
  const updatePillar = useAdminMutation(api.pillars.update);
  const removePillar = useAdminMutation(api.pillars.remove);
  const seedPillars = useAdminMutation(api.pillars.seedPillars);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<Id<"pillars"> | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY);

  const inputClass = "w-full px-3 py-2 border border-primary-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-400";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1";
  const labelSmClass = "block text-xs text-gray-500 mb-1";

  const set = (f: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((s) => ({ ...s, [f]: e.target.value }));

  const reset = () => { setForm(EMPTY); setEditingId(null); setShowForm(false); };

  const startEdit = (p: any) => {
    setForm({ slug: p.slug, title: p.title, metaDescription: p.metaDescription ?? "", content: p.content ?? "", isLive: p.isLive });
    setEditingId(p._id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSave = async () => {
    if (!form.slug.trim() || !form.title.trim()) return;
    setSaving(true);
    try {
      const payload = {
        slug: form.slug.trim(),
        title: form.title.trim(),
        metaDescription: form.metaDescription.trim() || undefined,
        content: form.content.trim() || undefined,
        isLive: form.isLive,
      };
      if (editingId) await updatePillar({ id: editingId, ...payload });
      else await createPillar(payload);
      reset();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-primary-900 flex items-center gap-2">
          <Layers size={28} className="text-primary-600" />
          Pillar pagina's
        </h1>
        <p className="text-sm text-primary-700 mt-1">
          Thematische pagina's (laag 2) — artikelen koppel je vanuit de blog editor.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-primary-200 p-6">
        <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
          <h2 className="font-semibold text-primary-900">
            {showForm ? (editingId ? "Pillar bewerken" : "Nieuwe pillar") : "Pillars"}
          </h2>
          {!showForm && (
            <div className="flex gap-2">
              <button type="button" onClick={() => seedPillars()}
                className="px-3 py-2 border border-primary-300 text-primary-700 rounded-lg text-sm hover:bg-primary-50">
                Standaard pillars aanmaken
              </button>
              <button type="button" onClick={() => { reset(); setShowForm(true); }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700">
                <Plus size={18} /> Nieuwe pillar
              </button>
            </div>
          )}
        </div>

        {showForm && (
          <div className="space-y-4 mb-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Titel *</label>
                <input type="text" placeholder="Rouw & Verdriet" value={form.title}
                  onChange={(e) => setForm((s) => ({ ...s, title: e.target.value, slug: s.slug || slugify(e.target.value) }))}
                  className={inputClass} />
              </div>
              <div>
                <label className={labelSmClass}>Slug (URL: /thema/slug)</label>
                <input type="text" value={form.slug} onChange={set("slug")} className={inputClass} />
              </div>
            </div>

            <div>
              <label className={labelSmClass}>Meta description (SEO — max 155 tekens)</label>
              <input type="text" placeholder="Alles over rouw en verdriet…" value={form.metaDescription}
                onChange={set("metaDescription")} maxLength={155} className={inputClass} />
              <p className="text-xs text-gray-400 mt-0.5">{form.metaDescription.length}/155</p>
            </div>

            <div>
              <label className={labelSmClass}>
                Inhoud <span className="text-gray-400">— nog niet verplicht, later in te vullen</span>
              </label>
              <textarea placeholder="Schrijf hier de pillar content (later toe te voegen)…"
                value={form.content} onChange={set("content")} rows={8} className={inputClass} />
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.isLive}
                onChange={(e) => setForm((s) => ({ ...s, isLive: e.target.checked }))}
                className="rounded border-primary-300 text-primary-600" />
              <span className="text-sm text-gray-700">Live (publiek zichtbaar)</span>
            </label>

            <div className="flex gap-2 pt-2">
              <button type="button" onClick={handleSave} disabled={saving || !form.slug.trim() || !form.title.trim()}
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50">
                <Save size={18} />
                {saving ? "Bezig…" : "Opslaan"}
              </button>
              <button type="button" onClick={reset}
                className="inline-flex items-center gap-2 px-4 py-2 border border-primary-200 rounded-lg text-sm font-medium hover:bg-primary-50">
                <X size={18} /> Annuleren
              </button>
            </div>
          </div>
        )}

        {!showForm && (
          <>
            {pillars === undefined ? (
              <div className="py-8 text-center text-primary-600">Laden…</div>
            ) : pillars.length === 0 ? (
              <p className="text-sm text-gray-500 py-4">Nog geen pillars. Klik op "Standaard pillars aanmaken".</p>
            ) : (
              <ul className="space-y-3">
                {pillars.map((p: any) => (
                  <li key={p._id} className="p-4 rounded-lg border border-primary-200 bg-white hover:bg-primary-50/50">
                    <div className="flex justify-between items-center gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${p.isLive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}`}>
                            {p.isLive ? "Live" : "Concept"}
                          </span>
                          <code className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">/thema/{p.slug}</code>
                          {!p.content && <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">Content nog toe te voegen</span>}
                        </div>
                        <h3 className="font-medium text-primary-900">{p.title}</h3>
                        {p.metaDescription && <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{p.metaDescription}</p>}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {p.isLive && (
                          <a href={`/thema/${p.slug}`} target="_blank" rel="noopener noreferrer"
                            className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg">
                            <ExternalLink size={17} />
                          </a>
                        )}
                        <button type="button" onClick={() => startEdit(p)}
                          className="p-2 text-primary-600 hover:bg-primary-100 rounded-lg">
                          <Edit size={17} />
                        </button>
                        <button type="button" onClick={() => { if (confirm("Pillar verwijderen?")) removePillar({ id: p._id }); }}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                          <Trash2 size={17} />
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>
    </div>
  );
}
