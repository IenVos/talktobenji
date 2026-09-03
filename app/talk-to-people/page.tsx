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

type FilterId = string;

const ICON_MAP: Record<string, ReactNode> = {
  heart: <IconHeart />,
  chat:  <IconChat />,
  users: <IconUsers />,
  blog:  <IconBlog />,
  paw: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 4a1.5 1.5 0 100 3 1.5 1.5 0 000-3zM16 4a1.5 1.5 0 100 3 1.5 1.5 0 000-3zM5.5 9a1.5 1.5 0 100 3 1.5 1.5 0 000-3zM18.5 9a1.5 1.5 0 100 3 1.5 1.5 0 000-3z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 11c-2.8 0-5 2-5 4.5 0 2 1.2 3 2.8 3.3.7.1 1.4.2 2.2.2s1.5-.1 2.2-.2C15.8 18.5 17 17.5 17 15.5c0-2.5-2.2-4.5-5-4.5z" />
    </svg>
  ),
  leaf: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 22V12" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 12C12 7 8 3 3 3c0 5 3 9 9 9z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 12c0-5 4-9 9-9-1 5-4 9-9 9z" />
    </svg>
  ),
};

const FILTER_HARDCODED = [
  { id: "lezen",  tekst: "Ik wil anoniem lezen wat anderen meemaken",              iconNaam: "blog"  },
  { id: "praten", tekst: "Ik wil met iemand praten maar weet niet hoe ik moet beginnen", iconNaam: "chat"  },
  { id: "groep",  tekst: "Ik ben op zoek naar iets om te doen waarmee ik weer contact kan maken met anderen.", iconNaam: "users" },
  { id: "ander",  tekst: "Ik wil graag weten hoe ik iemand anders kan helpen.",    iconNaam: "heart" },
];

function matchesFilter(cat: Categorie, filterId: FilterId | null): boolean {
  if (!filterId) return false;
  // Strikt: een categorie verschijnt alleen onder de filter(s) die in de admin
  // zijn aangevinkt ("Toon bij filter"). Geen tag = nergens zichtbaar.
  return (cat.filterTags ?? []).includes(filterId);
}

// ─── Types ────────────────────────────────────────────────────────────────────

type Categorie = {
  _id: string;
  naam: string;
  volgorde: number;
  zichtbaar: boolean;
  imageUrl?: string | null;
  filterTags?: string[];
  emoji?: string;
};

type Initiatief = {
  _id: string;
  categorie_id: string;
  naam: string;
  beschrijving: string;
  url: string;
  artikelSlug?: string | null;
  volgorde: number;
  zichtbaar: boolean;
  imageUrl?: string | null;
};

// ─── Hulpcomponent: initiatief kaart (homepage-stijl) ─────────────────────────

function InitiatiefKaart({ init, uitgelicht, iconKleur }: { init: Initiatief; uitgelicht?: boolean; iconKleur: string }) {
  const slug = (init.artikelSlug ?? "").trim();
  const intern = slug.length > 0;
  const href = intern ? `/blog/${slug}` : init.url;

  const kaartClass = `group flex flex-col h-full rounded-2xl p-6 bg-white border transition-all no-underline hover:shadow-md ${
    uitgelicht ? "border-primary-300 ring-1 ring-primary-200" : "border-primary-100"
  }`;

  const inner = (
    <>
      {init.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={init.imageUrl}
          alt={init.naam}
          className="w-16 h-16 rounded-xl object-contain bg-white border border-primary-100 p-1.5 flex-shrink-0 mb-4"
        />
      ) : (
        <div className="w-11 h-11 rounded-xl flex items-center justify-center text-white flex-shrink-0 mb-4" style={{ background: iconKleur }}>
          <IconHeart />
        </div>
      )}
      <p className="text-base font-bold text-primary-900 mb-2 leading-snug">{init.naam}</p>
      <p className="text-sm text-primary-600 leading-relaxed flex-1">{init.beschrijving}</p>
      {uitgelicht && (
        <span className="inline-block mt-3 text-[10px] font-semibold uppercase tracking-wide text-primary-500">
          Aanbevolen
        </span>
      )}
      <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-amber-600 group-hover:text-amber-700 transition-colors">
        Lees meer
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} className="group-hover:translate-x-0.5 transition-transform">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </span>
    </>
  );

  return intern ? (
    <Link href={href} className={kaartClass}>{inner}</Link>
  ) : (
    <a href={href} target="_blank" rel="noopener noreferrer" className={kaartClass}>{inner}</a>
  );
}

// ─── Categorieblok ────────────────────────────────────────────────────────────

function CategorieBlok({ cat, inits, actieveFilter, iconKleur }: { cat: Categorie; inits: Initiatief[]; actieveFilter: FilterId | null; iconKleur: string }) {
  if (inits.length === 0) return null;

  function isUitgelicht(init: Initiatief): boolean {
    if (actieveFilter === "praten" && init.naam === "SteunPunt Rouw") return true;
    if (actieveFilter === "groep" && init.naam === "Rouwcafé") return true;
    return false;
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-5">
        {(cat.emoji || cat.imageUrl) && (
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-primary-100 border border-primary-200">
            {cat.emoji ? (
              <span className="text-xl leading-none">{cat.emoji}</span>
            ) : (
              <img src={cat.imageUrl!} alt="" className="w-full h-full rounded-xl object-cover" />
            )}
          </div>
        )}
        <h3 className="text-base font-bold text-primary-900">{cat.naam}</h3>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {inits.map((init) => (
          <InitiatiefKaart key={init._id} init={init} uitgelicht={isUitgelicht(init)} iconKleur={iconKleur} />
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
  const rawFilterButtons = useQuery(api.mensenOmJeHeen.listFilterButtons, {}) as { _id: string; tagId: string; tekst: string; titel?: string; beschrijving?: string; linkTekst?: string; iconNaam: string; volgorde: number; zichtbaar: boolean }[] | undefined;

  const heroTitel = paginaTeksten?.hero_titel ?? "Er zijn mensen die begrijpen wat jij doormaakt.";
  const heroSubtitel = paginaTeksten?.hero_subtitel ?? "Hier vind je initiatieven, groepen en mensen die er voor je zijn — voor elk soort verlies.";

  // Achtergrondkleuren per sectie (admin-instelbaar), met een lichte standaard.
  const filterKleur = (paginaTeksten as any)?.sectie_filter_kleur || "#eef4f8";
  const resultatenKleur = (paginaTeksten as any)?.sectie_resultaten_kleur || "#eef4f8";
  const iconKleur = (paginaTeksten as any)?.kaart_icoon_kleur || "#7ec8e3";
  // Wacht met renderen van de kaartjes tot de kleuren geladen zijn, anders flitst
  // eerst de standaardkleur (lichtblauw) voordat de ingestelde kleur binnenkomt.
  const paginaKlaar = paginaTeksten !== undefined;

  const filterOpties = (
    rawFilterButtons && rawFilterButtons.length > 0
      ? [...rawFilterButtons].filter((f) => f.zichtbaar).sort((a, b) => a.volgorde - b.volgorde)
      : FILTER_HARDCODED
  ).map((f) => {
    const af = f as any;
    return {
      id: ("tagId" in f ? f.tagId : af.id) as string,
      label: ((af.titel && String(af.titel).trim()) || f.tekst) as string,
      beschrijving: (af.beschrijving ?? "") as string,
      linkTekst: ((af.linkTekst && String(af.linkTekst).trim()) || "Bekijk wat er is") as string,
      icon: ICON_MAP[f.iconNaam] ?? <IconHeart />,
    };
  });

  const zichtbareCats = (categorieen ?? []).filter((c) => c.zichtbaar);
  const zichtbareInits = (alleInitiatieven ?? []).filter((i) => i.zichtbaar);

  function initiatieven(catId: string): Initiatief[] {
    return zichtbareInits.filter((i) => i.categorie_id === catId).sort((a, b) => a.volgorde - b.volgorde);
  }

  const gefilterdeCats = actieveFilter
    ? zichtbareCats.filter((c) => matchesFilter(c, actieveFilter))
    : [];

  // Geen scrollIntoView meer: dat liet het venster verspringen bij elke keuze.
  function kiesFilter(id: FilterId | null) {
    setActieveFilter(id);
  }

  return (
    <div className="min-h-screen flex flex-col bg-primary-900">
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
      {!paginaKlaar && <div className="flex-1" style={{ background: filterKleur }} />}

      {paginaKlaar && !actieveFilter && (
        <section className="w-full flex-1" style={{ background: filterKleur }}>
          <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-12 pb-16">
            <h2 className="text-lg sm:text-xl font-bold text-primary-900 text-center mb-6 text-balance">
              Wat past het beste bij jou nu?
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filterOpties.map((optie) => (
                <button
                  key={optie.id}
                  onClick={() => kiesFilter(optie.id)}
                  className="group text-left flex flex-col rounded-2xl p-6 bg-white border border-primary-100 hover:shadow-md transition-all"
                >
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center text-white flex-shrink-0 mb-4" style={{ background: iconKleur }}>
                    {optie.icon}
                  </div>
                  <p className="text-base font-bold text-primary-900 mb-2 leading-snug">{optie.label}</p>
                  {optie.beschrijving && (
                    <p className="text-sm text-primary-600 leading-relaxed flex-1">{optie.beschrijving}</p>
                  )}
                  <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-amber-600 group-hover:text-amber-700 transition-colors">
                    {optie.linkTekst}
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} className="group-hover:translate-x-0.5 transition-transform">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </span>
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Resultaten — zichtbaar na een keuze */}
      {paginaKlaar && actieveFilter && (() => {
        const actieveOptie = filterOpties.find((o) => o.id === actieveFilter)!;
        return (
          <div className="w-full flex-1" style={{ background: resultatenKleur }}>
            {/* Header met gekozen optie + terugknop */}
            <div className="border-b border-black/5">
              <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-6 pb-5">
                <button
                  onClick={() => kiesFilter(null)}
                  className="flex items-center gap-1.5 text-gray-500 hover:text-gray-700 transition-colors mb-5 group"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="group-hover:-translate-x-0.5 transition-transform">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                  <span className="text-sm">Terug</span>
                </button>
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl text-white flex items-center justify-center flex-shrink-0" style={{ background: iconKleur }}>
                    {actieveOptie.icon}
                  </div>
                  <p className="text-base font-semibold text-primary-900 leading-snug">{actieveOptie.label}</p>
                </div>
              </div>
            </div>

            {/* Inhoud */}
            <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 pb-16">
              {gefilterdeCats.length > 0 && (
                <div className="space-y-12">
                  {gefilterdeCats.map((cat) => (
                    <CategorieBlok key={cat._id} cat={cat} inits={initiatieven(cat._id)} actieveFilter={actieveFilter} iconKleur={iconKleur} />
                  ))}
                </div>
              )}

              {actieveFilter === "ander" && gefilterdeCats.length === 0 && (
                <div className="rounded-2xl p-6 bg-white border border-primary-100 max-w-2xl">
                  <p className="text-sm font-semibold text-primary-900 mb-2">
                    {(paginaTeksten as any)?.filter_ander_blok_titel ?? "Er zijn voor iemand begint met luisteren."}
                  </p>
                  <p className="text-sm text-primary-700 leading-relaxed">
                    {(paginaTeksten as any)?.filter_ander_blok_tekst ?? "Niet met de juiste woorden. Je hoeft geen oplossing te hebben. Aanwezig zijn, vragen stellen zonder te dringen, gewoon er zijn — dat is al heel veel."}
                  </p>
                </div>
              )}

              {actieveFilter !== "ander" && gefilterdeCats.length === 0 && (
                <div className="rounded-2xl p-6 bg-white border border-primary-100 max-w-2xl">
                  <p className="text-sm text-primary-700 leading-relaxed">Hier staat nog niets bij deze keuze. Kies een andere optie, of kom later terug.</p>
                </div>
              )}
            </div>
          </div>
        );
      })()}

      <SiteFooter />
    </div>
  );
}
