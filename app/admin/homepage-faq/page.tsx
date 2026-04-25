"use client";

import { useState } from "react";
import { useAdminQuery, useAdminMutation } from "../AdminAuthContext";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { HelpCircle, Plus, Save, X, Trash2, Edit, ExternalLink } from "lucide-react";

type FaqItem = {
  _id: Id<"homepageFaq">;
  vraag: string;
  antwoord: string;
  linkTekst?: string;
  linkHref?: string;
  volgorde: number;
  isActief: boolean;
};

const EMPTY_FORM = {
  vraag: "",
  antwoord: "",
  linkTekst: "",
  linkHref: "",
  volgorde: 10,
  isActief: true,
};

export default function HomepageFaqPage() {
  const items = useAdminQuery(api.homepageFaq.list, {});
  const createItem = useAdminMutation(api.homepageFaq.create);
  const updateItem = useAdminMutation(api.homepageFaq.update);
  const removeItem = useAdminMutation(api.homepageFaq.remove);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<Id<"homepageFaq"> | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const inputClass = "w-full px-3 py-2 border border-primary-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-400";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1";

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setShowForm(false);
  };

  const startEdit = (item: FaqItem) => {
    setForm({
      vraag: item.vraag,
      antwoord: item.antwoord,
      linkTekst: item.linkTekst ?? "",
      linkHref: item.linkHref ?? "",
      volgorde: item.volgorde,
      isActief: item.isActief,
    });
    setEditingId(item._id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSave = async () => {
    if (!form.vraag.trim() || !form.antwoord.trim()) return;
    setSaving(true);
    try {
      const payload = {
        vraag: form.vraag.trim(),
        antwoord: form.antwoord.trim(),
        linkTekst: form.linkTekst.trim() || undefined,
        linkHref: form.linkHref.trim() || undefined,
        volgorde: form.volgorde,
        isActief: form.isActief,
      };
      if (editingId) {
        await updateItem({ id: editingId, ...payload });
      } else {
        await createItem(payload);
      }
      resetForm();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: Id<"homepageFaq">) => {
    if (!confirm("Weet je zeker dat je deze FAQ-vraag wilt verwijderen?")) return;
    await removeItem({ id });
  };

  const canSave = form.vraag.trim() && form.antwoord.trim();

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-primary-900 flex items-center gap-2">
          <HelpCircle size={28} className="text-primary-600" />
          Homepage FAQ
        </h1>
        <p className="text-sm text-primary-700 mt-1 flex items-center gap-2">
          Veelgestelde vragen op de homepagina.{" "}
          <a href="/#faq" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-primary-600 hover:underline">
            <ExternalLink size={13} /> Bekijk op site
          </a>
        </p>
      </div>

      <div className="bg-white rounded-xl border border-primary-200 p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-semibold text-primary-900">
            {showForm ? (editingId ? "Vraag bewerken" : "Nieuwe vraag") : "Vragen"}
          </h2>
          {!showForm && (
            <button
              type="button"
              onClick={() => { resetForm(); setShowForm(true); }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700"
            >
              <Plus size={18} /> Nieuwe vraag
            </button>
          )}
        </div>

        {showForm && (
          <div className="space-y-4 mb-6">
            <div>
              <label className={labelClass}>Vraag *</label>
              <input
                type="text"
                value={form.vraag}
                onChange={(e) => setForm((f) => ({ ...f, vraag: e.target.value }))}
                placeholder="Kost praten met Benji geld?"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Antwoord *</label>
              <textarea
                value={form.antwoord}
                onChange={(e) => setForm((f) => ({ ...f, antwoord: e.target.value }))}
                placeholder="Het antwoord op de vraag…"
                rows={4}
                className={inputClass}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Linktekst (optioneel)</label>
                <input
                  type="text"
                  value={form.linkTekst}
                  onChange={(e) => setForm((f) => ({ ...f, linkTekst: e.target.value }))}
                  placeholder="Bekijk wat er allemaal bij zit"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Link URL (optioneel)</label>
                <input
                  type="text"
                  value={form.linkHref}
                  onChange={(e) => setForm((f) => ({ ...f, linkHref: e.target.value }))}
                  placeholder="/lp/jaar-toegang"
                  className={inputClass}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Volgorde</label>
                <input
                  type="number"
                  value={form.volgorde}
                  onChange={(e) => setForm((f) => ({ ...f, volgorde: parseInt(e.target.value) || 10 }))}
                  className={inputClass}
                />
              </div>
              <div className="flex items-end pb-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.isActief}
                    onChange={(e) => setForm((f) => ({ ...f, isActief: e.target.checked }))}
                    className="rounded border-primary-300 text-primary-600"
                  />
                  <span className="text-sm text-gray-700">Zichtbaar op site</span>
                </label>
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={handleSave}
                disabled={saving || !canSave}
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50"
              >
                <Save size={18} />
                {saving ? "Bezig…" : "Opslaan"}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="inline-flex items-center gap-2 px-4 py-2 border border-primary-200 rounded-lg text-sm font-medium hover:bg-primary-50"
              >
                <X size={18} /> Annuleren
              </button>
            </div>
          </div>
        )}

        {!showForm && (
          <>
            {items === undefined ? (
              <p className="text-sm text-gray-400 py-4">Laden…</p>
            ) : items.length === 0 ? (
              <div className="py-8 text-center text-gray-400 text-sm">
                <p>Nog geen FAQ-vragen. Voeg de eerste toe.</p>
                <p className="mt-1 text-xs text-gray-300">De hardcoded vragen op de site zijn de fallback zolang er niets in de admin staat.</p>
              </div>
            ) : (
              <ul className="space-y-2">
                {items.map((item: FaqItem) => (
                  <li key={item._id} className="p-4 rounded-lg border border-primary-100 bg-white hover:bg-primary-50/40">
                    <div className="flex justify-between items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${item.isActief ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-500"}`}>
                            {item.isActief ? "Zichtbaar" : "Verborgen"}
                          </span>
                          <span className="text-xs text-gray-400">#{item.volgorde}</span>
                        </div>
                        <p className="font-medium text-primary-900 text-sm">{item.vraag}</p>
                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{item.antwoord}</p>
                        {item.linkTekst && (
                          <p className="text-xs text-primary-500 mt-0.5">↗ {item.linkTekst}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => startEdit(item)}
                          className="p-2 text-primary-600 hover:bg-primary-100 rounded-lg"
                          title="Bewerken"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(item._id)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                          title="Verwijderen"
                        >
                          <Trash2 size={16} />
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
