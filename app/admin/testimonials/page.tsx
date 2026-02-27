"use client";

import { useState } from "react";
import { useAdminQuery, useAdminMutation } from "../AdminAuthContext";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Star, Plus, Edit, Trash2, Save, X, Quote } from "lucide-react";

function StarPicker({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          onClick={() => onChange(i)}
          className="p-0.5 transition-transform hover:scale-110"
        >
          <Star
            size={20}
            fill={i <= value ? "#d4a84b" : "none"}
            stroke={i <= value ? "#d4a84b" : "#9ca3af"}
          />
        </button>
      ))}
    </div>
  );
}

export default function AdminTestimonialsPage() {
  const items = useAdminQuery(api.testimonials.list, {});
  const createItem = useAdminMutation(api.testimonials.create);
  const updateItem = useAdminMutation(api.testimonials.update);
  const removeItem = useAdminMutation(api.testimonials.remove);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<Id<"testimonials"> | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", quote: "", stars: 5, order: 0 });

  const resetForm = () => {
    setForm({ name: "", quote: "", stars: 5, order: items?.length ?? 0 });
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
        await createItem({ ...form, order: items?.length ?? 0 });
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
          Beheer de reviews die zichtbaar zijn op de homepage. Alleen actieve reviews worden getoond.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-primary-200 p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-semibold text-primary-900">Reviews</h2>
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
          <div className="mb-6 p-4 rounded-xl bg-primary-50 border border-primary-200 space-y-4">
            <h3 className="font-medium text-primary-900">
              {editingId ? "Bewerken" : "Nieuwe review"}
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Naam</label>
                <input
                  type="text"
                  placeholder="bijv. Anne of Thomas, 34"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-primary-200 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Review</label>
                <textarea
                  placeholder="Wat zei deze persoon over Benji?"
                  value={form.quote}
                  onChange={(e) => setForm((f) => ({ ...f, quote: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-primary-200 rounded-lg text-sm resize-none"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-2">Beoordeling</label>
                <StarPicker value={form.stars} onChange={(n) => setForm((f) => ({ ...f, stars: n }))} />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleSave}
                disabled={saving || !form.name.trim() || !form.quote.trim()}
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50"
              >
                <Save size={16} />
                {saving ? "Opslaan…" : "Opslaan"}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="inline-flex items-center gap-2 px-4 py-2 border border-primary-200 rounded-lg text-sm font-medium hover:bg-primary-50"
              >
                <X size={16} />
                Annuleren
              </button>
            </div>
          </div>
        )}

        {items === undefined ? (
          <div className="py-8 text-center text-primary-600">Laden…</div>
        ) : items.length === 0 ? (
          <p className="text-sm text-gray-500 py-4">Nog geen reviews. Voeg er een toe.</p>
        ) : (
          <ul className="space-y-3">
            {items.map((item: any) => (
              <li
                key={item._id}
                className={`p-4 rounded-lg border transition-colors ${
                  item.isActive
                    ? "border-primary-200 bg-white"
                    : "border-gray-200 bg-gray-50 opacity-60"
                }`}
              >
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <Star
                            key={i}
                            size={13}
                            fill={i <= item.stars ? "#d4a84b" : "none"}
                            stroke={i <= item.stars ? "#d4a84b" : "#d1d5db"}
                          />
                        ))}
                      </div>
                      <span className="text-sm font-medium text-primary-900">— {item.name}</span>
                      {!item.isActive && (
                        <span className="text-xs px-1.5 py-0.5 rounded bg-gray-200 text-gray-500">Verborgen</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-2">&ldquo;{item.quote}&rdquo;</p>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => toggleActive(item)}
                      title={item.isActive ? "Verbergen" : "Activeren"}
                      className={`px-2 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        item.isActive
                          ? "text-gray-500 hover:bg-gray-100 border border-gray-200"
                          : "text-green-700 hover:bg-green-50 border border-green-200"
                      }`}
                    >
                      {item.isActive ? "Verberg" : "Activeer"}
                    </button>
                    <button
                      type="button"
                      onClick={() => startEdit(item)}
                      className="p-1.5 text-primary-600 hover:bg-primary-100 rounded-lg"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        if (confirm("Review verwijderen?")) await removeItem({ id: item._id });
                      }}
                      className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Preview */}
      {items && items.filter((i: any) => i.isActive).length > 0 && (
        <div className="bg-white rounded-xl border border-primary-200 p-6">
          <h2 className="font-semibold text-primary-900 mb-3">Preview (zoals op homepage)</h2>
          <div className="flex gap-2.5 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
            {items.filter((i: any) => i.isActive).map((item: any) => (
              <div
                key={item._id}
                className="flex-shrink-0 w-48 bg-primary-50 rounded-xl px-3.5 py-3 flex flex-col gap-2 border border-primary-100"
              >
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star key={i} size={11} fill={i <= item.stars ? "#d4a84b" : "none"} stroke={i <= item.stars ? "#d4a84b" : "#d1d5db"} />
                  ))}
                </div>
                <p className="text-[11px] leading-relaxed text-gray-700 line-clamp-4">&ldquo;{item.quote}&rdquo;</p>
                <p className="text-[10px] text-gray-500 font-medium mt-auto">— {item.name}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
