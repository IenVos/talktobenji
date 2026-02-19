"use client";

import { useState } from "react";
import { useAdminQuery, useAdminMutation } from "../AdminAuthContext";
import { api } from "@/convex/_generated/api";
import type { Id, Doc } from "@/convex/_generated/dataModel";
import { HelpCircle, Plus, Trash2, Save, X, Sprout, ChevronDown, ChevronUp } from "lucide-react";

const CATEGORIES = [
  { key: "account", label: "Account" },
  { key: "abonnement", label: "Abonnement" },
  { key: "gebruik", label: "Gebruik" },
  { key: "technisch", label: "Technisch" },
  { key: "privacy", label: "Privacy & gegevens" },
] as const;

type Category = (typeof CATEGORIES)[number]["key"];

const EMPTY_FORM = {
  question: "",
  answer: "",
  category: "account" as Category,
  order: 10,
  isActive: true,
};

type FormState = typeof EMPTY_FORM;

function InlineEditForm({
  form,
  setForm,
  onSave,
  onCancel,
  saving,
  isNew,
}: {
  form: FormState;
  setForm: (f: FormState) => void;
  onSave: () => void;
  onCancel: () => void;
  saving: boolean;
  isNew: boolean;
}) {
  return (
    <div className="p-4 bg-primary-50 border-t border-primary-100 space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Categorie</label>
          <select
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value as Category })}
            className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none bg-white"
          >
            {CATEGORIES.map((c) => (
              <option key={c.key} value={c.key}>{c.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Volgorde</label>
          <input
            type="number"
            value={form.order}
            onChange={(e) => setForm({ ...form, order: Number(e.target.value) })}
            className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none bg-white"
          />
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Vraag</label>
        <input
          type="text"
          value={form.question}
          onChange={(e) => setForm({ ...form, question: e.target.value })}
          placeholder="Hoe maak ik een account aan?"
          className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none bg-white"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">
          Antwoord
          <span className="ml-1 font-normal text-gray-400">(gebruik [tekst](url) voor links)</span>
        </label>
        <textarea
          value={form.answer}
          onChange={(e) => setForm({ ...form, answer: e.target.value })}
          placeholder="Uitleg voor de klant..."
          rows={4}
          className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none resize-none bg-white"
        />
      </div>
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
          <input
            type="checkbox"
            checked={form.isActive}
            onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
            className="rounded border-gray-300 text-primary-600"
          />
          Zichtbaar op support pagina
        </label>
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="px-3 py-1.5 border border-gray-200 text-gray-600 rounded-lg text-sm hover:bg-white transition-colors"
          >
            Annuleren
          </button>
          <button
            onClick={onSave}
            disabled={saving || !form.question.trim() || !form.answer.trim()}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50 transition-colors"
          >
            <Save size={13} />
            {saving ? "Opslaan..." : isNew ? "Toevoegen" : "Opslaan"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminSupportFaqPage() {
  const items = useAdminQuery(api.supportFaq.listAll, {}) as Doc<"supportFaq">[] | undefined;
  const upsertFaq = useAdminMutation(api.supportFaq.upsertFaq);
  const deleteFaq = useAdminMutation(api.supportFaq.deleteFaq);
  const seedFaq = useAdminMutation(api.supportFaq.seedFaq);
  const updateAnswers = useAdminMutation(api.supportFaq.updateAnswers);

  const [editingId, setEditingId] = useState<Id<"supportFaq"> | null>(null);
  const [editForm, setEditForm] = useState(EMPTY_FORM);
  const [showNewForm, setShowNewForm] = useState(false);
  const [newForm, setNewForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [savingNew, setSavingNew] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<Category | "all">("all");
  const [collapsedCats, setCollapsedCats] = useState<Set<string>>(new Set());

  const filtered: Doc<"supportFaq">[] = items
    ? filterCategory === "all"
      ? items
      : items.filter((i) => i.category === filterCategory)
    : [];

  const grouped = CATEGORIES.reduce<Record<string, Doc<"supportFaq">[]>>((acc, cat) => {
    acc[cat.key] = filtered.filter((i) => i.category === cat.key);
    return acc;
  }, {} as Record<string, Doc<"supportFaq">[]>);

  const startEdit = (item: Doc<"supportFaq">) => {
    setEditingId(item._id);
    setEditForm({
      question: item.question,
      answer: item.answer,
      category: item.category as Category,
      order: item.order,
      isActive: item.isActive,
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const saveEdit = async () => {
    if (!editForm.question.trim() || !editForm.answer.trim() || !editingId) return;
    setSaving(true);
    try {
      await upsertFaq({
        id: editingId,
        question: editForm.question.trim(),
        answer: editForm.answer.trim(),
        category: editForm.category,
        order: editForm.order,
        isActive: editForm.isActive,
      });
      setEditingId(null);
    } finally {
      setSaving(false);
    }
  };

  const saveNew = async () => {
    if (!newForm.question.trim() || !newForm.answer.trim()) return;
    setSavingNew(true);
    try {
      await upsertFaq({
        question: newForm.question.trim(),
        answer: newForm.answer.trim(),
        category: newForm.category,
        order: newForm.order,
        isActive: newForm.isActive,
      });
      setShowNewForm(false);
      setNewForm(EMPTY_FORM);
    } finally {
      setSavingNew(false);
    }
  };

  const handleDelete = async (id: Id<"supportFaq">) => {
    if (!confirm("Weet je zeker dat je dit FAQ-item wilt verwijderen?")) return;
    await deleteFaq({ id });
  };

  const handleSeed = async () => {
    setSeeding(true);
    setMessage(null);
    try {
      const result = await seedFaq({});
      setMessage(result.seeded ? `${result.count} vragen toegevoegd.` : "Tabel was al gevuld — klik 'Antwoorden bijwerken' om links toe te voegen.");
    } finally {
      setSeeding(false);
    }
  };

  const handleUpdateAnswers = async () => {
    setUpdating(true);
    setMessage(null);
    try {
      const result = await updateAnswers({});
      setMessage(`${result.updated} antwoorden bijgewerkt met links.`);
    } finally {
      setUpdating(false);
    }
  };

  const toggleCat = (key: string) => {
    setCollapsedCats((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  return (
    <div className="max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary-100 rounded-lg">
            <HelpCircle size={24} className="text-primary-700" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Support FAQ</h1>
            <p className="text-sm text-gray-500">Beheer veelgestelde vragen op de support pagina</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!items || items.length === 0 ? (
            <button onClick={handleSeed} disabled={seeding} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition-colors">
              <Sprout size={16} />
              {seeding ? "Bezig..." : "Standaard vragen laden"}
            </button>
          ) : (
            <button onClick={handleUpdateAnswers} disabled={updating} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors">
              {updating ? "Bijwerken..." : "Antwoorden bijwerken"}
            </button>
          )}
          <button
            onClick={() => { setShowNewForm((v) => !v); setNewForm(EMPTY_FORM); }}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
          >
            <Plus size={16} />
            Nieuwe vraag
          </button>
        </div>
      </div>

      {message && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
          {message}
        </div>
      )}

      {/* Nieuw vraag formulier */}
      {showNewForm && (
        <div className="bg-white rounded-xl border border-primary-200 shadow-sm overflow-hidden">
          <div className="px-4 py-3 bg-primary-600 flex items-center justify-between">
            <span className="text-sm font-semibold text-white">Nieuwe vraag toevoegen</span>
            <button onClick={() => setShowNewForm(false)} className="text-white/70 hover:text-white">
              <X size={18} />
            </button>
          </div>
          <InlineEditForm
            form={newForm}
            setForm={setNewForm}
            onSave={saveNew}
            onCancel={() => setShowNewForm(false)}
            saving={savingNew}
            isNew
          />
        </div>
      )}

      {/* Filter */}
      {items && items.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilterCategory("all")}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filterCategory === "all" ? "bg-primary-600 text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"}`}
          >
            Alles ({items.length})
          </button>
          {CATEGORIES.map((cat) => {
            const count = items.filter((i) => i.category === cat.key).length;
            if (count === 0) return null;
            return (
              <button
                key={cat.key}
                onClick={() => setFilterCategory(cat.key)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filterCategory === cat.key ? "bg-primary-600 text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"}`}
              >
                {cat.label} ({count})
              </button>
            );
          })}
        </div>
      )}

      {/* Lijst */}
      {items === undefined ? (
        <div className="text-center py-12 text-gray-400">Laden...</div>
      ) : items.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
          <HelpCircle size={40} className="text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">Nog geen FAQ vragen</p>
          <p className="text-sm text-gray-400 mt-1">Klik op &quot;Standaard vragen laden&quot; om te starten.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {CATEGORIES.map((cat) => {
            const catItems = grouped[cat.key];
            if (!catItems || catItems.length === 0) return null;
            const isCollapsed = collapsedCats.has(cat.key);
            return (
              <div key={cat.key} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <button
                  onClick={() => toggleCat(cat.key)}
                  className="w-full flex items-center justify-between px-5 py-3 bg-gray-50 border-b border-gray-200 hover:bg-gray-100 transition-colors"
                >
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {cat.label}
                    <span className="ml-2 font-normal text-gray-400 normal-case tracking-normal">({catItems.length})</span>
                  </span>
                  {isCollapsed ? <ChevronDown size={15} className="text-gray-400" /> : <ChevronUp size={15} className="text-gray-400" />}
                </button>

                {!isCollapsed && (
                  <ul className="divide-y divide-gray-100">
                    {catItems
                      .slice()
                      .sort((a, b) => a.order - b.order)
                      .map((item) => (
                        <li key={item._id}>
                          {editingId === item._id ? (
                            <InlineEditForm
                              form={editForm}
                              setForm={setEditForm}
                              onSave={saveEdit}
                              onCancel={cancelEdit}
                              saving={saving}
                              isNew={false}
                            />
                          ) : (
                            <div className="flex items-start gap-4 px-5 py-4 hover:bg-gray-50 group">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-sm font-medium text-gray-800">{item.question}</span>
                                  {!item.isActive && (
                                    <span className="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-400 rounded">Verborgen</span>
                                  )}
                                  <span className="text-xs text-gray-300">#{item.order}</span>
                                </div>
                                <p className="text-xs text-gray-500 line-clamp-2 whitespace-pre-line">{item.answer}</p>
                              </div>
                              <div className="flex gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={() => startEdit(item)}
                                  className="px-2.5 py-1.5 text-xs text-gray-600 bg-gray-100 hover:bg-primary-100 hover:text-primary-700 rounded transition-colors font-medium"
                                >
                                  Bewerken
                                </button>
                                <button
                                  onClick={() => handleDelete(item._id)}
                                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                  title="Verwijderen"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </div>
                          )}
                        </li>
                      ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
