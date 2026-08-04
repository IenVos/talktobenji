import type { Metadata } from "next";
import Link from "next/link";
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { HeaderBar } from "@/components/chat/HeaderBar";
import { ScrollToTop } from "@/components/ScrollToTop";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Wat kost Benji?",
  description:
    "Blijf met Benji praten wanneer jij hem nodig hebt. Geen abonnement, geen automatische verlenging. Je kiest zelf voor hoe lang.",
};

// De drie keuzes. De prijs komt live uit de bestaande checkouts (getBySlug); de
// bedragen hieronder zijn alleen een terugval als een product tijdelijk niet
// bereikbaar is. Langer = voordeliger per maand, dat is het hele idee.
type Keuze = { slug: string; label: string; maanden: number; fallbackCents: number };
const KEUZES: Keuze[] = [
  { slug: "benji-1-maand", label: "1 maand", maanden: 1, fallbackCents: 2000 },
  { slug: "benji-3-maanden", label: "3 maanden", maanden: 3, fallbackCents: 5000 },
  { slug: "benji-6-maanden", label: "6 maanden", maanden: 6, fallbackCents: 9000 },
];

function euro(cents: number): string {
  return (cents % 100 === 0)
    ? `€${cents / 100}`
    : `€${(cents / 100).toFixed(2).replace(".", ",")}`;
}

function perMaand(cents: number, maanden: number): string {
  return euro(Math.round(cents / maanden));
}

export default async function WatKostBenjiPage() {
  // Prijzen live ophalen; valt netjes terug op de vaste bedragen als het niet lukt.
  const producten = await Promise.all(
    KEUZES.map((k) =>
      fetchQuery(api.checkoutProducts.getBySlug, { slug: k.slug }).catch(() => null)
    )
  );
  const keuzes = KEUZES.map((k, i) => {
    const cents = (producten[i]?.priceInCents as number | undefined) ?? k.fallbackCents;
    return { ...k, cents };
  });

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        backgroundImage:
          "linear-gradient(rgba(255,255,255,0.7), rgba(255,255,255,0.7)), url(/images/achtergrond.png)",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        backgroundAttachment: "fixed",
      }}
    >
      <ScrollToTop />
      <HeaderBar />

      <main className="flex-1 w-full max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-10 text-gray-700 text-sm sm:text-base leading-relaxed">
        <p className="text-xs sm:text-sm font-semibold tracking-wide text-[#9a8168] uppercase mb-3">
          Verder met Benji
        </p>
        <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 mb-5 leading-snug">
          Hoe lang wil je Benji erbij houden?
        </h1>

        <div className="space-y-4 mb-8">
          <p>
            Je hebt hem nu een paar dagen. Als het je iets bracht, hoef je alleen te
            kiezen voor hoe lang.
          </p>
          <p>
            Geen abonnement. Je betaalt één keer, en als de periode afloopt krijg je
            een mail waarin je zelf kiest of je verdergaat.
          </p>
          <p>
            Wat je met Benji besproken hebt blijft bewaard. Hij begint niet opnieuw en
            je hoeft niets nog een keer uit te leggen.
          </p>
        </div>

        {/* De drie keuzes */}
        <div className="space-y-3">
          {keuzes.map((k) => (
            <Link
              key={k.slug}
              href={`/betalen/${k.slug}`}
              className="group block rounded-2xl border border-[#e7ded1] bg-white/80 hover:bg-white hover:border-[#9a8168] transition-colors px-5 py-4 sm:px-6 sm:py-5"
            >
              <div className="flex items-center justify-between gap-4">
                <div>
                  <span className="text-base sm:text-lg font-semibold text-gray-900">
                    {k.label}
                  </span>
                  {k.maanden > 1 && (
                    <div className="text-xs sm:text-sm text-gray-500 mt-1">
                      {perMaand(k.cents, k.maanden)} per maand
                    </div>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <div className="text-lg sm:text-xl font-semibold text-gray-900">
                    {euro(k.cents)}
                  </div>
                  <div className="text-xs text-[#9a8168] font-medium group-hover:underline">
                    Kies dit &rarr;
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <p className="text-sm text-gray-500 mt-8">
          Weet je nog niet welke periode past? Beantwoord gerust de mail, dan denk ik
          met je mee.
        </p>
      </main>
    </div>
  );
}
