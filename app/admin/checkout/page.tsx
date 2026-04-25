"use client";

import { useState, useRef } from "react";
import { useAdminQuery, useAdminMutation, useAdminAuth } from "../AdminAuthContext";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import {
  CreditCard, Plus, Edit, Trash2, Save, X, ExternalLink, Send, Copy,
} from "lucide-react";

type CheckoutProduct = {
  _id: Id<"checkoutProducts">;
  slug: string;
  name: string;
  kortNaam?: string;
  verliesType?: string;
  description?: string;
  priceInCents: number;
  stripePriceId?: string;
  subscriptionType: string;
  buttonText?: string;
  imageStorageId?: Id<"_storage">;
  imageUrl?: string | null;
  isLive: boolean;
  followUpEmailSubject?: string;
  followUpEmailBody?: string;
  createdAt: number;
  updatedAt: number;
};

type FormState = {
  slug: string;
  name: string;
  kortNaam: string;
  verliesType: string;
  description: string;
  priceInCents: string;
  stripePriceId: string;
  subscriptionType: string;
  buttonText: string;
  imageStorageId?: Id<"_storage">;
  imageFile: File | null;
  isLive: boolean;
  followUpEmailSubject: string;
  followUpEmailBody: string;
};

const EMPTY_FORM: FormState = {
  slug: "",
  name: "",
  kortNaam: "",
  verliesType: "",
  description: "",
  priceInCents: "",
  stripePriceId: "",
  subscriptionType: "alles_in_1",
  buttonText: "",
  imageStorageId: undefined,
  imageFile: null,
  isLive: false,
  followUpEmailSubject: "",
  followUpEmailBody: "",
};

function opt(val: string): string | undefined {
  return val.trim() || undefined;
}

function formatPrice(cents: number): string {
  return new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(cents / 100);
}

export default function AdminCheckoutPage() {
  const { adminToken } = useAdminAuth();
  const products = useAdminQuery(api.checkoutProducts.list, {});
  const verliesTypen = useAdminQuery(api.verliesTypen.list, {});
  const createProduct = useAdminMutation(api.checkoutProducts.create);
  const updateProduct = useAdminMutation(api.checkoutProducts.update);
  const removeProduct = useAdminMutation(api.checkoutProducts.remove);
  const generateUploadUrl = useAdminMutation(api.checkoutProducts.generateUploadUrl);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<Id<"checkoutProducts"> | null>(null);
  const [editingImageUrl, setEditingImageUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [testEmail, setTestEmail] = useState("");
  const [sendingTest, setSendingTest] = useState(false);
  const [testStatus, setTestStatus] = useState<"idle" | "sent" | "error">("idle");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const set = (field: keyof FormState) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const setCheck = (field: keyof FormState) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => setForm((f) => ({ ...f, [field]: e.target.checked }));

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setEditingImageUrl(null);
    setShowForm(false);
  };

  const startDuplicate = (product: CheckoutProduct) => {
    setForm({
      slug: `${product.slug}-kopie`,
      name: `${product.name} (kopie)`,
      kortNaam: product.kortNaam ?? "",
      verliesType: product.verliesType ?? "",
      description: product.description ?? "",
      priceInCents: String(product.priceInCents),
      stripePriceId: "",
      subscriptionType: product.subscriptionType,
      buttonText: product.buttonText ?? "",
      imageStorageId: product.imageStorageId,
      imageFile: null,
      isLive: false,
      followUpEmailSubject: product.followUpEmailSubject ?? "",
      followUpEmailBody: product.followUpEmailBody ?? "",
    });
    setEditingImageUrl(product.imageUrl ?? null);
    setEditingId(null);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const startEdit = (product: CheckoutProduct) => {
    setForm({
      slug: product.slug,
      name: product.name,
      kortNaam: product.kortNaam ?? "",
      verliesType: product.verliesType ?? "",
      description: product.description ?? "",
      priceInCents: String(product.priceInCents),
      stripePriceId: product.stripePriceId ?? "",
      subscriptionType: product.subscriptionType,
      buttonText: product.buttonText ?? "",
      imageStorageId: product.imageStorageId,
      imageFile: null,
      isLive: product.isLive,
      followUpEmailSubject: product.followUpEmailSubject ?? "",
      followUpEmailBody: product.followUpEmailBody ?? "",
    });
    setEditingImageUrl(product.imageUrl ?? null);
    setEditingId(product._id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const uploadFile = async (file: File): Promise<Id<"_storage">> => {
    const url = await generateUploadUrl();
    const res = await fetch(url, { method: "POST", body: file, headers: { "Content-Type": file.type } });
    const { storageId } = await res.json();
    return storageId as Id<"_storage">;
  };

  const handleSave = async () => {
    if (!form.slug.trim() || !form.name.trim() || !form.priceInCents.trim()) return;
    const price = parseInt(form.priceInCents, 10);
    if (isNaN(price) || price <= 0) return;
    setSaving(true);
    try {
      let imageStorageId = form.imageStorageId;
      if (form.imageFile) {
        imageStorageId = await uploadFile(form.imageFile);
      }
      const payload = {
        slug: form.slug.trim(),
        name: form.name.trim(),
        kortNaam: opt(form.kortNaam),
        verliesType: opt(form.verliesType),
        description: opt(form.description),
        priceInCents: price,
        stripePriceId: opt(form.stripePriceId),
        subscriptionType: form.subscriptionType,
        buttonText: opt(form.buttonText),
        imageStorageId,
        isLive: form.isLive,
        followUpEmailSubject: opt(form.followUpEmailSubject),
        followUpEmailBody: opt(form.followUpEmailBody),
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

  // Preview URL: newly selected file takes priority over existing stored URL
  const previewUrl = form.imageFile
    ? URL.createObjectURL(form.imageFile)
    : editingImageUrl ?? null;

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
              <label className={labelSmClass}>
                Korte naam <span className="text-gray-400">(optioneel — voor omzetpagina; laat leeg om volledige naam te gebruiken)</span>
              </label>
              <input
                type="text"
                placeholder="N.A."
                value={form.kortNaam}
                onChange={set("kortNaam")}
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelSmClass}>
                Dagelijkse mailreeks <span className="text-gray-400">(optioneel — alleen invullen als dit product het Niet Alleen programma activeert)</span>
              </label>
              <select
                value={form.verliesType}
                onChange={set("verliesType")}
                className={inputClass}
              >
                <option value="">Geen — alleen bevestigingsmail</option>
                {(verliesTypen ?? []).map((t: { code: string; naam: string }) => (
                  <option key={t.code} value={t.code}>{t.naam}</option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelSmClass}>Omschrijving (optioneel)</label>
              <textarea
                placeholder="Beschrijving van het product…"
                value={form.description}
                onChange={set("description")}
                rows={4}
                className={inputClass}
              />
            </div>

            {/* Afbeelding upload */}
            <div>
              <label className={labelSmClass}>Afbeelding (optioneel)</label>
              {previewUrl && (
                <div className="mb-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="rounded-xl object-cover max-h-48 w-full"
                  />
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0] ?? null;
                  setForm((f) => ({ ...f, imageFile: file }));
                }}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-2 border border-primary-200 rounded-lg text-sm text-primary-700 hover:bg-primary-50"
              >
                {previewUrl ? "Andere afbeelding kiezen" : "Afbeelding uploaden"}
              </button>
              {previewUrl && (
                <button
                  type="button"
                  onClick={() => {
                    setForm((f) => ({ ...f, imageFile: null, imageStorageId: undefined }));
                    setEditingImageUrl(null);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                  className="ml-2 px-3 py-2 border border-red-200 rounded-lg text-sm text-red-600 hover:bg-red-50"
                >
                  Verwijderen
                </button>
              )}
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
                <label className={labelClass}>
                  Producttype * <span className="text-gray-400 font-normal text-xs">(unieke code per product)</span>
                </label>
                <input
                  type="text"
                  placeholder="troostende_woorden"
                  value={form.subscriptionType}
                  onChange={set("subscriptionType")}
                  className={inputClass}
                />
                <p className="text-xs text-gray-400 mt-1">Gebruik alleen kleine letters en underscores. Voorbeelden: <span className="font-mono">niet_alleen</span>, <span className="font-mono">er_zijn</span>, <span className="font-mono">troostende_woorden</span></p>
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

            {/* Bevestigingsmail na aankoop */}
            <div className="border-t border-primary-100 pt-4 space-y-3">
              <p className="text-sm font-medium text-primary-900">
                Bevestigingsmail na aankoop{" "}
                <span className="text-xs text-gray-400 font-normal">
                  (optioneel — laat leeg om geen mail te sturen)
                </span>
              </p>
              <div>
                <label className={labelSmClass}>
                  Onderwerp <span className="text-gray-400">— gebruik &#123;naam&#125; voor voornaam koper</span>
                </label>
                <input
                  type="text"
                  placeholder="Je gids staat klaar, {naam}!"
                  value={form.followUpEmailSubject}
                  onChange={set("followUpEmailSubject")}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelSmClass}>
                  Tekst <span className="text-gray-400">— &#123;naam&#125; = voornaam · lege regel = nieuwe alinea · [linktekst](https://...) = klikbare link</span>
                </label>
                <textarea
                  placeholder={`Hi {naam},\n\nJe kunt de gids hier vinden: [Er Zijn](https://talktobenji.com/er-zijn)\n\nVeel leesplezier!`}
                  value={form.followUpEmailBody}
                  onChange={set("followUpEmailBody")}
                  rows={6}
                  className={inputClass}
                />
              </div>
              {/* Testmail versturen */}
              {form.followUpEmailSubject && form.followUpEmailBody && (
                <div className="flex items-center gap-2 flex-wrap">
                  <input
                    type="email"
                    placeholder="jouw@email.com"
                    value={testEmail}
                    onChange={(e) => { setTestEmail(e.target.value); setTestStatus("idle"); }}
                    className="flex-1 min-w-0 px-3 py-2 border border-primary-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
                  />
                  <button
                    type="button"
                    disabled={sendingTest || !testEmail}
                    onClick={async () => {
                      setSendingTest(true);
                      setTestStatus("idle");
                      try {
                        const res = await fetch("/api/admin/send-test-email", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            adminToken,
                            toEmail: testEmail,
                            subject: form.followUpEmailSubject,
                            body: form.followUpEmailBody,
                            productName: form.name,
                          }),
                        });
                        setTestStatus(res.ok ? "sent" : "error");
                      } catch {
                        setTestStatus("error");
                      } finally {
                        setSendingTest(false);
                      }
                    }}
                    className="inline-flex items-center gap-2 px-3 py-2 border border-primary-300 rounded-lg text-sm text-primary-700 hover:bg-primary-50 disabled:opacity-50 shrink-0"
                  >
                    <Send size={15} />
                    {sendingTest ? "Versturen…" : "Testmail sturen"}
                  </button>
                  {testStatus === "sent" && <span className="text-sm text-green-600">✓ Verzonden</span>}
                  {testStatus === "error" && <span className="text-sm text-red-600">Mislukt</span>}
                </div>
              )}
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
                          onClick={() => startDuplicate(product)}
                          className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
                          title="Dupliceren"
                        >
                          <Copy size={17} />
                        </button>
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
