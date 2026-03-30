"use client";

import { useState, useRef } from "react";
import { useAdminMutation, useAdminQuery, useAdminAuth } from "../AdminAuthContext";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Plus, Edit, Trash2, Save, X, Eye, Image as ImageIcon, Upload, Trash } from "lucide-react";

type CtaForm = {
  key: string;
  label: string;
  eyebrow: string;
  title: string;
  body: string;
  buttonText: string;
  footnote: string;
  showImage: boolean;
  imageStorageId: Id<"_storage"> | null;
  imagePreviewUrl: string | null;
  bgColor: string;
  borderColor: string;
  buttonColor: string;
};

const DEFAULTS: CtaForm = {
  key: "",
  label: "",
  eyebrow: "Talk To Benji",
  title: "",
  body: "",
  buttonText: "Kijk of het bij je past",
  footnote: "7 dagen volledig toegang · geen creditcard nodig",
  showImage: false,
  imageStorageId: null,
  imagePreviewUrl: null,
  bgColor: "#f5f0eb",
  borderColor: "",
  buttonColor: "#6d84a8",
};

const BG_SWATCHES = ["#f5f0eb", "#fef3c7", "#eef2f7", "#f0f4ee", "#fdf4f7", "#f7f4ff", "#ffffff", "#1a1a2e", "#2d3748"];
const BTN_SWATCHES = ["#6d84a8", "#4a7c59", "#c07a5a", "#7c6d9e", "#2563eb", "#d97706", "#374151", "#be185d"];

const PRESETS: { label: string; data: Partial<CtaForm> }[] = [
  {
    label: "Variant A — stil & persoonlijk",
    data: {
      key: "blog_default",
      label: "Blog — stil & persoonlijk",
      eyebrow: "Talk To Benji",
      title: "Misschien is dit het moment.",
      body: "Benji luistert — zonder oordeel, zonder haast. Er voor je overdag, 's avonds en midden in de nacht.",
      buttonText: "Kijk of het bij je past",
      footnote: "7 dagen volledig toegang · geen creditcard nodig",
      showImage: false,
      bgColor: "#f5f0eb",
      borderColor: "",
      buttonColor: "#6d84a8",
    },
  },
  {
    label: "Variant C — warm amber",
    data: {
      key: "amber_warm",
      label: "Amber — warm & uitnodigend",
      eyebrow: "Talk To Benji",
      title: "Je hoeft het niet alleen te dragen.",
      body: "Benji is er voor je — wanneer je even wil praten, stilstaan of gewoon niet meer weet waar je het zoeken moet.",
      buttonText: "Kijk of het bij je past",
      footnote: "7 dagen volledig toegang · geen creditcard nodig",
      showImage: false,
      bgColor: "#fef3c7",
      borderColor: "#d97706",
      buttonColor: "#d97706",
    },
  },
  {
    label: "Variant B — met screenshot",
    data: {
      key: "pillar_default",
      label: "Pillar — met screenshot",
      eyebrow: "Talk To Benji",
      title: "Soms wil je gewoon ergens heen kunnen.",
      body: "Benji is er voor de momenten dat je het moeilijk hebt. Een gesprek, een dagelijkse check-in, herinneringen bewaren — op jouw tempo, wanneer jij er behoefte aan hebt.",
      buttonText: "Kijk of het bij je past",
      footnote: "7 dagen volledig toegang · geen creditcard nodig",
      showImage: true,
      bgColor: "#f5f0eb",
      borderColor: "",
      buttonColor: "#6d84a8",
    },
  },
];

function CtaPreview({ form }: { form: CtaForm }) {
  const bg = form.bgColor || "#f5f0eb";
  const btnColor = form.buttonColor || "#6d84a8";
  const borderStyle = form.borderColor ? { border: `2px solid ${form.borderColor}` } : {};

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: bg, ...borderStyle }}>
      <div className="px-7 pt-8 pb-6 text-center">
        {form.eyebrow && (
          <p className="text-xs uppercase tracking-widest mb-4" style={{ color: "color-mix(in srgb, #000 40%, " + bg + ")" }}>
            {form.eyebrow}
          </p>
        )}
        <p className="text-xl font-semibold leading-snug mb-3" style={{ color: "color-mix(in srgb, #000 75%, " + bg + ")" }}>
          {form.title || <span className="opacity-30 italic">Titel...</span>}
        </p>
        <p className="text-[15px] leading-relaxed max-w-sm mx-auto mb-2" style={{ color: "color-mix(in srgb, #000 50%, " + bg + ")" }}>
          {form.body || <span className="opacity-30 italic">Bodytekst...</span>}
        </p>
      </div>

      {(form.imagePreviewUrl || form.showImage) && (
        <div className="px-6 pb-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={form.imagePreviewUrl || "/images/app-screenshot.png"}
            alt="Talk To Benji"
            className="w-full rounded-xl border border-stone-200 shadow-sm"
          />
        </div>
      )}

      <div className="px-7 py-7 text-center">
        <span className="inline-block text-white text-sm font-semibold px-6 py-3 rounded-xl" style={{ background: btnColor }}>
          {form.buttonText || "Knoptekst..."}
        </span>
        {form.footnote && (
          <p className="text-xs mt-3" style={{ color: "color-mix(in srgb, #000 35%, " + bg + ")" }}>
            {form.footnote}
          </p>
        )}
      </div>
    </div>
  );
}

export default function CtaAdminPage() {
  const { adminToken } = useAdminAuth();
  const blocks = useAdminQuery(api.ctaBlocks.list, {});
  const saveCta = useAdminMutation(api.ctaBlocks.save);
  const removeCta = useAdminMutation(api.ctaBlocks.remove);
  const generateUploadUrl = useAdminMutation(api.ctaBlocks.generateUploadUrl);
  const getImageUrl = useAdminMutation(api.ctaBlocks.getImageUrl);

  const [editingId, setEditingId] = useState<Id<"ctaBlocks"> | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<CtaForm>(DEFAULTS);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const inputClass = "w-full px-3 py-2 border border-primary-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-400";

  const openNew = (preset?: Partial<CtaForm>) => {
    setForm({ ...DEFAULTS, ...preset });
    setEditingId(null);
    setShowForm(true);
  };

  const openEdit = (block: any) => {
    setForm({
      key: block.key,
      label: block.label,
      eyebrow: block.eyebrow ?? "",
      title: block.title,
      body: block.body,
      buttonText: block.buttonText,
      footnote: block.footnote ?? "",
      showImage: block.showImage,
      imageStorageId: block.imageStorageId ?? null,
      imagePreviewUrl: block.imageUrl ?? null,
      bgColor: block.bgColor ?? "#f5f0eb",
      borderColor: block.borderColor ?? "",
      buttonColor: block.buttonColor ?? "#6d84a8",
    });
    setEditingId(block._id);
    setShowForm(true);
  };

  const handleImageUpload = async (file: File) => {
    setUploading(true);
    try {
      const uploadUrl = await generateUploadUrl({});
      const res = await fetch(uploadUrl, { method: "POST", body: file, headers: { "Content-Type": file.type } });
      const { storageId } = await res.json();
      const url = await getImageUrl({ storageId });
      setForm((f) => ({ ...f, imageStorageId: storageId, imagePreviewUrl: url }));
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!form.key.trim() || !form.title.trim()) return;
    setSaving(true);
    try {
      await saveCta({
        id: editingId ?? undefined,
        key: form.key.trim().toLowerCase().replace(/\s+/g, "_"),
        label: form.label.trim(),
        eyebrow: form.eyebrow.trim() || undefined,
        title: form.title.trim(),
        body: form.body.trim(),
        buttonText: form.buttonText.trim(),
        footnote: form.footnote.trim() || undefined,
        showImage: form.showImage,
        imageStorageId: form.imageStorageId ?? undefined,
        bgColor: form.bgColor || undefined,
        borderColor: form.borderColor || undefined,
        buttonColor: form.buttonColor || undefined,
      });
      setShowForm(false);
      setEditingId(null);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: Id<"ctaBlocks">) => {
    if (!confirm("Deze CTA verwijderen?")) return;
    await removeCta({ id });
  };

  const set = (field: keyof CtaForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">CTA blokken</h1>
          <p className="text-sm text-gray-500 mt-1">Beheer de call-to-action blokken voor blog en pillar pagina's</p>
        </div>
        <button
          onClick={() => openNew()}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700"
        >
          <Plus size={16} /> Nieuwe CTA
        </button>
      </div>


      {/* Bestaande CTA's */}
      {blocks && blocks.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {blocks.map((block: any) => (
            <div key={block._id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <div>
                  <p className="text-sm font-semibold text-gray-800">{block.label || block.key}</p>
                  <p className="text-xs text-gray-400 font-mono">key: {block.key}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPreviewId(previewId === block._id ? null : block._id)}
                    className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded"
                  >
                    <Eye size={15} />
                  </button>
                  <button
                    onClick={() => openEdit(block)}
                    className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded"
                  >
                    <Edit size={15} />
                  </button>
                  <button
                    onClick={() => handleDelete(block._id)}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>

              {/* Compacte info */}
              <div className="px-4 py-3 space-y-1">
                <p className="text-sm font-medium text-gray-800 line-clamp-1">{block.title}</p>
                <p className="text-xs text-gray-500 line-clamp-2">{block.body}</p>
                <div className="flex items-center gap-2 pt-1 flex-wrap">
                  <span className="text-xs px-2 py-0.5 rounded-full text-white" style={{ background: block.buttonColor || "#6d84a8" }}>{block.buttonText}</span>
                  {block.bgColor && <span className="text-xs px-2 py-0.5 rounded-full border border-gray-200" style={{ background: block.bgColor }}>bg</span>}
                  {block.borderColor && <span className="text-xs px-2 py-0.5 rounded-full" style={{ border: `2px solid ${block.borderColor}`, color: block.borderColor }}>rand</span>}
                  {block.imageUrl && <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full flex items-center gap-1"><ImageIcon size={10} /> Eigen afbeelding</span>}
                  {!block.imageUrl && block.showImage && <span className="text-xs px-2 py-0.5 bg-amber-50 text-amber-700 rounded-full flex items-center gap-1"><ImageIcon size={10} /> App-screenshot</span>}
                </div>
              </div>

              {/* Live preview */}
              {previewId === block._id && (
                <div className="p-4 border-t border-gray-100 bg-gray-50">
                  <p className="text-xs text-gray-400 mb-3 uppercase tracking-wide">Preview</p>
                  <CtaPreview form={{
                    key: block.key,
                    label: block.label,
                    eyebrow: block.eyebrow ?? "",
                    title: block.title,
                    body: block.body,
                    buttonText: block.buttonText,
                    footnote: block.footnote ?? "",
                    showImage: block.showImage,
                    imageStorageId: block.imageStorageId ?? null,
                    imagePreviewUrl: block.imageUrl ?? null,
                    bgColor: block.bgColor ?? "#f5f0eb",
                    borderColor: block.borderColor ?? "",
                    buttonColor: block.buttonColor ?? "#6d84a8",
                  }} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Formulier */}
      {showForm && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h2 className="text-base font-semibold text-gray-800">
              {editingId ? "CTA bewerken" : "Nieuwe CTA"}
            </h2>
            <button onClick={() => setShowForm(false)} className="p-1 text-gray-400 hover:text-gray-600 rounded">
              <X size={18} />
            </button>
          </div>

          {/* Presets — altijd beschikbaar bij nieuw */}
          {!editingId && (
            <div className="px-5 py-3 bg-gray-50 border-b border-gray-100 flex items-center gap-3 flex-wrap">
              <span className="text-xs text-gray-400">Begin met een variant:</span>
              {PRESETS.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, ...p.data }))}
                  className="px-3 py-1.5 border border-primary-200 rounded-lg text-xs text-primary-700 hover:bg-primary-50"
                >
                  {p.label}
                </button>
              ))}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
            {/* Formulier links */}
            <div className="p-5 space-y-4 border-r border-gray-100">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Naam (intern)</label>
                  <input type="text" value={form.label} onChange={set("label")} placeholder="Bijv. Blog — stil" className={inputClass} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Key (uniek)</label>
                  <input type="text" value={form.key} onChange={set("key")} placeholder="blog_default" className={inputClass + " font-mono"} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Klein label bovenaan</label>
                <input type="text" value={form.eyebrow} onChange={set("eyebrow")} placeholder="Talk To Benji" className={inputClass} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Titel *</label>
                <input type="text" value={form.title} onChange={set("title")} placeholder="Misschien is dit het moment." className={inputClass} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Bodytekst</label>
                <textarea value={form.body} onChange={set("body")} rows={3} placeholder="Benji luistert — zonder oordeel..." className={inputClass} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Knoptekst</label>
                  <input type="text" value={form.buttonText} onChange={set("buttonText")} className={inputClass} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Kleine tekst onder knop</label>
                  <input type="text" value={form.footnote} onChange={set("footnote")} placeholder="7 dagen gratis..." className={inputClass} />
                </div>
              </div>
              {/* Afbeelding */}
              <div className="border-t border-gray-100 pt-4 space-y-3">
                <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Afbeelding</p>

                {form.imagePreviewUrl ? (
                  <div className="relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={form.imagePreviewUrl} alt="preview" className="w-full rounded-xl border border-gray-200 shadow-sm" />
                    <button
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, imageStorageId: null, imagePreviewUrl: null }))}
                      className="absolute top-2 right-2 p-1.5 bg-white rounded-full shadow border border-gray-200 text-gray-400 hover:text-red-600"
                    >
                      <Trash size={13} />
                    </button>
                  </div>
                ) : (
                  <div>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="flex items-center gap-2 px-4 py-2.5 border border-dashed border-gray-300 rounded-xl text-sm text-gray-500 hover:border-primary-400 hover:text-primary-600 w-full justify-center"
                    >
                      <Upload size={14} />
                      {uploading ? "Uploaden..." : "Eigen afbeelding uploaden"}
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageUpload(f); }}
                    />
                    <label className="flex items-center gap-2 cursor-pointer mt-2">
                      <input
                        type="checkbox"
                        checked={form.showImage}
                        onChange={(e) => setForm((f) => ({ ...f, showImage: e.target.checked }))}
                        className="rounded"
                      />
                      <span className="text-sm text-gray-700">Of toon standaard app-screenshot</span>
                    </label>
                  </div>
                )}
              </div>

              {/* Kleuren */}
              <div className="border-t border-gray-100 pt-4 space-y-3">
                <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Kleuren</p>

                {/* Achtergrondkleur */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">Achtergrondkleur</label>
                  <div className="flex items-center gap-2 flex-wrap">
                    {BG_SWATCHES.map((c) => (
                      <button
                        key={c}
                        type="button"
                        title={c}
                        onClick={() => setForm((f) => ({ ...f, bgColor: c }))}
                        className="w-7 h-7 rounded-lg border-2 transition-all"
                        style={{
                          background: c,
                          borderColor: form.bgColor === c ? "#6d84a8" : "#e5e7eb",
                          transform: form.bgColor === c ? "scale(1.15)" : "scale(1)",
                        }}
                      />
                    ))}
                    <input
                      type="color"
                      value={form.bgColor || "#f5f0eb"}
                      onChange={(e) => setForm((f) => ({ ...f, bgColor: e.target.value }))}
                      className="w-7 h-7 rounded cursor-pointer border border-gray-200"
                      title="Eigen kleur kiezen"
                    />
                    <span className="text-xs text-gray-400 font-mono">{form.bgColor}</span>
                  </div>
                </div>

                {/* Randkleur */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">Randkleur <span className="text-gray-400 font-normal">(leeg = geen rand)</span></label>
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, borderColor: "" }))}
                      className="w-7 h-7 rounded-lg border-2 text-xs text-gray-400 flex items-center justify-center"
                      style={{ borderColor: !form.borderColor ? "#6d84a8" : "#e5e7eb", background: "#fff" }}
                      title="Geen rand"
                    >✕</button>
                    {BG_SWATCHES.map((c) => (
                      <button
                        key={c}
                        type="button"
                        title={c}
                        onClick={() => setForm((f) => ({ ...f, borderColor: c }))}
                        className="w-7 h-7 rounded-lg border-2 transition-all"
                        style={{
                          background: c,
                          borderColor: form.borderColor === c ? "#6d84a8" : "#e5e7eb",
                          transform: form.borderColor === c ? "scale(1.15)" : "scale(1)",
                        }}
                      />
                    ))}
                    <input
                      type="color"
                      value={form.borderColor || "#cccccc"}
                      onChange={(e) => setForm((f) => ({ ...f, borderColor: e.target.value }))}
                      className="w-7 h-7 rounded cursor-pointer border border-gray-200"
                      title="Eigen randkleur kiezen"
                    />
                    {form.borderColor && <span className="text-xs text-gray-400 font-mono">{form.borderColor}</span>}
                  </div>
                </div>

                {/* Knopkleur */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">Knopkleur</label>
                  <div className="flex items-center gap-2 flex-wrap">
                    {BTN_SWATCHES.map((c) => (
                      <button
                        key={c}
                        type="button"
                        title={c}
                        onClick={() => setForm((f) => ({ ...f, buttonColor: c }))}
                        className="w-7 h-7 rounded-lg border-2 transition-all"
                        style={{
                          background: c,
                          borderColor: form.buttonColor === c ? "#374151" : "#e5e7eb",
                          transform: form.buttonColor === c ? "scale(1.15)" : "scale(1)",
                        }}
                      />
                    ))}
                    <input
                      type="color"
                      value={form.buttonColor || "#6d84a8"}
                      onChange={(e) => setForm((f) => ({ ...f, buttonColor: e.target.value }))}
                      className="w-7 h-7 rounded cursor-pointer border border-gray-200"
                      title="Eigen knopkleur kiezen"
                    />
                    <span className="text-xs text-gray-400 font-mono">{form.buttonColor}</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleSave}
                  disabled={saving || !form.key.trim() || !form.title.trim()}
                  className="flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50"
                >
                  <Save size={15} />
                  {saving ? "Opslaan..." : "Opslaan"}
                </button>
                <button onClick={() => setShowForm(false)} className="px-4 py-2.5 bg-gray-100 text-gray-600 rounded-lg text-sm hover:bg-gray-200">
                  Annuleer
                </button>
              </div>
            </div>

            {/* Live preview rechts */}
            <div className="p-5 bg-gray-50">
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-4">Live preview</p>
              <CtaPreview form={form} />
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
