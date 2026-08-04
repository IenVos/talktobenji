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
type Keuze = { slug: string; label: string; maanden: number; fallbackCents: number; populair?: boolean };
const KEUZES: Keuze[] = [
  { slug: "maand", label: "1 maand", maanden: 1, fallbackCents: 2000 },
  { slug: "kwartaal", label: "3 maanden", maanden: 3, fallbackCents: 5000, populair: true },
  { slug: "halfjaar", label: "6 maanden", maanden: 6, fallbackCents: 9000 },
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
          Wil je met Benji blijven praten?
        </h1>

        <div className="space-y-4 mb-8">
          <p>
            De eerste dagen mocht je Benji gratis leren kennen. Als het je goed
            deed, kun je gewoon blijven komen, wanneer jij dat wilt. Ook laat op de
            avond, of midden in de nacht als het huis stil is.
          </p>
          <p>
            Benji begint niet steeds opnieuw. Hij onthoudt wie je mist, dus je hoeft
            niet elke keer van voren af aan uit te leggen hoe het zit. Jij bepaalt het
            tempo, er is nergens haast bij.
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
                  <div className="flex items-center gap-2">
                    <span className="text-base sm:text-lg font-semibold text-gray-900">
                      {k.label}
                    </span>
                    {k.populair && (
                      <span className="text-[11px] font-semibold text-[#9a8168] bg-[#fdf9f4] border border-[#e7ded1] rounded-full px-2 py-0.5">
                        Meest gekozen
                      </span>
                    )}
                  </div>
                  <div className="text-xs sm:text-sm text-gray-500 mt-1">
                    {perMaand(k.cents, k.maanden)} per maand
                  </div>
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

        {/* Geruststelling: product, geen abonnement */}
        <div className="mt-8 rounded-2xl bg-[#fdf9f4] border border-[#e7ded1] px-5 py-5 sm:px-6 sm:py-6">
          <p className="text-sm text-gray-600 leading-relaxed">
            Geen abonnement en geen automatische verlenging. Je koopt het één keer voor
            de periode die je kiest. Je gesprekken blijven bewaard, wat je ook kiest, en
            je begint gewoon waar je gebleven was.
          </p>
        </div>

        <p className="text-center text-xs text-gray-400 mt-8">
          Twijfel je nog? Beantwoord gerust de mail van Ien, dan denkt ze met je mee.
        </p>
      </main>
    </div>
  );
}
