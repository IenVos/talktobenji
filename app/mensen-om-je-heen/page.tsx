"use client";

import { useState, type ReactNode } from "react";
import Image from "next/image";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { SiteHeaderConcept } from "@/app/home-concept/SiteHeaderConcept";
import { SiteFooter } from "@/components/SiteFooter";
import Link from "next/link";

// ─── SVG iconen ───────────────────────────────────────────────────────────────

function IconBlog() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  );
}

function IconChat() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
    </svg>
  );
}

function IconUsers() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  );
}

function IconHeart() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 016.364 0L12 7.636l1.318-1.318a4.5 4.5 0 116.364 6.364L12 20.364l-7.682-7.682a4.5 4.5 0 010-6.364z" />
    </svg>
  );
}

// ─── Filter opties ────────────────────────────────────────────────────────────

type FilterId = "lezen" | "praten" | "groep" | "ander";

const FILTER_DEFAULTS: Record<FilterId, string> = {
  lezen:  "Ik wil anoniem lezen wat anderen meemaken",
  praten: "Ik wil met iemand praten maar weet niet hoe ik moet beginnen",
  groep:  "Ik zoek een groep bij mij in de buurt",
  ander:  "Ik wil weten wat ik kan doen voor iemand anders",
};

const FILTER_META: { id: FilterId; icon: ReactNode; kleur: string }[] = [
  { id: "lezen",  icon: <IconBlog />,  kleur: "bg-primary-700" },
  { id: "praten", icon: <IconChat />,  kleur: "bg-primary-600" },
  { id: "groep",  icon: <IconUsers />, kleur: "bg-primary-800" },
  { id: "ander",  icon: <IconHeart />, kleur: "bg-primary-600" },
];

function matchesFilter(cat: Categorie, filterId: FilterId | null): boolean {
  if (!filterId || filterId === "ander") return false;
  const tags = cat.filterTags ?? [];
  if (tags.length > 0) return tags.includes(filterId);
  // Fallback voor categorieën zonder tags: gebruik naamherkenning
  const lc = cat.naam.toLowerCase();
  if (filterId === "lezen")  return lc.includes("overlijden") || lc.includes("werk");
  if (filterId === "praten") return lc.includes("overlijden");
  if (filterId === "groep")  return true;
  return false;
}

// ─── Types ────────────────────────────────────────────────────────────────────

type Categorie = {
  _id: string;
  naam: string;
  volgorde: number;
  zichtbaar: boolean;
  imageUrl?: string | null;
  filterTags?: string[];
};

type Initiatief = {
  _id: string;
  categorie_id: string;
  naam: string;
  beschrijving: string;
  url: string;
  volgorde: number;
  zichtbaar: boolean;
  imageUrl?: string | null;
};

// ─── Hulpcomponent: initiatief kaart ─────────────────────────────────────────

function InitiatiefKaart({ init, uitgelicht }: { init: Initiatief; uitgelicht?: boolean }) {
  return (
    <a
      href={init.url}
      target="_blank"
      rel="noopener noreferrer"
      className={`block rounded-xl p-4 border transition-all hover:shadow-sm no-underline ${
        uitgelicht ? "border-primary-300 bg-primary-50" : "border-gray-200 bg-white hover:border-primary-300"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        {init.imageUrl && (
          <img src={init.imageUrl} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0 border border-gray-100" />
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-primary-900 mb-1">{init.naam}</p>
          <p className="text-xs text-primary-600 leading-relaxed">{init.beschrijving}</p>
        </div>
        <span className="flex-shrink-0 text-primary-400 mt-0.5">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6m0 0v6m0-6L10 14" />
          </svg>
        </span>
      </div>
      {uitgelicht && (
        <span className="inline-block mt-2 text-[10px] font-semibold uppercase tracking-wide text-primary-500">
          Aanbevolen
        </span>
      )}
    </a>
  );
}

// ─── Categorieblok ────────────────────────────────────────────────────────────

function CategorieBlok({ cat, inits, actieveFilter }: { cat: Categorie; inits: Initiatief[]; actieveFilter: FilterId | null }) {
  if (inits.length === 0) return null;

  function isUitgelicht(init: Initiatief): boolean {
    if (actieveFilter === "praten" && init.naam === "SteunPunt Rouw") return true;
    if (actieveFilter === "groep" && init.naam === "Rouwcafé") return true;
    return false;
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        {cat.imageUrl && (
          <img
            src={cat.imageUrl}
            alt=""
            className="w-10 h-10 rounded-lg object-cover flex-shrink-0 border border-gray-100"
          />
        )}
        <h3 className="text-base font-bold text-primary-900">{cat.naam}</h3>
      </div>
      <div className="space-y-3">
        {inits.map((init) => (
          <InitiatiefKaart key={init._id} init={init} uitgelicht={isUitgelicht(init)} />
        ))}
      </div>
    </div>
  );
}

// ─── Hoofdpagina ─────────────────────────────────────────────────────────────

export default function MensenOmJeHeenPage() {
  const [actieveFilter, setActieveFilter] = useState<FilterId | null>(null);

  const paginaTeksten = useQuery(api.mensenOmJeHeen.getPaginaTeksten, {});
  const categorieen = useQuery(api.mensenOmJeHeen.listCategorieen, {}) as Categorie[] | undefined;
  const alleInitiatieven = useQuery(api.mensenOmJeHeen.listInitiatieven, {}) as Initiatief[] | undefined;

  const heroTitel = paginaTeksten?.hero_titel ?? "Er zijn mensen die begrijpen wat jij doormaakt.";
  const heroSubtitel = paginaTeksten?.hero_subtitel ?? "Hier vind je initiatieven, groepen en mensen die er voor je zijn — voor elk soort verlies.";

  const filterOpties = FILTER_META.map((m) => ({
    ...m,
    label: (paginaTeksten as any)?.[`filter_${m.id}`] ?? FILTER_DEFAULTS[m.id],
  }));

  const zichtbareCats = (categorieen ?? []).filter((c) => c.zichtbaar);
  const zichtbareInits = (alleInitiatieven ?? []).filter((i) => i.zichtbaar);

  function initiatieven(catId: string): Initiatief[] {
    return zichtbareInits.filter((i) => i.categorie_id === catId).sort((a, b) => a.volgorde - b.volgorde);
  }

  const gefilterdeCats = actieveFilter && actieveFilter !== "ander"
    ? zichtbareCats.filter((c) => matchesFilter(c, actieveFilter))
    : [];

  return (
    <div className="min-h-screen bg-white">
      <SiteHeaderConcept />

      {/* Hero */}
      <section className="relative bg-primary-900 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <Image src="/images/achtergrond.png" alt="" fill className="object-cover object-center" priority />
        </div>
        <div className="relative max-w-3xl mx-auto px-6 py-20 sm:py-28 text-center">
          <h1 className="text-2xl sm:text-4xl font-bold leading-tight text-balance mb-4">{heroTitel}</h1>
          <p className="text-base sm:text-lg text-primary-200 leading-relaxed text-balance max-w-xl mx-auto">{heroSubtitel}</p>
        </div>
      </section>

      {/* Filter sectie — alleen zichtbaar als er nog geen keuze is gemaakt */}
      {!actieveFilter && (
        <section className="max-w-3xl mx-auto px-4 sm:px-6 pt-10 pb-12">
          <h2 className="text-lg sm:text-xl font-bold text-primary-900 text-center mb-6 text-balance">
            Wat past het beste bij jou nu?
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {filterOpties.map((optie) => (
              <button
                key={optie.id}
                onClick={() => setActieveFilter(optie.id)}
                className="flex items-center gap-3 text-left px-4 py-4 rounded-xl border border-primary-100 bg-white hover:border-primary-300 hover:shadow-sm transition-all"
              >
                <div className={`w-10 h-10 rounded-xl ${optie.kleur} text-white flex items-center justify-center flex-shrink-0`}>
                  {optie.icon}
                </div>
                <span className="text-sm text-primary-900 leading-snug font-medium">{optie.label}</span>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Resultaten — zichtbaar na een keuze */}
      {actieveFilter && (() => {
        const actieveOptie = filterOpties.find((o) => o.id === actieveFilter)!;
        return (
          <>
            {/* Header met gekozen optie + terugknop */}
            <div className="border-b border-gray-100 bg-white">
              <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-6 pb-5">
                <button
                  onClick={() => setActieveFilter(null)}
                  className="flex items-center gap-1.5 text-gray-400 hover:text-gray-600 transition-colors mb-5 group"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="group-hover:-translate-x-0.5 transition-transform">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                  <span className="text-sm">Terug</span>
                </button>
                <div className="flex items-center gap-3">
                  <div className={`w-11 h-11 rounded-xl ${actieveOptie.kleur} text-white flex items-center justify-center flex-shrink-0`}>
                    {actieveOptie.icon}
                  </div>
                  <p className="text-base font-semibold text-primary-900 leading-snug">{actieveOptie.label}</p>
                </div>
              </div>
            </div>

            <section className="max-w-3xl mx-auto px-4 sm:px-6 py-10 pb-16">
              {/* Speciale inhoud voor "ander" */}
              {actieveFilter === "ander" && (
                <div className="rounded-2xl p-6 bg-primary-50 border border-primary-200">
                  <p className="text-sm font-semibold text-primary-900 mb-2">
                    {(paginaTeksten as any)?.filter_ander_blok_titel ?? "Er zijn voor iemand begint met luisteren."}
                  </p>
                  <p className="text-sm text-primary-700 leading-relaxed">
                    {(paginaTeksten as any)?.filter_ander_blok_tekst ?? "Niet met de juiste woorden. Je hoeft geen oplossing te hebben. Aanwezig zijn, vragen stellen zonder te dringen, gewoon er zijn — dat is al heel veel."}
                  </p>
                </div>
              )}

              {/* Matching categorieën */}
              {actieveFilter !== "ander" && gefilterdeCats.length > 0 && (
                <div className="space-y-10">
                  {gefilterdeCats.map((cat) => (
                    <CategorieBlok key={cat._id} cat={cat} inits={initiatieven(cat._id)} actieveFilter={actieveFilter} />
                  ))}
                </div>
              )}

              {/* Fallback: geen tags gekoppeld in admin → toon alles */}
              {actieveFilter !== "ander" && gefilterdeCats.length === 0 && (
                <div className="space-y-10">
                  {zichtbareCats.map((cat) => (
                    <CategorieBlok key={cat._id} cat={cat} inits={initiatieven(cat._id)} actieveFilter={null} />
                  ))}
                </div>
              )}
            </section>
          </>
        );
      })()}

      {/* Niet Alleen promo */}
      <section className="bg-primary-50 border-t border-primary-100">
        <div className="max-w-2xl mx-auto px-6 py-14 text-center">
          <p className="text-xs font-semibold uppercase tracking-wide text-primary-400 mb-3">30 dagen begeleiding</p>
          <h2 className="text-xl sm:text-2xl font-bold text-primary-900 mb-4 text-balance">
            Niet Alleen
          </h2>
          <p className="text-sm text-primary-600 leading-relaxed mb-6 max-w-lg mx-auto text-balance">
            Een 30-daagse begeleiding via dagelijkse berichten. Een kleine stap per dag, om niet meer alleen te staan in je verlies.
          </p>
          <Link
            href="/lp/je-hoeft-het-niet-alleen-te-doen"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary-800 text-white text-sm font-semibold rounded-xl hover:bg-primary-700 transition-colors"
          >
            Lees meer over Niet Alleen
          </Link>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
