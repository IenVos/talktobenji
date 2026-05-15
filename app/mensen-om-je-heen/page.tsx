"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { SiteHeaderConcept } from "@/app/home-concept/SiteHeaderConcept";
import { SiteFooter } from "@/components/SiteFooter";
import Link from "next/link";

// ─── Filter opties ────────────────────────────────────────────────────────────

const FILTER_OPTIES = [
  {
    id: "lezen",
    label: "Ik wil anoniem lezen wat anderen meemaken",
    icoon: "📖",
  },
  {
    id: "praten",
    label: "Ik wil met iemand praten maar weet niet hoe ik moet beginnen",
    icoon: "💬",
  },
  {
    id: "groep",
    label: "Ik zoek een groep bij mij in de buurt",
    icoon: "🤝",
  },
  {
    id: "ander",
    label: "Ik wil weten wat ik kan doen voor iemand anders",
    icoon: "❤️",
  },
] as const;

type FilterId = (typeof FILTER_OPTIES)[number]["id"];

// Categorienamen die uitgelicht of gefilterd worden per filter
const CATEGORIE_OVERLIJDEN = "na het overlijden van iemand";
const CATEGORIE_WERK = "na verlies van werk, gezondheid of identiteit";

function matchesFilter(catNaam: string, filterId: FilterId | null): boolean {
  if (!filterId) return true;
  const lc = catNaam.toLowerCase();
  if (filterId === "lezen") {
    return lc.includes("overlijden") || lc.includes("werk");
  }
  if (filterId === "praten") {
    return lc.includes("overlijden");
  }
  if (filterId === "groep") {
    return true; // Alles tonen
  }
  return false; // "ander" toont geen categorieën
}

// ─── Types ────────────────────────────────────────────────────────────────────

type Categorie = {
  _id: string;
  naam: string;
  volgorde: number;
  zichtbaar: boolean;
};

type Initiatief = {
  _id: string;
  categorie_id: string;
  naam: string;
  beschrijving: string;
  url: string;
  volgorde: number;
  zichtbaar: boolean;
};

// ─── Hulpcomponent: initiatief kaart ─────────────────────────────────────────

function InitiatiefKaart({ init, uitgelicht }: { init: Initiatief; uitgelicht?: boolean }) {
  return (
    <a
      href={init.url}
      target="_blank"
      rel="noopener noreferrer"
      className={`block rounded-xl p-4 border transition-all hover:shadow-sm ${
        uitgelicht
          ? "border-[#6d84a8] bg-[#eef1f6]"
          : "border-gray-200 bg-white hover:border-[#6d84a8]"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-[#3d3530] mb-1">{init.naam}</p>
          <p className="text-xs text-[#6b6460] leading-relaxed">{init.beschrijving}</p>
        </div>
        <span className="flex-shrink-0 text-[#6d84a8] mt-0.5">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6m0 0v6m0-6L10 14" />
          </svg>
        </span>
      </div>
      {uitgelicht && (
        <span className="inline-block mt-2 text-[10px] font-semibold uppercase tracking-wide text-[#6d84a8]">
          Aanbevolen
        </span>
      )}
    </a>
  );
}

// ─── Hoofdpagina ─────────────────────────────────────────────────────────────

export default function MensenOmJeHeenPage() {
  const [actieveFilter, setActieveFilter] = useState<FilterId | null>(null);

  const paginaTeksten = useQuery(api.mensenOmJeHeen.getPaginaTeksten);
  const categorieen = useQuery(api.mensenOmJeHeen.listCategorieen) as Categorie[] | undefined;
  const alleInitiatieven = useQuery(api.mensenOmJeHeen.listInitiatieven, {}) as Initiatief[] | undefined;

  const heroTitel =
    paginaTeksten?.hero_titel ?? "Er zijn mensen die begrijpen wat jij doormaakt.";
  const heroSubtitel =
    paginaTeksten?.hero_subtitel ??
    "Hier vind je initiatieven, groepen en mensen die er voor je zijn — voor elk soort verlies.";
  const slotTekst =
    paginaTeksten?.slot_tekst ??
    "Wil je ook even met Benji praten? Dat kan anoniem, zonder account, ook 's nachts.";

  const zichtbareCats = (categorieen ?? []).filter((c) => c.zichtbaar);
  const zichtbareInits = (alleInitiatieven ?? []).filter((i) => i.zichtbaar);

  const toonCategorieen = actieveFilter !== "ander"
    ? zichtbareCats.filter((c) => matchesFilter(c.naam, actieveFilter))
    : [];

  function initiatieven(catId: string): Initiatief[] {
    return zichtbareInits
      .filter((i) => i.categorie_id === catId)
      .sort((a, b) => a.volgorde - b.volgorde);
  }

  function isUitgelicht(init: Initiatief, catNaam: string): boolean {
    if (actieveFilter === "praten" && init.naam === "SteunPunt Rouw") return true;
    if (actieveFilter === "groep" && init.naam === "Rouwcafé") return true;
    return false;
  }

  return (
    <div className="min-h-screen" style={{ background: "#fdf9f4" }}>
      <SiteHeaderConcept />

      {/* Hero */}
      <section className="bg-[#2d3a4f] text-white">
        <div className="max-w-3xl mx-auto px-6 py-16 sm:py-20 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#a8b8cc] mb-4">
            Mensen om je heen
          </p>
          <h1 className="text-2xl sm:text-4xl font-bold leading-tight text-balance mb-4">
            {heroTitel}
          </h1>
          <p className="text-base sm:text-lg text-[#c8d4e0] leading-relaxed text-balance max-w-xl mx-auto">
            {heroSubtitel}
          </p>
        </div>
      </section>

      {/* Filter sectie */}
      <section className="max-w-3xl mx-auto px-6 py-10">
        <p className="text-xs font-semibold uppercase tracking-wide text-[#6d84a8] mb-4 text-center">
          Eén stap zetten
        </p>
        <h2 className="text-lg sm:text-xl font-bold text-[#3d3530] text-center mb-6 text-balance">
          Wat past het beste bij jou nu?
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {FILTER_OPTIES.map((optie) => {
            const isActief = actieveFilter === optie.id;
            return (
              <button
                key={optie.id}
                onClick={() => setActieveFilter(isActief ? null : optie.id)}
                className="flex items-start gap-3 text-left px-4 py-4 rounded-xl border transition-all"
                style={{
                  borderColor: isActief ? "#6d84a8" : "#e8e2db",
                  background: isActief ? "#eef1f6" : "white",
                }}
              >
                <span className="text-xl leading-none flex-shrink-0 mt-0.5">{optie.icoon}</span>
                <span className="text-sm text-[#3d3530] leading-snug font-medium">{optie.label}</span>
              </button>
            );
          })}
        </div>

        {actieveFilter && (
          <div className="text-center mt-4">
            <button
              onClick={() => setActieveFilter(null)}
              className="text-xs text-[#6d84a8] hover:underline"
            >
              Toon alles
            </button>
          </div>
        )}
      </section>

      {/* Speciale inhoud voor "Ik wil weten wat ik kan doen voor iemand anders" */}
      {actieveFilter === "ander" && (
        <section className="max-w-3xl mx-auto px-6 pb-10">
          <div
            className="rounded-2xl p-6 border"
            style={{ background: "#eef1f6", borderColor: "#6d84a8" }}
          >
            <p className="text-sm font-semibold text-[#2d3a4f] mb-2">
              Er zijn voor iemand begint met luisteren.
            </p>
            <p className="text-sm text-[#4a5568] leading-relaxed">
              Niet met de juiste woorden. Je hoeft geen oplossing te hebben. Aanwezig zijn,
              vragen stellen zonder te dringen, gewoon er zijn — dat is al heel veel.
            </p>
          </div>
        </section>
      )}

      {/* Initiatieven per categorie */}
      {toonCategorieen.length > 0 && (
        <section className="max-w-3xl mx-auto px-6 pb-16 space-y-10">
          {toonCategorieen.map((cat) => {
            const inits = initiatieven(cat._id);
            if (inits.length === 0) return null;
            return (
              <div key={cat._id}>
                <h3 className="text-base font-bold text-[#3d3530] mb-4">{cat.naam}</h3>
                <div className="space-y-3">
                  {inits.map((init) => (
                    <InitiatiefKaart
                      key={init._id}
                      init={init}
                      uitgelicht={isUitgelicht(init, cat.naam)}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </section>
      )}

      {/* Geen filter actief: toon alles */}
      {!actieveFilter && zichtbareCats.length > 0 && (
        <section className="max-w-3xl mx-auto px-6 pb-16 space-y-10">
          {zichtbareCats.map((cat) => {
            const inits = initiatieven(cat._id);
            if (inits.length === 0) return null;
            return (
              <div key={cat._id}>
                <h3 className="text-base font-bold text-[#3d3530] mb-4">{cat.naam}</h3>
                <div className="space-y-3">
                  {inits.map((init) => (
                    <InitiatiefKaart key={init._id} init={init} />
                  ))}
                </div>
              </div>
            );
          })}
        </section>
      )}

      {/* Slot blok */}
      <section className="bg-[#2d3a4f]">
        <div className="max-w-2xl mx-auto px-6 py-14 text-center">
          <p className="text-base sm:text-lg text-[#c8d4e0] leading-relaxed mb-6 text-balance">
            {slotTekst}
          </p>
          <Link
            href="/benji"
            className="inline-flex items-center gap-2 px-6 py-3 bg-white text-[#2d3a4f] text-sm font-semibold rounded-xl hover:bg-[#eef1f6] transition-colors"
          >
            Praat met Benji
          </Link>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
