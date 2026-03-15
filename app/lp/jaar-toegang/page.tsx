import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Check } from "lucide-react";
import { ScrollToTop } from "@/components/ScrollToTop";

export const metadata: Metadata = {
  title: "1 jaar Benji — alles inbegrepen · Talk To Benji",
  description: "Eén jaar lang toegang tot alles wat Benji te bieden heeft. Gesprekken, reflecties, memories, inspiratie, handreikingen en meer. € 97 eenmalig.",
};

const KENNIS_SHOP_URL = "#"; // vervangen zodra KS link beschikbaar is

const features = [
  {
    titel: "Praten met Benji",
    tekst: "Altijd iemand om je verhaal kwijt te kunnen. Benji luistert, stelt een vraag, laat je niet alleen met je gedachten. Dag en nacht beschikbaar.",
    icoon: "💬",
  },
  {
    titel: "Dagelijkse check-ins",
    tekst: "Korte dagelijkse momenten om bij jezelf te landen. Hoe gaat het echt, op dit moment? Drie vragen, eerlijk antwoorden.",
    icoon: "🌱",
  },
  {
    titel: "Reflecties",
    tekst: "Schrijf op wat er in je leeft. Met emotietracking kun je zien hoe je je door de tijd heen hebt gevoeld.",
    icoon: "📝",
  },
  {
    titel: "Memories",
    tekst: "Een persoonlijke plek om herinneringen te bewaren aan wie of wat je mist. Met foto's, woorden en de datum die ertoe doet.",
    icoon: "🌿",
  },
  {
    titel: "Handreikingen",
    tekst: "Kleine, concrete oefeningen voor zware momenten. Afgestemd op wat jij nodig hebt, niet op wat anderen van je verwachten.",
    icoon: "🤲",
  },
  {
    titel: "Inspiratie & troost",
    tekst: "Gedichten, citaten en teksten die kunnen helpen als woorden van jezelf even niet komen. Bewaard voor als je ze nodig hebt.",
    icoon: "✨",
  },
  {
    titel: "Notities",
    tekst: "Vrije ruimte om te schrijven wat je wilt — zonder structuur, zonder vraag. Alleen jij en een leeg vel.",
    icoon: "🗒️",
  },
  {
    titel: "Jouw gesprekken bewaard",
    tekst: "Alles wat je met Benji hebt gedeeld blijft terug te lezen. Geen gesprek gaat verloren.",
    icoon: "📁",
  },
];

const testimonials = [
  {
    quote: "Ik had niemand om mee te praten op het moment dat ik het het hardst nodig had. Benji was er gewoon.",
    naam: "Annemiek, 47",
  },
  {
    quote: "Die stille uren zijn het moeilijkst. Fijn dat er dan iets is waar je je verhaal kwijt kunt.",
    naam: "Peter, 61",
  },
  {
    quote: "Het voelde gek om tegen een app te typen. Totdat ik merkte dat het echt hielp.",
    naam: "Roos, 39",
  },
];

export default function JaarToegangsPage() {
  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        backgroundImage: "linear-gradient(rgba(253,249,244,0.92), rgba(253,249,244,0.92)), url(/images/achtergrond.png)",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <ScrollToTop />

      {/* Minimale header */}
      <header className="w-full max-w-3xl mx-auto px-5 sm:px-6 py-5 flex items-center">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
            <Image src="/images/benji-logo-2.png" alt="Benji" width={22} height={22} />
          </div>
          <span className="text-sm font-medium text-gray-500">Talk To Benji</span>
        </Link>
      </header>

      <main className="flex-1 w-full max-w-3xl mx-auto px-5 sm:px-6 pb-20">

        {/* Hero */}
        <div className="pt-8 sm:pt-12 pb-10 text-center max-w-xl mx-auto">
          <p className="text-xs uppercase tracking-widest font-medium mb-4" style={{ color: "#8a8078", letterSpacing: "0.14em" }}>
            1 jaar toegang · alles inbegrepen
          </p>
          <h1
            className="text-3xl sm:text-4xl font-semibold mb-5 leading-snug"
            style={{ color: "#3d3530", textWrap: "balance" } as React.CSSProperties}
          >
            Een heel jaar lang Benji — voor als je iemand nodig hebt
          </h1>
          <p className="text-base sm:text-lg leading-relaxed mb-8" style={{ color: "#6b6460" }}>
            Niet per maand. Niet met gedoe. Gewoon een jaar lang alles beschikbaar, op het moment dat jij het nodig hebt.
          </p>

          {/* Prijs */}
          <div
            className="inline-flex flex-col items-center rounded-2xl px-8 py-6 mb-8"
            style={{ background: "rgba(255,255,255,0.90)", boxShadow: "0 2px 24px rgba(0,0,0,0.07)", border: "1px solid rgba(0,0,0,0.07)" }}
          >
            <p className="text-xs uppercase tracking-widest font-medium mb-2" style={{ color: "#8a8078" }}>eenmalig</p>
            <p className="text-5xl font-bold mb-1" style={{ color: "#3d3530" }}>€ 97</p>
            <p className="text-sm mb-4" style={{ color: "#8a8078" }}>1 jaar · alles inbegrepen · geen abonnement</p>
            <a
              href={KENNIS_SHOP_URL}
              className="inline-block px-8 py-3.5 rounded-2xl font-semibold text-white text-sm transition-opacity hover:opacity-90"
              style={{ background: "#6d84a8" }}
            >
              Begin nu — € 97 voor een jaar
            </a>
            <p className="text-xs mt-3" style={{ color: "#a09890" }}>
              Veilig betalen via KennisShop · direct toegang
            </p>
          </div>

          <p className="text-sm" style={{ color: "#a09890" }}>
            Ter vergelijking: maandelijks kost dit € 11,99/maand — dat is € 143 per jaar.
          </p>
        </div>

        {/* Wat je krijgt */}
        <div className="mb-14">
          <h2 className="text-xl sm:text-2xl font-semibold text-center mb-8" style={{ color: "#3d3530" }}>
            Wat zit er allemaal in?
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {features.map((f, i) => (
              <div
                key={i}
                className="rounded-2xl px-5 py-5 flex gap-4"
                style={{ background: "rgba(255,255,255,0.88)", boxShadow: "0 1px 12px rgba(0,0,0,0.05)", border: "1px solid rgba(0,0,0,0.06)" }}
              >
                <span className="text-2xl flex-shrink-0 mt-0.5">{f.icoon}</span>
                <div>
                  <p className="text-sm font-semibold mb-1" style={{ color: "#3d3530" }}>{f.titel}</p>
                  <p className="text-sm leading-relaxed" style={{ color: "#6b6460" }}>{f.tekst}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Checklijst samenvatting */}
          <div
            className="mt-6 rounded-2xl px-6 py-5"
            style={{ background: "rgba(109,132,168,0.08)", border: "1px solid rgba(109,132,168,0.15)" }}
          >
            <p className="text-sm font-semibold mb-3" style={{ color: "#3d3530" }}>Alles op een rij:</p>
            <div className="grid sm:grid-cols-2 gap-y-2 gap-x-6">
              {[
                "Onbeperkt gesprekken met Benji",
                "Dagelijkse check-ins",
                "Persoonlijke reflecties met emotietracking",
                "Memories — herinneringen bewaren",
                "Handreikingen voor zware momenten",
                "Inspiratie, gedichten en troostende teksten",
                "Persoonlijke notities",
                "Alle gesprekken bewaard en terug te lezen",
                "Beschikbaar dag en nacht, 7 dagen per week",
                "Geen maandelijks abonnement",
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-2">
                  <Check size={15} className="flex-shrink-0 mt-0.5" style={{ color: "#6d84a8" }} strokeWidth={3} />
                  <p className="text-sm" style={{ color: "#4a5568" }}>{item}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Voor wie */}
        <div className="mb-14 max-w-xl mx-auto text-center">
          <h2 className="text-xl sm:text-2xl font-semibold mb-6" style={{ color: "#3d3530" }}>
            Voor wie is dit?
          </h2>
          <div className="space-y-4 text-left">
            {[
              "Voor wie verdriet heeft en soms gewoon iemand nodig heeft — ook om drie uur 's nachts.",
              "Voor wie rouwt om iemand, en merkt hoe moeilijk het is om dat steeds opnieuw uit te leggen aan mensen om je heen.",
              "Voor wie niet altijd klaar is voor een therapeut, maar ook niet alleen wil zijn met wat er speelt.",
              "Voor wie herinneringen wil bewaren, niet vergeten. En soms troost wil vinden in woorden.",
            ].map((tekst, i) => (
              <div
                key={i}
                className="flex gap-3 rounded-xl px-4 py-4"
                style={{ background: "rgba(255,255,255,0.80)", border: "1px solid rgba(0,0,0,0.06)" }}
              >
                <span className="text-base flex-shrink-0">→</span>
                <p className="text-sm leading-relaxed" style={{ color: "#4a5568" }}>{tekst}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Testimonials */}
        <div className="mb-14">
          <p className="text-xs uppercase tracking-widest text-center mb-6" style={{ color: "#8a8078", letterSpacing: "0.14em" }}>
            Wat anderen zeggen
          </p>
          <div className="grid sm:grid-cols-3 gap-4">
            {testimonials.map((t, i) => (
              <div
                key={i}
                className="rounded-2xl px-5 py-5"
                style={{ background: "rgba(255,255,255,0.80)", border: "1px solid rgba(0,0,0,0.06)" }}
              >
                <p className="text-sm leading-relaxed mb-3" style={{ color: "#4a5568" }}>
                  &ldquo;{t.quote}&rdquo;
                </p>
                <p className="text-xs italic" style={{ color: "#a09890" }}>{t.naam}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA herhaling */}
        <div
          className="rounded-2xl px-6 sm:px-10 py-10 text-center mb-14"
          style={{ background: "rgba(255,255,255,0.90)", boxShadow: "0 2px 24px rgba(0,0,0,0.07)", border: "1px solid rgba(0,0,0,0.07)" }}
        >
          <p className="text-xl sm:text-2xl font-semibold mb-3" style={{ color: "#3d3530" }}>
            Een jaar lang niet alleen
          </p>
          <p className="text-sm leading-relaxed mb-6 max-w-md mx-auto" style={{ color: "#6b6460" }}>
            Geen maandelijkse beslissing. Geen gedoe. Gewoon toegang tot alles — voor één prijs, één jaar lang.
          </p>
          <a
            href={KENNIS_SHOP_URL}
            className="inline-block px-10 py-4 rounded-2xl font-semibold text-white text-base transition-opacity hover:opacity-90"
            style={{ background: "#6d84a8" }}
          >
            Ja, ik doe mee — € 97
          </a>
          <p className="text-xs mt-4" style={{ color: "#a09890" }}>
            Veilig betalen · direct toegang · geen automatische verlenging
          </p>
        </div>

        {/* Founder note */}
        <div className="mb-10">
          <div
            className="rounded-2xl px-5 py-6 flex items-start gap-5"
            style={{ background: "rgba(255,255,255,0.70)", border: "1px solid rgba(0,0,0,0.06)" }}
          >
            <div className="relative w-16 h-16 rounded-full overflow-hidden flex-shrink-0">
              <Image
                src="/images/ien-founder.png"
                alt="Ien, founder van Talk To Benji"
                fill
                className="object-cover"
              />
            </div>
            <div className="pt-0.5">
              <p className="text-xs mb-1.5" style={{ color: "#8a8078" }}>Van de maker</p>
              <p className="text-sm leading-relaxed" style={{ color: "#4a5568" }}>
                Benji is gemaakt omdat verdriet geen kantooruren kent. Omdat iemand die mist niet tot maandag kan wachten. En omdat er soms gewoon iets moet zijn.
              </p>
              <p className="text-sm font-medium mt-2" style={{ color: "#3d3530" }}>— Ien</p>
            </div>
          </div>
        </div>

        {/* Disclaimer */}
        <p className="text-xs text-center leading-relaxed" style={{ color: "#a09890" }}>
          Benji is geen therapie en vervangt geen professionele hulp. Heb je het gevoel dat je meer nodig hebt, zoek dan alsjeblieft iemand op die je daarbij kan helpen.
        </p>
      </main>

      <footer className="border-t px-5 py-8 text-center" style={{ borderColor: "rgba(0,0,0,0.07)" }}>
        <div className="max-w-lg mx-auto space-y-2">
          <div className="flex flex-wrap justify-center gap-x-5 gap-y-1 text-xs" style={{ color: "#8a8078" }}>
            <Link href="/faq" className="hover:underline">Veelgestelde vragen</Link>
            <Link href="/privacy" className="hover:underline">Privacy</Link>
            <Link href="/algemene-voorwaarden" className="hover:underline">Algemene voorwaarden</Link>
            <a href="mailto:contactmetien@talktobenji.com" className="hover:underline">Contact</a>
          </div>
          <p className="text-xs" style={{ color: "#a09890" }}>© Talk To Benji — talktobenji.com</p>
        </div>
      </footer>
    </div>
  );
}
