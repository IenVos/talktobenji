"use client";

import { useState } from "react";
import { useAdminQuery, useAdminMutation } from "../AdminAuthContext";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Star, Plus, Edit, Trash2, Save, X, Quote, Check, Ban } from "lucide-react";

function StarPicker({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <button key={i} type="button" onClick={() => onChange(i)} className="p-0.5 transition-transform hover:scale-110">
          <Star size={20} fill={i <= value ? "#c9972c" : "none"} stroke={i <= value ? "#c9972c" : "#9ca3af"} />
        </button>
      ))}
    </div>
  );
}

function StarRow({ count }: { count: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} size={13} fill={i <= count ? "#c9972c" : "none"} stroke={i <= count ? "#c9972c" : "#d1d5db"} />
      ))}
    </div>
  );
}

export default function AdminTestimonialsPage() {
  const items = useAdminQuery(api.testimonials.list, {});
  const createItem = useAdminMutation(api.testimonials.create);
  const updateItem = useAdminMutation(api.testimonials.update);
  const approveItem = useAdminMutation(api.testimonials.approve);
  const rejectItem = useAdminMutation(api.testimonials.reject);
  const removeItem = useAdminMutation(api.testimonials.remove);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<Id<"testimonials"> | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", quote: "", stars: 5, order: 0 });

  const pending = items?.filter((i: any) => i.status === "pending") ?? [];
  const active = items?.filter((i: any) => i.isActive && i.status !== "pending") ?? [];
  const rejected = items?.filter((i: any) => i.status === "rejected") ?? [];

  const resetForm = () => {
    setForm({ name: "", quote: "", stars: 5, order: active.length });
    setEditingId(null);
    setShowForm(false);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.quote.trim()) return;
    setSaving(true);
    try {
      if (editingId) {
        await updateItem({ id: editingId, ...form });
      } else {
        await createItem({ ...form, order: active.length });
      }
      resetForm();
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (item: any) => {
    setForm({ name: item.name, quote: item.quote, stars: item.stars, order: item.order });
    setEditingId(item._id);
    setShowForm(true);
  };

  const toggleActive = async (item: any) => {
    await updateItem({ id: item._id, isActive: !item.isActive });
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-primary-900 flex items-center gap-2">
          <Quote size={28} className="text-primary-600" />
          Reviews &amp; Testimonials
        </h1>
        <p className="text-sm text-primary-700 mt-1">
          Klanten kunnen reviews indienen — keur ze goed voor ze zichtbaar worden.
        </p>
      </div>

      {/* Wachten op goedkeuring */}
      {pending.length > 0 && (
        <div className="bg-amber-50 rounded-xl border border-amber-200 p-5">
          <h2 className="font-semibold text-amber-900 mb-3 flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber-500 text-white text-xs font-bold">{pending.length}</span>
            Wachten op goedkeuring
          </h2>
          <ul className="space-y-3">
            {pending.map((item: any) => (
              <li key={item._id} className="bg-white rounded-lg p-3 border border-amber-100">
                <div className="flex justify-between items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <StarRow count={item.stars} />
                      <span className="text-sm font-medium text-gray-800">— {item.name}</span>
                    </div>
                    <p className="text-sm text-gray-700 leading-relaxed">&ldquo;{item.quote}&rdquo;</p>
                  </div>
                  <div className="flex gap-1.5 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => approveItem({ id: item._id })}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700"
                    >
                      <Check size={13} /> Goedkeuren
                    </button>
                    <button
                      type="button"
                      onClick={() => rejectItem({ id: item._id })}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-gray-200 text-gray-700 rounded-lg text-xs font-medium hover:bg-red-100 hover:text-red-700"
                    >
                      <Ban size={13} /> Afwijzen
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Actieve reviews */}
      <div className="bg-white rounded-xl border border-primary-200 p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-semibold text-primary-900">Actieve reviews</h2>
          <button
            type="button"
            onClick={() => { resetForm(); setShowForm(true); }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700"
          >
            <Plus size={18} />
            Toevoegen
          </button>
        </div>

        {showForm && (
          <div className="mb-6 p-4 rounded-xl bg-primary-50 border border-primary-200 space-y-3">
            <h3 className="font-medium text-primary-900">{editingId ? "Bewerken" : "Nieuwe review"}</h3>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Naam</label>
              <input type="text" placeholder="bijv. Anne of Thomas, 34" value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="w-full px-3 py-2 border border-primary-200 rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Review</label>
              <textarea placeholder="Wat zei deze persoon over Benji?" value={form.quote}
                onChange={(e) => setForm((f) => ({ ...f, quote: e.target.value }))}
                rows={3} className="w-full px-3 py-2 border border-primary-200 rounded-lg text-sm resize-none" />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-2">Beoordeling</label>
              <StarPicker value={form.stars} onChange={(n) => setForm((f) => ({ ...f, stars: n }))} />
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={handleSave} disabled={saving || !form.name.trim() || !form.quote.trim()}
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50">
                <Save size={16} />{saving ? "Opslaan…" : "Opslaan"}
              </button>
              <button type="button" onClick={resetForm}
                className="inline-flex items-center gap-2 px-4 py-2 border border-primary-200 rounded-lg text-sm font-medium hover:bg-primary-50">
                <X size={16} />Annuleren
              </button>
            </div>
          </div>
        )}

        {items === undefined ? (
          <div className="py-8 text-center text-primary-600">Laden…</div>
        ) : active.length === 0 ? (
          <p className="text-sm text-gray-500 py-4">Nog geen actieve reviews.</p>
        ) : (
          <ul className="space-y-3">
            {active.map((item: any) => (
              <li key={item._id} className={`p-4 rounded-lg border transition-colors ${item.isActive ? "border-primary-200 bg-white" : "border-gray-200 bg-gray-50 opacity-60"}`}>
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <StarRow count={item.stars} />
                      <span className="text-sm font-medium text-primary-900">— {item.name}</span>
                      {!item.isActive && <span className="text-xs px-1.5 py-0.5 rounded bg-gray-200 text-gray-500">Verborgen</span>}
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-2">&ldquo;{item.quote}&rdquo;</p>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <button type="button" onClick={() => toggleActive(item)} title={item.isActive ? "Verbergen" : "Activeren"}
                      className={`px-2 py-1.5 rounded-lg text-xs font-medium transition-colors ${item.isActive ? "text-gray-500 hover:bg-gray-100 border border-gray-200" : "text-green-700 hover:bg-green-50 border border-green-200"}`}>
                      {item.isActive ? "Verberg" : "Activeer"}
                    </button>
                    <button type="button" onClick={() => startEdit(item)} className="p-1.5 text-primary-600 hover:bg-primary-100 rounded-lg">
                      <Edit size={16} />
                    </button>
                    <button type="button" onClick={async () => { if (confirm("Review verwijderen?")) await removeItem({ id: item._id }); }}
                      className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Afgewezen reviews */}
      {rejected.length > 0 && (
        <div className="bg-gray-50 rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-600 mb-3 text-sm">Afgewezen ({rejected.length})</h2>
          <ul className="space-y-2">
            {rejected.map((item: any) => (
              <li key={item._id} className="flex items-start justify-between gap-3 text-sm text-gray-500">
                <span className="line-clamp-1">&ldquo;{item.quote}&rdquo; — {item.name}</span>
                <button type="button" onClick={async () => { if (confirm("Definitief verwijderen?")) await removeItem({ id: item._id }); }}
                  className="text-red-400 hover:text-red-600 flex-shrink-0">
                  <Trash2 size={14} />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Preview */}
      {active.filter((i: any) => i.isActive).length > 0 && (
        <div className="bg-white rounded-xl border border-primary-200 p-6">
          <h2 className="font-semibold text-primary-900 mb-3">Preview (homepage — 3 zichtbaar)</h2>
          <div className="grid grid-cols-3 gap-1.5 max-w-sm">
            {active.filter((i: any) => i.isActive).slice(0, 3).map((item: any) => (
              <div key={item._id} className="bg-primary-50 rounded-lg px-2 py-2 flex flex-col gap-1 border border-primary-100">
                <div className="flex gap-px">
                  {[1,2,3,4,5].map(i => <Star key={i} size={9} fill={i <= item.stars ? "#c9972c" : "none"} stroke={i <= item.stars ? "#c9972c" : "#d1d5db"} />)}
                </div>
                <p className="text-[9px] leading-relaxed text-gray-700 line-clamp-2">&ldquo;{item.quote}&rdquo;</p>
                <p className="text-[9px] text-gray-500 font-medium truncate">— {item.name}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
