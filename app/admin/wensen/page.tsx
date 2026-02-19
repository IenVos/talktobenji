"use client";

import { useEffect, useState } from "react";
import { ThumbsUp, Plus, Pencil, Trash2, Check, X, ChevronUp, ChevronDown } from "lucide-react";
import { ICON_OPTIONS, getIcon } from "@/lib/iconRegistry";

const SECTIONS = [
  { value: "herinneringen", label: "Memories" },
  { value: "inspiratie", label: "Inspiratie & troost" },
  { value: "handreikingen", label: "Handreikingen" },
  { value: "checkins", label: "Dagelijkse check-ins" },
  { value: "account", label: "Mijn plek (hoofdpagina)" },
];

const SECTION_LABEL: Record<string, string> = Object.fromEntries(
  SECTIONS.map((s) => [s.value, s.label])
);

const DEFAULT_FEATURES = [
  { featureId: "herinneringenboekje", iconName: "BookOpen", title: "Jouw herinneringenboekje", description: "Zet jouw mooiste herinneringen om in een persoonlijk boekje dat je kunt downloaden en bewaren.", section: "herinneringen", order: 1, isActive: true },
  { featureId: "seizoensgidsen", iconName: "Leaf", title: "Seizoensgidsen", description: "Een persoonlijk boekje voor bijzondere momenten in het jaar — zoals de feestdagen of de eerste verjaardag zonder hem of haar.", section: "inspiratie", order: 1, isActive: true },
  { featureId: "rituelen-bibliotheek", iconName: "Library", title: "Rituelen-bibliotheek", description: "Kleine, betekenisvolle rituelen om bij stil te staan. Geen therapie, wel iets om houvast aan te hebben.", section: "inspiratie", order: 2, isActive: true },
  { featureId: "aanbevolen-voor-jou", iconName: "BookMarked", title: "Aanbevolen voor jou", description: "Een gecureerde selectie van boeken, podcasts en films — afgestemd op wat jij doormaakt.", section: "inspiratie", order: 3, isActive: true },
  { featureId: "wat-zeg-je", iconName: "MessageCircleHeart", title: "Wat zeg je tegen iemand die rouwt?", description: "Een praktische gids voor je omgeving. Deel hem met mensen die er voor je willen zijn maar niet weten hoe.", section: "handreikingen", order: 1, isActive: true },
  { featureId: "herdenkingskalender", iconName: "CalendarHeart", title: "Herdenkingskalender", description: "Voeg belangrijke datums toe. Op die dag staat Benji extra voor je klaar met een warm bericht.", section: "checkins", order: 1, isActive: true },
];

type Feature = {
  _id: string;
  featureId: string;
  iconName: string;
  title: string;
  description: string;
  section: string;
  order: number;
  isActive: boolean;
};

type FormState = {
  featureId: string;
  iconName: string;
  title: string;
  description: string;
  section: string;
  order: number;
  isActive: boolean;
};

const emptyForm = (): FormState => ({
  featureId: "",
  iconName: "BookOpen",
  title: "",
  description: "",
  section: "herinneringen",
  order: 1,
  isActive: true,
});

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export default function AdminWensenPage() {
  const [features, setFeatures] = useState<Feature[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [seeding, setSeeding] = useState(false);

  // Add form
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState<FormState>(emptyForm());
  const [addSaving, setAddSaving] = useState(false);

  // Edit state (per id)
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<FormState>(emptyForm());
  const [editSaving, setEditSaving] = useState(false);

  // Delete confirm
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Vote counts (from feature-votes endpoint)
  const [voteCounts, setVoteCounts] = useState<Record<string, number>>({});

  const load = () => {
    setLoading(true);
    Promise.all([
      fetch("/api/admin/wensen").then((r) => r.json()),
      fetch("/api/admin/feature-votes").then((r) => r.json()),
    ])
      .then(([wData, vData]) => {
        setFeatures(wData.features ?? []);
        setVoteCounts(vData.counts ?? {});
        setError(false);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleSeed = async () => {
    setSeeding(true);
    await fetch("/api/admin/wensen", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(DEFAULT_FEATURES),
    });
    setSeeding(false);
    load();
  };

  const handleAdd = async () => {
    setAddSaving(true);
    await fetch("/api/admin/wensen", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...addForm,
        featureId: addForm.featureId || slugify(addForm.title),
      }),
    });
    setAddSaving(false);
    setShowAdd(false);
    setAddForm(emptyForm());
    load();
  };

  const startEdit = (f: Feature) => {
    setEditId(f._id);
    setEditForm({
      featureId: f.featureId,
      iconName: f.iconName,
      title: f.title,
      description: f.description,
      section: f.section,
      order: f.order,
      isActive: f.isActive,
    });
  };

  const handleSaveEdit = async () => {
    if (!editId) return;
    setEditSaving(true);
    await fetch("/api/admin/wensen", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: editId, ...editForm }),
    });
    setEditSaving(false);
    setEditId(null);
    load();
  };

  const handleToggleActive = async (f: Feature) => {
    await fetch("/api/admin/wensen", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: f._id, isActive: !f.isActive }),
    });
    load();
  };

  const handleDelete = async (id: string) => {
    await fetch("/api/admin/wensen", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setConfirmDeleteId(null);
    load();
  };

  const grouped = SECTIONS.map((s) => ({
    ...s,
    items: features.filter((f) => f.section === s.value),
  })).filter((g) => g.items.length > 0 || showAdd);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center border border-primary-200">
            <ThumbsUp className="w-5 h-5 text-primary-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-primary-900">Wensen</h1>
            <p className="text-sm text-gray-500">Aankomende functies beheren en stemmen bekijken</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => { setShowAdd(true); setEditId(null); }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
        >
          <Plus size={16} />
          Toevoegen
        </button>
      </div>

      {/* Seed button (only when empty) */}
      {!loading && !error && features.length === 0 && (
        <div className="bg-white rounded-xl border border-dashed border-primary-300 p-6 text-center">
          <p className="text-sm text-gray-500 mb-3">
            Nog geen wensen toegevoegd. Voeg de 6 standaard functies in één klik toe.
          </p>
          <button
            type="button"
            onClick={handleSeed}
            disabled={seeding}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50"
          >
            {seeding ? "Bezig…" : "Voeg standaard functies toe"}
          </button>
        </div>
      )}

      {/* Add form */}
      {showAdd && (
        <FeatureForm
          form={addForm}
          setForm={setAddForm}
          onSave={handleAdd}
          onCancel={() => { setShowAdd(false); setAddForm(emptyForm()); }}
          saving={addSaving}
          title="Nieuwe wens"
        />
      )}

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-12">
          <div className="animate-pulse rounded-full h-8 w-8 border-b-2 border-primary-600" />
        </div>
      )}

      {error && (
        <div className="bg-white rounded-xl border border-red-200 p-4 text-sm text-red-600">
          Kon de wensen niet laden.
        </div>
      )}

      {/* List grouped by section */}
      {!loading && !error && features.length > 0 && (
        <div className="space-y-6">
          {SECTIONS.map((section) => {
            const items = features.filter((f) => f.section === section.value);
            if (items.length === 0) return null;
            return (
              <div key={section.value}>
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2 px-1">
                  {section.label}
                </p>
                <div className="bg-white rounded-xl border border-primary-200 divide-y divide-gray-100">
                  {items.map((f) =>
                    editId === f._id ? (
                      <div key={f._id} className="p-4">
                        <FeatureForm
                          form={editForm}
                          setForm={setEditForm}
                          onSave={handleSaveEdit}
                          onCancel={() => setEditId(null)}
                          saving={editSaving}
                          title="Bewerken"
                        />
                      </div>
                    ) : (
                      <FeatureRow
                        key={f._id}
                        feature={f}
                        votes={voteCounts[f.featureId] ?? 0}
                        onEdit={() => startEdit(f)}
                        onToggle={() => handleToggleActive(f)}
                        onDelete={() => setConfirmDeleteId(f._id)}
                        confirmDelete={confirmDeleteId === f._id}
                        onConfirmDelete={() => handleDelete(f._id)}
                        onCancelDelete={() => setConfirmDeleteId(null)}
                      />
                    )
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ---------- Sub-components ---------- */

function FeatureRow({
  feature, votes, onEdit, onToggle, onDelete, confirmDelete, onConfirmDelete, onCancelDelete,
}: {
  feature: Feature;
  votes: number;
  onEdit: () => void;
  onToggle: () => void;
  onDelete: () => void;
  confirmDelete: boolean;
  onConfirmDelete: () => void;
  onCancelDelete: () => void;
}) {
  const Icon = getIcon(feature.iconName);

  return (
    <div className={`flex items-center gap-3 p-4 ${!feature.isActive ? "opacity-50" : ""}`}>
      <div className="p-2 rounded-lg bg-primary-50 text-primary-700 flex-shrink-0">
        <Icon size={18} strokeWidth={2} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{feature.title}</p>
        <p className="text-xs text-gray-400 truncate">{feature.description}</p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        {/* Stem-teller */}
        <span className="text-xs text-primary-600 font-medium tabular-nums min-w-[2.5rem] text-right">
          {votes} {votes === 1 ? "stem" : "stemmen"}
        </span>

        {/* Actief toggle */}
        <button
          type="button"
          onClick={onToggle}
          title={feature.isActive ? "Verbergen" : "Tonen"}
          className={`w-8 h-4 rounded-full transition-colors flex-shrink-0 ${feature.isActive ? "bg-primary-500" : "bg-gray-300"}`}
        >
          <span className={`block w-3 h-3 rounded-full bg-white shadow mx-0.5 transition-transform ${feature.isActive ? "translate-x-4" : "translate-x-0"}`} />
        </button>

        {/* Bewerken */}
        <button type="button" onClick={onEdit} className="p-1.5 text-gray-400 hover:text-primary-600 rounded-lg hover:bg-primary-50 transition-colors">
          <Pencil size={15} />
        </button>

        {/* Verwijderen */}
        {confirmDelete ? (
          <div className="flex items-center gap-1">
            <span className="text-xs text-gray-500">Zeker?</span>
            <button type="button" onClick={onConfirmDelete} className="p-1 text-red-500 hover:text-red-700">
              <Check size={15} />
            </button>
            <button type="button" onClick={onCancelDelete} className="p-1 text-gray-400 hover:text-gray-600">
              <X size={15} />
            </button>
          </div>
        ) : (
          <button type="button" onClick={onDelete} className="p-1.5 text-gray-300 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors">
            <Trash2 size={15} />
          </button>
        )}
      </div>
    </div>
  );
}

function FeatureForm({
  form, setForm, onSave, onCancel, saving, title,
}: {
  form: FormState;
  setForm: (f: FormState) => void;
  onSave: () => void;
  onCancel: () => void;
  saving: boolean;
  title: string;
}) {
  const set = (key: keyof FormState, value: unknown) =>
    setForm({ ...form, [key]: value });

  const PreviewIcon = getIcon(form.iconName);

  return (
    <div className="space-y-4 bg-primary-50/40 rounded-xl border border-primary-200 p-4">
      <p className="text-sm font-semibold text-primary-900">{title}</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Titel */}
        <div className="sm:col-span-2">
          <label className="block text-xs font-medium text-gray-600 mb-1">Titel</label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => {
              set("title", e.target.value);
              if (!form.featureId) set("featureId", slugify(e.target.value));
            }}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-200 focus:outline-none"
            placeholder="Naam van de functie"
          />
        </div>

        {/* Beschrijving */}
        <div className="sm:col-span-2">
          <label className="block text-xs font-medium text-gray-600 mb-1">Beschrijving</label>
          <textarea
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            rows={2}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-200 focus:outline-none resize-none"
            placeholder="Korte uitleg voor de gebruiker"
          />
        </div>

        {/* Sectie */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Sectie</label>
          <select
            value={form.section}
            onChange={(e) => set("section", e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-200 focus:outline-none bg-white"
          >
            {SECTIONS.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>

        {/* Icoon */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Icoon</label>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary-50 text-primary-700 border border-primary-200 flex-shrink-0">
              <PreviewIcon size={18} strokeWidth={2} />
            </div>
            <select
              value={form.iconName}
              onChange={(e) => set("iconName", e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-200 focus:outline-none bg-white"
            >
              {ICON_OPTIONS.map((name) => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Volgorde */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Volgorde</label>
          <input
            type="number"
            min={1}
            value={form.order}
            onChange={(e) => set("order", Number(e.target.value))}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-200 focus:outline-none"
          />
        </div>

        {/* Feature ID */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Feature ID <span className="text-gray-400">(voor stemmen)</span></label>
          <input
            type="text"
            value={form.featureId}
            onChange={(e) => set("featureId", e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-200 focus:outline-none font-mono"
            placeholder="automatisch"
          />
        </div>

        {/* Actief */}
        <div className="flex items-center gap-2 sm:col-span-2">
          <input
            type="checkbox"
            id="form-active"
            checked={form.isActive}
            onChange={(e) => set("isActive", e.target.checked)}
            className="rounded border-gray-300 text-primary-600"
          />
          <label htmlFor="form-active" className="text-sm text-gray-700">Direct zichtbaar voor gebruikers</label>
        </div>
      </div>

      <div className="flex items-center gap-3 pt-1">
        <button
          type="button"
          onClick={onSave}
          disabled={saving || !form.title.trim()}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50 transition-colors"
        >
          {saving ? "Opslaan…" : "Opslaan"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded-lg text-sm transition-colors"
        >
          Annuleren
        </button>
      </div>
    </div>
  );
}
