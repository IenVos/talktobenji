"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { useAdminQuery, useAdminMutation } from "../AdminAuthContext";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { HandHelping, Plus, Edit, Trash2, Save, X, FileText } from "lucide-react";
import { extractPdfCoverAsBlob } from "@/lib/extractPdfCover";

export default function AdminHandreikingenPage() {
  const items = useAdminQuery(api.handreikingen.listWithUrls, {});
  const createItem = useAdminMutation(api.handreikingen.create);
  const updateItem = useAdminMutation(api.handreikingen.update);
  const removeItem = useAdminMutation(api.handreikingen.remove);
  const generateUploadUrl = useAdminMutation(api.handreikingen.generateUploadUrl);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<Id<"handreikingenItems"> | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: "",
    content: "",
    order: 0,
    kind: "text" as "text" | "pdf",
    pdfFile: null as File | null,
    imageFile: null as File | null,
    publishFromDate: "",
    priceEuro: "",
    exerciseSlug: "",
  });
  const [extractingCover, setExtractingCover] = useState(false);
  const [editingImageUrl, setEditingImageUrl] = useState<string | null>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const imagePreviewUrl = useMemo(() => {
    if (form.imageFile) return URL.createObjectURL(form.imageFile);
    return null;
  }, [form.imageFile]);
  useEffect(() => {
    return () => { if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl); };
  }, [imagePreviewUrl]);

  const isPdf = form.kind === "pdf";
  const hasImage = !!form.imageFile || !!editingImageUrl;
  const canSave = !extractingCover && (
    isPdf
      ? (editingId ? true : !!form.pdfFile && !!form.imageFile)
      : (!!form.title.trim() || !!form.content.trim() || hasImage)
  );

  useEffect(() => {
    if (!isPdf || !form.pdfFile || form.imageFile) return;
    let cancelled = false;
    setExtractingCover(true);
    extractPdfCoverAsBlob(form.pdfFile)
      .then((blob) => {
        if (cancelled) return;
        const file = new File([blob], "cover.png", { type: "image/png" });
        setForm((f) => ({ ...f, imageFile: file }));
      })
      .catch(() => { if (!cancelled) setForm((f) => ({ ...f, imageFile: null })); })
      .finally(() => { if (!cancelled) setExtractingCover(false); });
    return () => { cancelled = true; };
  }, [isPdf, form.pdfFile?.name]);

  const resetForm = () => {
    setForm({
      title: "",
      content: "",
      order: items?.length ?? 0,
      kind: "text",
      pdfFile: null,
      imageFile: null,
      publishFromDate: "",
      priceEuro: "",
      exerciseSlug: "",
    });
    setEditingId(null);
    setEditingImageUrl(null);
    setExtractingCover(false);
    setShowForm(false);
    pdfInputRef.current && (pdfInputRef.current.value = "");
    imageInputRef.current && (imageInputRef.current.value = "");
  };

  const handleCreate = async () => {
    if (!canSave) return;
    if (isPdf) {
      if (!form.pdfFile || !form.imageFile) return;
      setSaving(true);
      try {
        const [pdfUrl, imageUrl] = await Promise.all([
          generateUploadUrl(),
          generateUploadUrl(),
        ]);
        const [pdfRes, imageRes] = await Promise.all([
          fetch(pdfUrl, { method: "POST", body: form.pdfFile, headers: { "Content-Type": form.pdfFile.type } }),
          fetch(imageUrl, { method: "POST", body: form.imageFile, headers: { "Content-Type": form.imageFile.type } }),
        ]);
        const { storageId: pdfStorageId } = await pdfRes.json();
        const { storageId: imageStorageId } = await imageRes.json();
        await createItem({
          title: form.title.trim(),
          content: form.content.trim() || form.title,
          order: form.order,
          pdfStorageId,
          imageStorageId,
          publishFrom: form.publishFromDate ? new Date(form.publishFromDate).getTime() : undefined,
          priceCents: (() => {
            const v = form.priceEuro?.trim();
            if (!v) return undefined;
            const n = parseFloat(v.replace(",", "."));
            return !Number.isNaN(n) && n > 0 ? Math.round(n * 100) : undefined;
          })(),
          exerciseSlug: form.exerciseSlug.trim() || undefined,
        });
        resetForm();
      } finally {
        setSaving(false);
      }
    } else {
      setSaving(true);
      try {
        let imageStorageId: Id<"_storage"> | undefined;
        if (form.imageFile) {
          const url = await generateUploadUrl();
          const res = await fetch(url, { method: "POST", body: form.imageFile, headers: { "Content-Type": form.imageFile.type } });
          const { storageId } = await res.json();
          imageStorageId = storageId as Id<"_storage">;
        }
        await createItem({
          title: form.title.trim(),
          content: form.content.trim(),
          order: form.order,
          imageStorageId,
          publishFrom: form.publishFromDate ? new Date(form.publishFromDate).getTime() : undefined,
          priceCents: (() => {
            const v = form.priceEuro?.trim();
            if (!v) return undefined;
            const n = parseFloat(v.replace(",", "."));
            return !Number.isNaN(n) && n > 0 ? Math.round(n * 100) : undefined;
          })(),
          exerciseSlug: form.exerciseSlug.trim() || undefined,
        });
        resetForm();
      } finally {
        setSaving(false);
      }
    }
  };

  const handleUpdate = async () => {
    if (!editingId || !canSave) return;
    setSaving(true);
    try {
      const updates: Parameters<typeof updateItem>[0] = {
        id: editingId,
        title: form.title.trim(),
        content: form.content.trim() || form.title,
        order: form.order,
        publishFrom: form.publishFromDate ? new Date(form.publishFromDate).getTime() : null,
        priceCents: (() => {
          const v = form.priceEuro?.trim();
          if (!v) return null;
          const n = parseFloat(v.replace(",", "."));
          return !Number.isNaN(n) && n > 0 ? Math.round(n * 100) : null;
        })(),
        exerciseSlug: form.exerciseSlug.trim() || null,
      };
      if (isPdf && form.pdfFile) {
        const url = await generateUploadUrl();
        const res = await fetch(url, { method: "POST", body: form.pdfFile, headers: { "Content-Type": form.pdfFile.type } });
        const { storageId } = await res.json();
        updates.pdfStorageId = storageId;
      }
      if (form.imageFile) {
        const url = await generateUploadUrl();
        const res = await fetch(url, { method: "POST", body: form.imageFile, headers: { "Content-Type": form.imageFile.type } });
        const { storageId } = await res.json();
        updates.imageStorageId = storageId;
      }
      await updateItem(updates);
      resetForm();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: Id<"handreikingenItems">) => {
    if (!confirm("Weet je zeker dat je deze handreiking wilt verwijderen?")) return;
    await removeItem({ id });
  };

  const startEdit = (item: {
    _id: Id<"handreikingenItems">;
    title?: string;
    content?: string;
    order: number;
    pdfStorageId?: unknown;
    publishFrom?: number | null;
    imageUrl?: string | null;
    priceCents?: number | null;
  }) => {
    setForm({
      title: item.title ?? "",
      content: item.content ?? "",
      order: item.order,
      kind: item.pdfStorageId ? "pdf" : "text",
      pdfFile: null,
      imageFile: null,
      publishFromDate: item.publishFrom ? new Date(item.publishFrom).toISOString().slice(0, 16) : "",
      priceEuro: item.priceCents ? (item.priceCents / 100).toString() : "",
      exerciseSlug: (item as any).exerciseSlug ?? "",
    });
    setEditingImageUrl(item.imageUrl ?? null);
    setEditingId(item._id);
    setShowForm(true);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-primary-900 flex items-center gap-2">
          <HandHelping size={28} className="text-primary-600" />
          Handreikingen
        </h1>
        <p className="text-sm text-primary-700 mt-1">
          Beheer tips, ideeën en PDF&apos;s/ebooks met coverafbeelding.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-primary-200 p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-semibold text-primary-900">Items</h2>
          <button
            type="button"
            onClick={() => {
              resetForm();
              setForm((f) => ({ ...f, order: items?.length ?? 0 }));
              setShowForm(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700"
          >
            <Plus size={18} />
            Toevoegen
          </button>
        </div>

        {showForm && (
          <div className="mb-6 p-4 rounded-xl bg-primary-50 border border-primary-200 space-y-4">
            <h3 className="font-medium text-primary-900">
              {editingId ? "Bewerken" : "Nieuwe handreiking"}
            </h3>
            <input
              type="text"
              placeholder="Titel"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              className="w-full px-3 py-2 border border-primary-200 rounded-lg"
            />
            <div className="flex gap-3 flex-wrap items-center">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={form.kind === "text"}
                  onChange={() => setForm((f) => ({ ...f, kind: "text" }))}
                />
                Tekst
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={form.kind === "pdf"}
                  onChange={() => setForm((f) => ({ ...f, kind: "pdf" }))}
                />
                PDF / eboek
              </label>
              <input
                type="number"
                placeholder="Volgorde"
                value={form.order}
                onChange={(e) => setForm((f) => ({ ...f, order: parseInt(e.target.value) || 0 }))}
                className="w-24 px-3 py-2 border border-primary-200 rounded-lg"
              />
              <div>
                <label className="block text-xs text-gray-600 mb-0.5">Zichtbaar vanaf (drip)</label>
                <input
                  type="datetime-local"
                  value={form.publishFromDate}
                  onChange={(e) => setForm((f) => ({ ...f, publishFromDate: e.target.value }))}
                  className="px-3 py-2 border border-primary-200 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-0.5">Prijs (€) – leeg = geen Koop-knop</label>
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="bv. 9,99"
                  value={form.priceEuro}
                  onChange={(e) => setForm((f) => ({ ...f, priceEuro: e.target.value }))}
                  className="w-24 px-3 py-2 border border-primary-200 rounded-lg text-sm"
                />
              </div>
            </div>
            {isPdf ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">PDF / eboek</label>
                  <input
                    ref={pdfInputRef}
                    type="file"
                    accept=".pdf,application/pdf"
                    onChange={(e) => {
                      const file = e.target.files?.[0] ?? null;
                      setForm((f) => ({ ...f, pdfFile: file, imageFile: file ? null : f.imageFile }));
                    }}
                    className="block w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-primary-100 file:text-primary-800"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Coverafbeelding (wordt automatisch uit PDF gehaald)</label>
                  <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => setForm((f) => ({ ...f, imageFile: e.target.files?.[0] ?? null }))}
                    className="block w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-primary-100 file:text-primary-800"
                  />
                  {(imagePreviewUrl || (editingId && editingImageUrl && !form.imageFile) || extractingCover) && (
                    <div className="mt-2 flex items-center gap-3">
                      {extractingCover && <span className="text-sm text-primary-600">Cover ophalen…</span>}
                      {(imagePreviewUrl || (editingId && editingImageUrl && !form.imageFile)) && (
                        <div className="w-20 h-24 rounded-lg overflow-hidden border border-primary-200 flex-shrink-0 bg-gray-100">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={imagePreviewUrl ?? editingImageUrl ?? ""} alt="Preview" className="w-full h-full object-cover" />
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <textarea
                  placeholder="Korte beschrijving (optioneel)"
                  value={form.content}
                  onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
                  rows={2}
                  className="w-full px-3 py-2 border border-primary-200 rounded-lg"
                />
                {(editingId && !form.pdfFile && !form.imageFile) && (
                  <p className="text-xs text-gray-500">Laat leeg om bestaande bestanden te behouden.</p>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <textarea
                  placeholder="Inhoud (tip of idee)"
                  value={form.content}
                  onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
                  rows={4}
                  className="w-full px-3 py-2 border border-primary-200 rounded-lg"
                />
                <p className="text-xs text-gray-400">
                  Link toevoegen: <code className="bg-gray-100 px-1 rounded">[link tekst](https://url.com)</code>
                </p>
                <div>
                  <label className="block text-xs text-gray-600 mb-0.5">Oefening koppelen (slug) — leeg = geen oefening-knop</label>
                  <input
                    type="text"
                    placeholder="bv. brief"
                    value={form.exerciseSlug}
                    onChange={(e) => setForm((f) => ({ ...f, exerciseSlug: e.target.value }))}
                    className="w-40 px-3 py-2 border border-primary-200 rounded-lg text-sm"
                  />
                  <p className="text-xs text-gray-400 mt-0.5">Beschikbare oefeningen: <code className="bg-gray-100 px-1 rounded">brief</code></p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Afbeelding (optioneel)</label>
                  <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => setForm((f) => ({ ...f, imageFile: e.target.files?.[0] ?? null }))}
                    className="block w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-primary-100 file:text-primary-800"
                  />
                  {(imagePreviewUrl || (editingId && editingImageUrl && !form.imageFile)) && (
                    <div className="mt-2 w-20 h-24 rounded-lg overflow-hidden border border-primary-200 flex-shrink-0 bg-gray-100">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={imagePreviewUrl ?? editingImageUrl ?? ""} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
                {(editingId && !form.imageFile) && (
                  <p className="text-xs text-gray-500">Laat leeg om bestaande afbeelding te behouden.</p>
                )}
              </div>
            )}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={editingId ? handleUpdate : handleCreate}
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
                <X size={18} />
                Annuleren
              </button>
            </div>
          </div>
        )}

        {items === undefined ? (
          <div className="py-8 text-center text-primary-600">Laden…</div>
        ) : items.length === 0 ? (
          <p className="text-sm text-gray-500 py-4">Nog geen handreikingen. Voeg er een toe.</p>
        ) : (
          <ul className="space-y-3">
            {items
              .sort((a: any, b: any) => a.order - b.order)
              .map((item: any) => (
                <li
                  key={item._id}
                  className="p-4 rounded-lg border border-primary-200 bg-white hover:bg-primary-50/50"
                >
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex gap-3">
                      {(item.pdfStorageId || item.imageUrl) ? (
                        <div className="w-12 h-12 flex-shrink-0 rounded overflow-hidden bg-primary-100 flex items-center justify-center">
                          {item.imageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={item.imageUrl} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <FileText size={24} className="text-primary-600" />
                          )}
                        </div>
                      ) : null}
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          {item.publishFrom && item.publishFrom > Date.now() && (
                            <span className="text-xs px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
                              Zichtbaar vanaf {new Date(item.publishFrom).toLocaleDateString("nl-NL", { day: "numeric", month: "short", year: "numeric" })}
                            </span>
                          )}
                          {(item as any).exerciseSlug && (
                            <span className="text-xs px-1.5 py-0.5 rounded bg-purple-100 text-purple-800">
                              Oefening: {(item as any).exerciseSlug}
                            </span>
                          )}
                        </div>
                        <h3 className="font-medium text-primary-900">{item.title}</h3>
                        {!item.pdfStorageId && (
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2 whitespace-pre-wrap">
                            {item.content}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => startEdit(item)}
                        className="p-2 text-primary-600 hover:bg-primary-100 rounded-lg"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(item._id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
          </ul>
        )}
      </div>
    </div>
  );
}
