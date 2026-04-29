"use client";

import { useState } from "react";
import { api } from "@/convex/_generated/api";
import { useAdminQuery, useAdminMutation } from "../AdminAuthContext";
import { Gift, CheckCircle, Clock, Mail, User, Calendar, Package, Copy, Check, FlaskConical, X, Trash2 } from "lucide-react";

type GiftCode = {
  _id: string;
  code: string;
  slug: string;
  productName: string;
  subscriptionType: string;
  billingPeriod?: "monthly" | "quarterly" | "yearly";
  accessDays?: number;
  pricePaid?: number;
  giverName: string;
  giverEmail: string;
  recipientEmail?: string;
  personalMessage?: string;
  deliveryMethod: "direct" | "manual";
  status: "pending" | "redeemed";
  redeemedByEmail?: string;
  redeemedAt?: number;
  paymentIntentId: string;
  createdAt: number;
};

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text).catch(() => {});
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      className="ml-1.5 text-gray-400 hover:text-gray-600 transition-colors"
    >
      {copied ? <Check size={13} className="text-green-500" /> : <Copy size={13} />}
    </button>
  );
}

function ManualRedeemModal({
  gift,
  onClose,
  onSave,
}: {
  gift: GiftCode;
  onClose: () => void;
  onSave: (id: string, email: string) => Promise<void>;
}) {
  const [email, setEmail] = useState(gift.recipientEmail ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await onSave(gift._id, email);
      onClose();
    } catch (err: any) {
      setError(err.message || "Er is iets misgegaan.");
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-1">Handmatig inwisselen</h3>
        <p className="text-sm text-gray-500 mb-4">
          Code <span className="font-mono font-semibold text-gray-800">{gift.code}</span> markeren als gebruikt
        </p>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="email"
            placeholder="E-mailadres ontvanger"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-2 pt-1">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-semibold hover:bg-primary-700 disabled:opacity-50"
            >
              {saving ? "Opslaan…" : "Markeren als gebruikt"}
            </button>
            <button type="button" onClick={onClose} className="px-5 py-2.5 text-gray-600 hover:bg-gray-100 rounded-xl text-sm">
              Annuleren
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const BILLING_LABEL: Record<string, string> = {
  monthly: "Maand",
  quarterly: "Kwartaal",
  yearly: "Jaar",
};

type TestForm = {
  productName: string;
  subscriptionType: string;
  accessDays: string;
  giverName: string;
  giverEmail: string;
  recipientEmail: string;
  personalMessage: string;
};

const EMPTY_TEST: TestForm = {
  productName: "Talk To Benji — Jaartoegang",
  subscriptionType: "alles_in_1",
  accessDays: "365",
  giverName: "Testgever",
  giverEmail: "gever@test.nl",
  recipientEmail: "",
  personalMessage: "",
};

function TestCodeModal({ onClose, onCreate }: { onClose: () => void; onCreate: (f: TestForm) => Promise<string> }) {
  const [form, setForm] = useState<TestForm>(EMPTY_TEST);
  const [saving, setSaving] = useState(false);
  const [createdCode, setCreatedCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const set = (field: keyof TestForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const code = await onCreate(form);
      setCreatedCode(code);
    } finally {
      setSaving(false);
    }
  };

  const inputClass = "w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-400";

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
            <FlaskConical size={16} className="text-primary-500" />
            Testcode aanmaken
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>

        {createdCode ? (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">Code aangemaakt. Kopieer hem en ga naar <strong>/cadeau-inwisselen</strong> om de flow te testen.</p>
            <div className="bg-gray-50 border border-dashed border-gray-300 rounded-xl p-4 text-center">
              <p className="text-xs text-gray-400 mb-1 uppercase tracking-wide">Testcode</p>
              <p className="font-mono font-bold text-2xl tracking-widest text-gray-900">{createdCode}</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => { navigator.clipboard.writeText(createdCode).catch(() => {}); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
                className="flex-1 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-semibold hover:bg-primary-700"
              >
                {copied ? "Gekopieerd ✓" : "Kopieer code"}
              </button>
              <a
                href="/cadeau-inwisselen"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-2.5 border border-gray-200 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-50 text-center"
              >
                Inwisselpagina →
              </a>
            </div>
            <button onClick={onClose} className="w-full text-sm text-gray-400 hover:text-gray-600 py-1">Sluiten</button>
          </div>
        ) : (
          <form onSubmit={handleCreate} className="space-y-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Productnaam</label>
              <input type="text" value={form.productName} onChange={set("productName")} required className={inputClass} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Producttype</label>
                <input type="text" value={form.subscriptionType} onChange={set("subscriptionType")} required className={inputClass} />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Toegangsdagen</label>
                <input type="number" value={form.accessDays} onChange={set("accessDays")} required min="1" className={inputClass} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Naam gever</label>
                <input type="text" value={form.giverName} onChange={set("giverName")} required className={inputClass} />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Email gever</label>
                <input type="email" value={form.giverEmail} onChange={set("giverEmail")} required className={inputClass} />
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Email ontvanger <span className="text-gray-400">(optioneel)</span></label>
              <input type="email" value={form.recipientEmail} onChange={set("recipientEmail")} className={inputClass} />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Persoonlijk bericht <span className="text-gray-400">(optioneel)</span></label>
              <textarea value={form.personalMessage} onChange={set("personalMessage")} rows={2} className={inputClass} />
            </div>
            <button
              type="submit"
              disabled={saving}
              className="w-full py-2.5 bg-primary-600 text-white rounded-xl text-sm font-semibold hover:bg-primary-700 disabled:opacity-50"
            >
              {saving ? "Aanmaken…" : "Testcode aanmaken"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function CadeaucodesPage() {
  const rawCodes = useAdminQuery(api.giftCodes.listAll, {});
  const codes = rawCodes as GiftCode[] | undefined;
  const markRedeemedAdmin = useAdminMutation(api.giftCodes.markRedeemedAdmin);
  const adminCreateTestCode = useAdminMutation(api.giftCodes.adminCreateTestCode);
  const adminResetTestCode = useAdminMutation(api.giftCodes.adminResetTestCode);
  const adminDeleteTestCode = useAdminMutation(api.giftCodes.adminDeleteTestCode);

  const [filter, setFilter] = useState<"all" | "pending" | "redeemed">("all");
  const [redeemModal, setRedeemModal] = useState<GiftCode | null>(null);
  const [showTestModal, setShowTestModal] = useState(false);

  const all = codes ?? [];
  const filtered = filter === "all" ? all : all.filter((c) => c.status === filter);
  const pendingCount = all.filter((c) => c.status === "pending").length;
  const redeemedCount = all.filter((c) => c.status === "redeemed").length;

  const handleManualRedeem = async (id: string, email: string) => {
    await markRedeemedAdmin({ id: id as any, recipientEmail: email });
  };

  const handleResetTestCode = async (id: string) => {
    await adminResetTestCode({ id: id as any });
  };

  const handleDeleteTestCode = async (id: string) => {
    if (!confirm("Testcode permanent verwijderen?")) return;
    await adminDeleteTestCode({ id: id as any });
  };

  const handleCreateTestCode = async (form: TestForm): Promise<string> => {
    return await adminCreateTestCode({
      productName: form.productName,
      subscriptionType: form.subscriptionType,
      accessDays: parseInt(form.accessDays, 10),
      giverName: form.giverName,
      giverEmail: form.giverEmail,
      recipientEmail: form.recipientEmail || undefined,
      personalMessage: form.personalMessage || undefined,
    }) as string;
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cadeaucodes</h1>
          <p className="text-sm text-gray-500 mt-1">
            Overzicht van alle uitgegeven cadeaucodes — aangemaakt via de checkout
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowTestModal(true)}
            className="flex items-center gap-2 px-4 py-2 border border-primary-200 bg-primary-50 rounded-xl text-sm text-primary-700 hover:bg-primary-100 transition-colors"
          >
            <FlaskConical size={15} />
            Testcode
          </button>
          <a
            href="/cadeau-inwisselen"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <Gift size={15} />
            Inwisselpagina
          </a>
        </div>
      </div>

      {/* Statistieken */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Totaal uitgegeven", value: all.length, icon: Gift, color: "text-primary-600 bg-primary-50" },
          { label: "Nog niet ingewisseld", value: pendingCount, icon: Clock, color: "text-amber-600 bg-amber-50" },
          { label: "Ingewisseld", value: redeemedCount, icon: CheckCircle, color: "text-green-600 bg-green-50" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${color}`}>
              <Icon size={18} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{value}</p>
              <p className="text-xs text-gray-500">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        {(["all", "pending", "redeemed"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filter === f ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {f === "all" ? "Alle" : f === "pending" ? "Openstaand" : "Ingewisseld"}
          </button>
        ))}
      </div>

      {/* Lijst */}
      {codes === undefined ? (
        <div className="py-12 flex justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Gift size={32} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 text-sm">
            Nog geen cadeaucodes{filter !== "all" ? " in deze categorie" : ""}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((gift) => {
            const date = new Date(gift.createdAt).toLocaleDateString("nl-NL", {
              day: "numeric", month: "long", year: "numeric",
            });
            const redeemedDate = gift.redeemedAt
              ? new Date(gift.redeemedAt).toLocaleDateString("nl-NL", {
                  day: "numeric", month: "long", year: "numeric",
                })
              : null;
            const isPending = gift.status === "pending";

            return (
              <div
                key={gift._id}
                className={`bg-white rounded-xl border p-5 space-y-4 ${
                  isPending ? "border-amber-200" : "border-gray-200"
                }`}
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      isPending ? "bg-amber-50 text-amber-600" : "bg-green-50 text-green-600"
                    }`}>
                      {isPending ? <Clock size={16} /> : <CheckCircle size={16} />}
                    </div>
                    <div>
                      <div className="flex items-center gap-1">
                        <span className="font-mono font-bold text-gray-900 text-base tracking-wider">{gift.code}</span>
                        <CopyButton text={gift.code} />
                      </div>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        isPending ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700"
                      }`}>
                        {isPending ? "Openstaand" : "Ingewisseld"}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {isPending && (
                      <button
                        onClick={() => setRedeemModal(gift)}
                        className="text-xs text-gray-500 hover:text-gray-800 border border-gray-200 rounded-lg px-3 py-1.5 transition-colors"
                      >
                        Handmatig inwisselen
                      </button>
                    )}
                    {gift.code.startsWith("TEST-") && (
                      <>
                        {!isPending && (
                          <button
                            onClick={() => handleResetTestCode(gift._id)}
                            className="text-xs text-amber-600 hover:text-amber-800 border border-amber-200 rounded-lg px-3 py-1.5 transition-colors"
                          >
                            Reset
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteTestCode(gift._id)}
                          className="text-xs text-red-500 hover:text-red-700 border border-red-200 rounded-lg px-2 py-1.5 transition-colors"
                          title="Testcode verwijderen"
                        >
                          <Trash2 size={13} />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Details */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                  <div className="flex items-start gap-2">
                    <Package size={14} className="text-gray-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-gray-400">Product</p>
                      <p className="font-medium text-gray-800 leading-tight">{gift.productName}</p>
                      {gift.billingPeriod && (
                        <p className="text-xs text-gray-400">{BILLING_LABEL[gift.billingPeriod] ?? gift.billingPeriod}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <User size={14} className="text-gray-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-gray-400">Gever</p>
                      <p className="font-medium text-gray-800">{gift.giverName}</p>
                      <p className="text-xs text-gray-400">{gift.giverEmail}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <Mail size={14} className="text-gray-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-gray-400">{isPending ? "Gericht aan" : "Ingewisseld door"}</p>
                      <p className="font-medium text-gray-800">
                        {isPending ? (gift.recipientEmail ?? "—") : (gift.redeemedByEmail ?? "—")}
                      </p>
                      <p className="text-xs text-gray-400">
                        {gift.deliveryMethod === "direct" ? "Direct verstuurd" : "Handmatig bezorgd"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <Calendar size={14} className="text-gray-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-gray-400">Aangemaakt</p>
                      <p className="text-gray-700">{date}</p>
                    </div>
                  </div>

                  {redeemedDate && (
                    <div className="flex items-start gap-2">
                      <CheckCircle size={14} className="text-green-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-gray-400">Ingewisseld op</p>
                        <p className="text-gray-700">{redeemedDate}</p>
                      </div>
                    </div>
                  )}

                  {gift.pricePaid !== undefined && (
                    <div className="flex items-start gap-2">
                      <span className="text-gray-400 mt-0.5 text-xs flex-shrink-0">€</span>
                      <div>
                        <p className="text-xs text-gray-400">Betaald</p>
                        <p className="text-gray-700">€{gift.pricePaid.toFixed(2)}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Persoonlijk bericht */}
                {gift.personalMessage && (
                  <div className="border-l-4 border-primary-200 pl-3 py-1 bg-primary-50 rounded-r-lg">
                    <p className="text-xs text-gray-400 mb-0.5">Persoonlijk bericht</p>
                    <p className="text-sm text-gray-600 italic">"{gift.personalMessage}"</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {redeemModal && (
        <ManualRedeemModal
          gift={redeemModal}
          onClose={() => setRedeemModal(null)}
          onSave={handleManualRedeem}
        />
      )}

      {showTestModal && (
        <TestCodeModal
          onClose={() => setShowTestModal(false)}
          onCreate={handleCreateTestCode}
        />
      )}
    </div>
  );
}
