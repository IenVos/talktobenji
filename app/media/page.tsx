import type { Metadata } from "next";
import Link from "next/link";
import { HeaderBar } from "@/components/chat/HeaderBar";
import { SiteFooter } from "@/components/SiteFooter";

const CANONICAL = "https://www.talktobenji.com/media";

// CONCEPT: staat op noindex zolang de persitems nog placeholders zijn (links/
// datums invullen). Zet `index: true` en voeg toe aan het "Over"-menu zodra het
// klopt. Externe vermeldingen zijn een sterk gezag/trust-signaal (EEAT).
export const metadata: Metadata = {
  title: "Media & pers | Talk To Benji",
  description:
    "Talk To Benji en oprichter Ien in de media: podcasts, artikelen en interviews over verdriet, verlies en eenzaamheid.",
  robots: { index: false, follow: true },
  alternates: { canonical: CANONICAL },
};

type PersItem = {
  titel: string;
  bron: string;
  datum: string;
  omschrijving: string;
  /** Externe link; laat leeg ("") zolang nog niet beschikbaar (toont "binnenkort"). */
  url: string;
  soort: "Podcast" | "Artikel" | "Interview";
};

// Nieuwe vermeldingen bovenaan toevoegen.
const PERS_ITEMS: PersItem[] = [
  {
    titel: "Te gast in de podcast over stil, onzichtbaar verdriet",
    bron: "[Podcastnaam invullen]",
    datum: "Oktober 2026",
    omschrijving:
      "Ien vertelt over stil, onzichtbaar verdriet: het verdriet dat niet altijd gezien of benoemd wordt, en hoe je daar ruimte voor maakt.",
    url: "",
    soort: "Podcast",
  },
  {
    titel: "Artikel in Rouwmagazine",
    bron: "Rouwmagazine",
    datum: "Dit kwartaal",
    omschrijving:
      "Een artikel van Ien over verdriet en verlies, verschenen in Rouwmagazine.",
    url: "",
    soort: "Artikel",
  },
];

export default function MediaPage() {
  return (
    <div className="min-h-screen bg-stone-50">
      <HeaderBar />

      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-stone-800 mb-4 leading-tight">
            Media &amp; pers
          </h1>
          <p className="text-stone-600 leading-relaxed">
            Talk To Benji en oprichter Ien komen regelmatig aan het woord over
            verdriet, verlies en eenzaamheid. Hieronder een overzicht van
            podcasts, artikelen en interviews.
          </p>
        </div>

        <div className="space-y-5">
          {PERS_ITEMS.map((item, i) => {
            const beschikbaar = item.url.trim().length > 0;
            const inner = (
              <>
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className="text-xs font-medium text-primary-700 bg-primary-50 rounded-full px-2.5 py-0.5">
                    {item.soort}
                  </span>
                  <span className="text-xs text-stone-500">{item.bron}</span>
                  <span className="text-stone-300 text-xs">·</span>
                  <span className="text-xs text-stone-500">{item.datum}</span>
                  {!beschikbaar && (
                    <span className="text-xs text-amber-700 bg-amber-50 rounded-full px-2.5 py-0.5">
                      binnenkort
                    </span>
                  )}
                </div>
                <h2 className="text-lg font-semibold text-stone-800 mb-1 leading-snug">
                  {item.titel}
                </h2>
                <p className="text-sm text-stone-600 leading-relaxed">
                  {item.omschrijving}
                </p>
                {beschikbaar && (
                  <span className="inline-block mt-3 text-sm text-primary-600 group-hover:underline">
                    Bekijken →
                  </span>
                )}
              </>
            );

            return beschikbaar ? (
              <a
                key={i}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group block bg-white rounded-2xl border border-stone-200 p-5 hover:shadow-md transition-shadow"
              >
                {inner}
              </a>
            ) : (
              <div
                key={i}
                className="bg-white rounded-2xl border border-stone-200 p-5"
              >
                {inner}
              </div>
            );
          })}
        </div>

        {/* Perscontact / CTA */}
        <div className="mt-10 p-5 bg-stone-100 rounded-2xl border border-stone-200">
          <p className="text-stone-700 leading-relaxed mb-3">
            Pers- of samenwerkingsvraag? Ien vertelt graag over verdriet, verlies
            en de gedachte achter Benji.
          </p>
          <Link
            href="/contact"
            className="inline-block text-sm text-primary-700 border border-primary-200 rounded-xl px-5 py-2.5 hover:bg-primary-50 transition-colors"
          >
            Neem contact op →
          </Link>
        </div>
      </div>

      <SiteFooter variant="dark" />
    </div>
  );
}
