"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

export function TestimonialsStrip() {
  const items = useQuery(api.testimonials.listActive, {});
  const submitReview = useMutation(api.testimonials.submitPending);

  const [mobileOpen, setMobileOpen] = useState(false);
  const [page, setPage] = useState(0);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", quote: "", stars: 5 });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formError, setFormError] = useState("");

  if (!items || items.length === 0) return null;

  const totalPages = Math.ceil(items.length / 3);
  const visible = items.slice(page * 3, (page + 1) * 3);
  const expandedItem = items.find((i) => i._id === expandedId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.quote.trim()) {
      setFormError("Vul je naam en review in.");
      return;
    }
    setSubmitting(true);
    setFormError("");
    try {
      await submitReview({ name: form.name.trim(), quote: form.quote.trim(), stars: form.stars });
      setSubmitted(true);
      setForm({ name: "", quote: "", stars: 5 });
    } catch {
      setFormError("Er ging iets mis. Probeer het opnieuw.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-sm mx-auto px-3 py-2">

      {/* Mobiel: ingeklapt tonen als link */}
      <div className="sm:hidden">
        {!mobileOpen ? (
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="w-full text-left text-[10px] text-gray-500 hover:text-gray-700 transition-colors py-0.5"
          >
            Wat anderen zeggen ›
          </button>
        ) : (
          <button
            type="button"
            onClick={() => { setMobileOpen(false); setExpandedId(null); setShowForm(false); }}
            className="text-[10px] text-gray-400 hover:text-gray-600 transition-colors mb-1.5"
          >
            ‹ Sluiten
          </button>
        )}
      </div>

      {/* Kaartjes: altijd zichtbaar op desktop, alleen na klik op mobiel */}
      <div className={`${mobileOpen ? "block" : "hidden"} sm:block`}>

      {/* 3-kaartjes grid */}
      <div className="grid grid-cols-3 gap-1.5">
        {visible.map((item) => {
          const isExpanded = expandedId === item._id;
          return (
            <button
              key={item._id}
              type="button"
              onClick={() => setExpandedId(isExpanded ? null : item._id)}
              className={`text-left rounded-lg px-2 py-2 flex flex-col gap-1 transition-all ${
                isExpanded
                  ? "bg-white/80 ring-1 ring-primary-300/50"
                  : "bg-white/55 hover:bg-white/70"
              }`}
            >
              <p className="text-[9px] leading-relaxed text-gray-700 line-clamp-2">
                &ldquo;{item.quote}&rdquo;
              </p>
              <p className="text-[9px] text-gray-500 italic truncate">{item.name}</p>
            </button>
          );
        })}
        {/* Opvulkaartje als minder dan 3 op de pagina */}
        {visible.length < 3 && Array.from({ length: 3 - visible.length }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}
      </div>

      {/* Uitgebreide view bij klik */}
      {expandedItem && (
        <div className="mt-1.5 bg-white/80 rounded-lg px-3 py-2.5 relative">
          <button
            type="button"
            onClick={() => setExpandedId(null)}
            className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
          >
            <X size={13} />
          </button>
          <p className="text-xs leading-relaxed text-gray-700 pr-4">
            &ldquo;{expandedItem.quote}&rdquo;
          </p>
          <p className="text-[10px] text-gray-500 italic mt-1.5">{expandedItem.name}</p>
        </div>
      )}

      {/* Paginering */}
      <div className="flex items-center justify-between mt-1.5">
        <div className="flex gap-1 items-center">
          {totalPages > 1 && (
            <>
              <button
                type="button"
                onClick={() => { setPage((p) => Math.max(0, p - 1)); setExpandedId(null); }}
                disabled={page === 0}
                className="p-0.5 text-gray-400 hover:text-gray-600 disabled:opacity-30"
              >
                <ChevronLeft size={14} />
              </button>
              <div className="flex gap-1">
                {Array.from({ length: totalPages }).map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => { setPage(i); setExpandedId(null); }}
                    className={`rounded-full transition-all ${
                      i === page ? "w-3 h-1.5 bg-gray-500" : "w-1.5 h-1.5 bg-gray-300"
                    }`}
                  />
                ))}
              </div>
              <button
                type="button"
                onClick={() => { setPage((p) => Math.min(totalPages - 1, p + 1)); setExpandedId(null); }}
                disabled={page === totalPages - 1}
                className="p-0.5 text-gray-400 hover:text-gray-600 disabled:opacity-30"
              >
                <ChevronRight size={14} />
              </button>
            </>
          )}
        </div>
        <button
          type="button"
          onClick={() => { setShowForm((v) => !v); setSubmitted(false); }}
          className="text-[10px] text-gray-500 hover:text-gray-700 transition-colors"
        >
          ✏ Deel jouw ervaring
        </button>
      </div>

      {/* Review-formulier voor klant */}
      {showForm && (
        <div className="mt-2 bg-white/80 rounded-lg px-3 py-3">
          {submitted ? (
            <div className="text-center py-1">
              <p className="text-xs text-primary-700 font-medium">Bedankt voor je review!</p>
              <p className="text-[10px] text-gray-500 mt-0.5">We beoordelen hem zo snel mogelijk.</p>
              <button
                type="button"
                onClick={() => { setShowForm(false); setSubmitted(false); }}
                className="mt-2 text-[10px] text-gray-400 hover:text-gray-600 underline"
              >
                Sluiten
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-2">
              <p className="text-[10px] font-medium text-gray-700">Jouw ervaring met Benji</p>
              <input
                type="text"
                placeholder="Je naam (bijv. Anne of Thomas, 34)"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                maxLength={60}
                className="w-full px-2 py-1.5 text-[11px] border border-gray-200 rounded-lg bg-white outline-none focus:ring-1 focus:ring-primary-400"
              />
              <textarea
                placeholder="Wat wil je anderen laten weten over Benji?"
                value={form.quote}
                onChange={(e) => setForm((f) => ({ ...f, quote: e.target.value }))}
                maxLength={500}
                rows={3}
                className="w-full px-2 py-1.5 text-[11px] border border-gray-200 rounded-lg bg-white outline-none focus:ring-1 focus:ring-primary-400 resize-none"
              />
              {formError && <p className="text-[10px] text-red-500">{formError}</p>}
              <div className="flex gap-2 items-center">
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-3 py-1.5 bg-primary-600 text-white rounded-lg text-[11px] font-medium hover:bg-primary-700 disabled:opacity-50"
                >
                  {submitting ? "Versturen…" : "Verstuur"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="text-[10px] text-gray-400 hover:text-gray-600"
                >
                  Annuleren
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      </div>{/* einde mobiel-toggle wrapper */}
    </div>
  );
}
