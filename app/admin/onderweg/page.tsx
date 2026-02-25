"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { useAdminQuery, useAdminMutation } from "../AdminAuthContext";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { ShoppingBag, Plus, Edit, Trash2, Save, X } from "lucide-react";

export default function AdminOnderwegPage() {
  const items = useAdminQuery(api.onderweg.listWithUrls, {});
  const createItem = useAdminMutation(api.onderweg.create);
  const updateItem = useAdminMutation(api.onderweg.update);
  const removeItem = useAdminMutation(api.onderweg.remove);
  const generateUploadUrl = useAdminMutation(api.onderweg.generateUploadUrl);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<Id<"onderwegItems"> | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: "",
    content: "",
    order: 0,
    imageFile: null as File | null,
    publishFromDate: "",
    priceEuro: "",
    paymentUrl: "",
    buttonLabel: "",
  });
  const [editingImageUrl, setEditingImageUrl] = useState<string | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const imagePreviewUrl = useMemo(() => {
    if (form.imageFile) return URL.createObjectURL(form.imageFile);
    return null;
  }, [form.imageFile]);
  useEffect(() => {
    return () => { if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl); };
  }, [imagePreviewUrl]);

  const hasImage = !!form.imageFile || !!editingImageUrl;
  const canSave = !!form.title.trim() || !!form.content.trim() || hasImage;

  const resetForm = () => {
    setForm({
      title: "",
      content: "",
      order: items?.length ?? 0,
      imageFile: null,
      publishFromDate: "",
      priceEuro: "",
      paymentUrl: "",
      buttonLabel: "",
    });
    setEditingId(null);
    setEditingImageUrl(null);
    setShowForm(false);
    imageInputRef.current && (imageInputRef.current.value = "");
  };

  const handleCreate = async () => {
    if (!canSave) return;
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
        paymentUrl: form.paymentUrl.trim() || undefined,
        buttonLabel: form.buttonLabel.trim() || undefined,
      });
      resetForm();
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async () => {
    if (!editingId || !canSave) return;
    setSaving(true);
    try {
      const updates: Parameters<typeof updateItem>[0] = {
        id: editingId,
        title: form.title.trim(),
        content: form.content.trim(),
        order: form.order,
        publishFrom: form.publishFromDate ? new Date(form.publishFromDate).getTime() : null,
        priceCents: (() => {
          const v = form.priceEuro?.trim();
          if (!v) return null;
          const n = parseFloat(v.replace(",", "."));
          return !Number.isNaN(n) && n > 0 ? Math.round(n * 100) : null;
        })(),
        paymentUrl: form.paymentUrl.trim() || null,
        buttonLabel: form.buttonLabel.trim() || null,
      };
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

  const handleDelete = async (id: Id<"onderwegItems">) => {
    if (!confirm("Weet je zeker dat je dit item wilt verwijderen?")) return;
    await removeItem({ id });
  };

  const startEdit = (item: {
    _id: Id<"onderwegItems">;
    title?: string;
    content?: string;
    order: number;
    publishFrom?: number | null;
    imageUrl?: string | null;
    priceCents?: number | null;
    paymentUrl?: string | null;
  }) => {
    setForm({
      title: item.title ?? "",
      content: item.content ?? "",
      order: item.order,
      imageFile: null,
      publishFromDate: item.publishFrom ? new Date(item.publishFrom).toISOString().slice(0, 16) : "",
      priceEuro: item.priceCents ? (item.priceCents / 100).toString() : "",
      paymentUrl: item.paymentUrl ?? "",
      buttonLabel: item.buttonLabel ?? "",
    });
    setEditingImageUrl(item.imageUrl ?? null);
    setEditingId(item._id);
    setShowForm(true);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-primary-900 flex items-center gap-2">
          <ShoppingBag size={28} className="text-primary-600" />
          Iets voor onderweg
        </h1>
        <p className="text-sm text-primary-700 mt-1">
          Beheer producten met tekst, afbeelding, prijs en betaallink.
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
              {editingId ? "Bewerken" : "Nieuw item"}
            </h3>
            <input
              type="text"
              placeholder="Titel"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              className="w-full px-3 py-2 border border-primary-200 rounded-lg"
            />
            <div className="flex gap-3 flex-wrap items-center">
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
                <label className="block text-xs text-gray-600 mb-0.5">Prijs (€)</label>
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Betaallink (URL naar betalingspagina)</label>
              <input
                type="url"
                placeholder="https://..."
                value={form.paymentUrl}
                onChange={(e) => setForm((f) => ({ ...f, paymentUrl: e.target.value }))}
                className="w-full px-3 py-2 border border-primary-200 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Knoptekst (standaard "Bestellen")</label>
              <input
                type="text"
                placeholder="Bestellen"
                value={form.buttonLabel}
                onChange={(e) => setForm((f) => ({ ...f, buttonLabel: e.target.value }))}
                className="w-full px-3 py-2 border border-primary-200 rounded-lg text-sm"
              />
            </div>
            <textarea
              placeholder="Beschrijving"
              value={form.content}
              onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
              rows={4}
              className="w-full px-3 py-2 border border-primary-200 rounded-lg"
            />
            <p className="text-xs text-gray-400">
              Link toevoegen: <code className="bg-gray-100 px-1 rounded">[link tekst](https://url.com)</code>
            </p>
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
          <p className="text-sm text-gray-500 py-4">Nog geen items. Voeg er een toe.</p>
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
                      {item.imageUrl && (
                        <div className="w-12 h-12 flex-shrink-0 rounded overflow-hidden bg-primary-100">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={item.imageUrl} alt="" className="w-full h-full object-cover" />
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          {item.publishFrom && item.publishFrom > Date.now() && (
                            <span className="text-xs px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
                              Zichtbaar vanaf {new Date(item.publishFrom).toLocaleDateString("nl-NL", { day: "numeric", month: "short", year: "numeric" })}
                            </span>
                          )}
                          {item.priceCents && (
                            <span className="text-xs px-1.5 py-0.5 rounded bg-green-100 text-green-800">
                              €{(item.priceCents / 100).toFixed(2)}
                            </span>
                          )}
                          {item.paymentUrl && (
                            <span className="text-xs px-1.5 py-0.5 rounded bg-blue-100 text-blue-800">
                              📎 Link
                            </span>
                          )}
                        </div>
                        <h3 className="font-medium text-primary-900">{item.title}</h3>
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2 whitespace-pre-wrap">
                          {item.content}
                        </p>
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
