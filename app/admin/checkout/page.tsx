"use client";

import { useState } from "react";
import { useAdminQuery, useAdminMutation } from "../AdminAuthContext";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import {
  CreditCard, Plus, Edit, Trash2, Save, X, Eye, EyeOff, ExternalLink,
} from "lucide-react";

type CheckoutProduct = {
  _id: Id<"checkoutProducts">;
  slug: string;
  name: string;
  description?: string;
  priceInCents: number;
  stripePriceId?: string;
  subscriptionType: string;
  buttonText?: string;
  isLive: boolean;
  createdAt: number;
  updatedAt: number;
};

type FormState = {
  slug: string;
  name: string;
  description: string;
  priceInCents: string;
  stripePriceId: string;
  subscriptionType: string;
  buttonText: string;
  isLive: boolean;
};

const EMPTY_FORM: FormState = {
  slug: "",
  name: "",
  description: "",
  priceInCents: "",
  stripePriceId: "",
  subscriptionType: "alles_in_1",
  buttonText: "",
  isLive: false,
};

function opt(val: string): string | undefined {
  return val.trim() || undefined;
}

function formatPrice(cents: number): string {
  return new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(cents / 100);
}

export default function AdminCheckoutPage() {
  const products = useAdminQuery(api.checkoutProducts.list, {});
  const createProduct = useAdminMutation(api.checkoutProducts.create);
  const updateProduct = useAdminMutation(api.checkoutProducts.update);
  const removeProduct = useAdminMutation(api.checkoutProducts.remove);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<Id<"checkoutProducts"> | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  const set = (field: keyof FormState) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const setCheck = (field: keyof FormState) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => setForm((f) => ({ ...f, [field]: e.target.checked }));

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setShowForm(false);
  };

  const startEdit = (product: CheckoutProduct) => {
    setForm({
      slug: product.slug,
      name: product.name,
      description: product.description ?? "",
      priceInCents: String(product.priceInCents),
      stripePriceId: product.stripePriceId ?? "",
      subscriptionType: product.subscriptionType,
      buttonText: product.buttonText ?? "",
      isLive: product.isLive,
    });
    setEditingId(product._id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSave = async () => {
    if (!form.slug.trim() || !form.name.trim() || !form.priceInCents.trim()) return;
    const price = parseInt(form.priceInCents, 10);
    if (isNaN(price) || price <= 0) return;
    setSaving(true);
    try {
      const payload = {
        slug: form.slug.trim(),
        name: form.name.trim(),
        description: opt(form.description),
        priceInCents: price,
        stripePriceId: opt(form.stripePriceId),
        subscriptionType: form.subscriptionType,
        buttonText: opt(form.buttonText),
        isLive: form.isLive,
      };
      if (editingId) {
        await updateProduct({ id: editingId, ...payload });
      } else {
        await createProduct(payload);
      }
      resetForm();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: Id<"checkoutProducts">) => {
    if (!confirm("Weet je zeker dat je dit product wilt verwijderen?")) return;
    await removeProduct({ id });
  };

  const canSave =
    form.slug.trim() &&
    form.name.trim() &&
    form.priceInCents.trim() &&
    !isNaN(parseInt(form.priceInCents, 10));

  const inputClass =
    "w-full px-3 py-2 border border-primary-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-400";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1";
  const labelSmClass = "block text-xs text-gray-500 mb-1";

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-primary-900 flex items-center gap-2">
          <CreditCard size={28} className="text-primary-600" />
          Checkout producten
        </h1>
        <p className="text-sm text-primary-700 mt-1">
          Beheer betaalpagina's bereikbaar via /betalen/[slug].
        </p>
      </div>

      {/* Formulier */}
      <div className="bg-white rounded-xl border border-primary-200 p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-semibold text-primary-900">
            {showForm ? (editingId ? "Product bewerken" : "Nieuw product") : "Producten"}
          </h2>
          {!showForm && (
            <button
              type="button"
              onClick={() => { resetForm(); setShowForm(true); }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700"
            >
              <Plus size={18} />
              Nieuw product
            </button>
          )}
        </div>

        {showForm && (
          <div className="space-y-4 mb-6">
            {/* Link naar pagina bij bewerken */}
            {editingId && (
              <a
                href={`/betalen/${form.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-primary-600 hover:underline"
              >
                <ExternalLink size={15} />
                Bekijk pagina: /betalen/{form.slug}
              </a>
            )}

            {/* Basis */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>
                  Slug <span className="text-gray-400 font-normal text-xs">(URL: /betalen/slug)</span>
                </label>
                <input
                  type="text"
                  placeholder="niet-alleen"
                  value={form.slug}
                  onChange={set("slug")}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Productnaam *</label>
                <input
                  type="text"
                  placeholder="Niet Alleen — 30 dagen begeleiding"
                  value={form.name}
                  onChange={set("name")}
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <label className={labelSmClass}>Omschrijving (optioneel)</label>
              <textarea
                placeholder="Beschrijving van het product…"
                value={form.description}
                onChange={set("description")}
                rows={3}
                className={inputClass}
              />
            </div>

            {/* Prijs & stripe */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>
                  Prijs in centen * <span className="text-gray-400 font-normal text-xs">(bijv. 3700 = €37,00)</span>
                </label>
                <input
                  type="number"
                  placeholder="3700"
                  min="1"
                  value={form.priceInCents}
                  onChange={set("priceInCents")}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelSmClass}>Stripe Price ID (optioneel)</label>
                <input
                  type="text"
                  placeholder="price_1Abc..."
                  value={form.stripePriceId}
                  onChange={set("stripePriceId")}
                  className={inputClass}
                />
              </div>
            </div>

            {/* Abonnement type & knoptekst */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Abonnementstype *</label>
                <select value={form.subscriptionType} onChange={set("subscriptionType")} className={inputClass}>
                  <option value="alles_in_1">Alles in 1</option>
                  <option value="niet_alleen">Niet Alleen</option>
                  <option value="uitgebreid">Uitgebreid</option>
                </select>
              </div>
              <div>
                <label className={labelSmClass}>Knoptekst (standaard: "Betalen")</label>
                <input
                  type="text"
                  placeholder="Start mijn reis"
                  value={form.buttonText}
                  onChange={set("buttonText")}
                  className={inputClass}
                />
              </div>
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isLive}
                onChange={setCheck("isLive")}
                className="rounded border-primary-300 text-primary-600"
              />
              <span className="text-sm text-gray-700">Pagina is live (publiek zichtbaar)</span>
            </label>

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
                <X size={18} />
                Annuleren
              </button>
            </div>
          </div>
        )}

        {/* Lijst */}
        {!showForm && (
          <>
            {products === undefined ? (
              <div className="py-8 text-center text-primary-600">Laden…</div>
            ) : products.length === 0 ? (
              <p className="text-sm text-gray-500 py-4">Nog geen checkout producten.</p>
            ) : (
              <ul className="space-y-3">
                {products.map((product: CheckoutProduct) => (
                  <li
                    key={product._id}
                    className="p-4 rounded-lg border border-primary-200 bg-white hover:bg-primary-50/50"
                  >
                    <div className="flex justify-between items-start gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                              product.isLive
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {product.isLive ? "Live" : "Verborgen"}
                          </span>
                          <code className="text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                            /betalen/{product.slug}
                          </code>
                          <span className="text-xs font-semibold text-primary-700">
                            {formatPrice(product.priceInCents)}
                          </span>
                        </div>
                        <h3 className="font-medium text-primary-900 truncate">{product.name}</h3>
                        {product.description && (
                          <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{product.description}</p>
                        )}
                        <p className="text-xs text-gray-400 mt-0.5">
                          Type: {product.subscriptionType} &middot; Bijgewerkt{" "}
                          {new Date(product.updatedAt).toLocaleDateString("nl-NL", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {product.isLive && (
                          <a
                            href={`/betalen/${product.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
                            title="Bekijk pagina"
                          >
                            <ExternalLink size={17} />
                          </a>
                        )}
                        <button
                          type="button"
                          onClick={() => startEdit(product)}
                          className="p-2 text-primary-600 hover:bg-primary-100 rounded-lg"
                          title="Bewerken"
                        >
                          <Edit size={17} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(product._id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                          title="Verwijderen"
                        >
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
