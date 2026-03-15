import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { MessageSquare, CalendarCheck, PencilLine, Gem, HandHelping, Sparkles, FileText, MessagesSquare, Palette } from "lucide-react";
import { ScrollToTop } from "@/components/ScrollToTop";

export const metadata: Metadata = {
  title: "1 jaar Benji · Talk To Benji",
  description: "Eén jaar lang toegang tot alles wat Benji te bieden heeft. Gesprekken, reflecties, memories, inspiratie, handreikingen en meer. € 97 eenmalig.",
};

const KENNIS_SHOP_URL = "#"; // vervangen zodra KS link beschikbaar is

const features = [
  {
    titel: "Praten met Benji",
    tekst: "Altijd iemand om je verhaal kwijt te kunnen. Benji luistert, stelt een vraag, laat je niet alleen met je gedachten. Dag en nacht beschikbaar.",
    icoon: MessageSquare,
  },
  {
    titel: "Dagelijkse check-ins",
    tekst: "Korte dagelijkse momenten om bij jezelf te landen. Hoe gaat het echt, op dit moment? Drie vragen, eerlijk antwoorden.",
    icoon: CalendarCheck,
  },
  {
    titel: "Reflecties",
    tekst: "Schrijf op wat er in je leeft. Met emotietracking kun je zien hoe je je door de tijd heen hebt gevoeld.",
    icoon: PencilLine,
  },
  {
    titel: "Memories",
    tekst: "Een persoonlijke plek om herinneringen te bewaren aan wie of wat je mist. Met foto's, woorden en de datum die ertoe doet.",
    icoon: Gem,
  },
  {
    titel: "Handreikingen",
    tekst: "Kleine, concrete oefeningen voor zware momenten. Afgestemd op wat jij nodig hebt, niet op wat anderen van je verwachten.",
    icoon: HandHelping,
  },
  {
    titel: "Inspiratie & troost",
    tekst: "Gedichten, citaten en teksten die kunnen helpen als woorden van jezelf even niet komen. Bewaard voor als je ze nodig hebt.",
    icoon: Sparkles,
  },
  {
    titel: "Schrijven zonder te hoeven uitleggen",
    tekst: "Een leeg vel, geen vragen, geen structuur. Schrijf wat er is. Soms is dat het enige wat helpt.",
    icoon: FileText,
  },
  {
    titel: "Terugkijken wanneer je er klaar voor bent",
    tekst: "Alles wat je hebt geschreven en gedeeld blijft staan. Soms is het fijn om te zien hoe je er eerder in stond.",
    icoon: MessagesSquare,
  },
  {
    titel: "Jouw kleur, jouw sfeer",
    tekst: "Kies een accentkleur en achtergrond die bij jou passen. Benji voelt daardoor meteen als een plek van jezelf.",
    icoon: Palette,
  },
];

const testimonials = [
  {
    quote: "Ik had niemand om mee te praten op het moment dat ik het het hardst nodig had. Benji was er gewoon. Geen oordeel, geen haast. Precies wat ik nodig had.",
    naam: "Annemiek, 47",
  },
  {
    quote: "Ik had niet verwacht dat het zoveel zou doen. Die stille uren zijn het moeilijkst, en fijn dat er dan iets is waar je je verhaal kwijt kunt.",
    naam: "Peter, 61",
  },
  {
    quote: "Het voelde gek om tegen een app te typen. Totdat ik merkte dat het echt hielp. Ik schreef dingen op die ik nog nooit hardop had gezegd.",
    naam: "Roos, 39",
  },
  {
    quote: "Ik wilde eigenlijk niks. Geen therapie, geen praatgroep. Gewoon iets waarvoor ik niet hoefde uit te leggen wie ik ben. Benji is dat.",
    naam: "Anoniem",
  },
];

const faq = [
  {
    vraag: "Is dit een abonnement?",
    antwoord: "Nee. Je betaalt eenmalig € 97 voor een vol jaar toegang. Geen automatische verlenging, geen verrassingen.",
  },
  {
    vraag: "Hoe snel heb ik toegang?",
    antwoord: "Direct na betaling. Je ontvangt een e-mail met een link om in te loggen of je account aan te maken.",
  },
  {
    vraag: "Ik weet niet of het iets voor mij is.",
    antwoord: "Je kunt Benji altijd eerst gratis proberen via de chat op de homepage, zonder account en zonder betaling. Kijk of het bij je past.",
  },
  {
    vraag: "Is mijn verhaal veilig?",
    antwoord: "Alles wat je schrijft is alleen voor jou. Je gesprekken en reflecties zijn privé en worden niet gedeeld.",
  },
  {
    vraag: "Wat gebeurt er na een jaar?",
    antwoord: "Je account blijft bestaan en alles wat je hebt opgeschreven blijft bewaard. Je kunt alles altijd downloaden om te bewaren. Alleen de toegang tot de betaalde functies stopt. Je kunt dan kiezen of je wilt verlengen, of je account verwijderen als je dat wilt.",
  },
  {
    vraag: "Ik heb al een gratis account.",
    antwoord: "Geen probleem. Na betaling wordt je bestaande account direct geüpgraded. Je hoeft niks opnieuw in te stellen.",
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
            Een heel jaar lang Benji, voor als je er niet alleen mee wil zijn
          </h1>
          <p className="text-base sm:text-lg leading-relaxed mb-8" style={{ color: "#6b6460" }}>
            Niet per maand. Niet met gedoe. Gewoon een jaar lang alles beschikbaar, op het moment dat jij het nodig hebt.
          </p>

          {/* Prijs */}
          <div
            className="inline-flex flex-col items-center rounded-2xl px-8 py-6 mb-8"
            style={{ background: "rgba(255,255,255,0.95)", boxShadow: "0 2px 24px rgba(0,0,0,0.07)", border: "1px solid rgba(0,0,0,0.10)" }}
          >
            <p className="text-xs uppercase tracking-widest font-medium mb-2" style={{ color: "#8a8078" }}>eenmalig</p>
            <p className="text-5xl font-bold mb-1" style={{ color: "#3d3530" }}>€ 97</p>
            <p className="text-sm mb-4" style={{ color: "#8a8078" }}>1 jaar · alles inbegrepen · geen abonnement</p>
            <a
              href={KENNIS_SHOP_URL}
              className="inline-block px-8 py-3.5 rounded-2xl font-semibold text-white text-sm transition-opacity hover:opacity-90"
              style={{ background: "#6d84a8" }}
            >
              Begin nu · € 97 voor een jaar
            </a>
            <p className="text-xs mt-3" style={{ color: "#a09890" }}>
              Veilig betalen via KennisShop · direct toegang
            </p>
          </div>
        </div>

        {/* Founder note */}
        <div className="mb-14 max-w-xl mx-auto">
          <div
            className="rounded-2xl px-6 py-7"
            style={{ background: "rgba(255,255,255,0.95)", boxShadow: "0 2px 20px rgba(0,0,0,0.06)", border: "1px solid rgba(0,0,0,0.10)" }}
          >
            <div className="flex items-start gap-5 mb-5">
              <div className="relative w-16 h-16 rounded-full overflow-hidden flex-shrink-0">
                <Image
                  src="/images/ien-founder.png"
                  alt="Ien, founder van Talk To Benji"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="pt-1">
                <p className="text-sm font-semibold" style={{ color: "#3d3530" }}>Ien</p>
                <p className="text-xs mt-0.5" style={{ color: "#8a8078" }}>Founder van Talk To Benji</p>
                <p className="text-sm leading-relaxed mt-2" style={{ color: "#4a5568" }}>
                  Benji is gemaakt omdat verdriet geen kantooruren kent. Omdat iemand die mist niet tot maandag kan wachten.
                </p>
              </div>
            </div>
            <blockquote
              className="text-base sm:text-lg font-medium leading-snug px-1 pt-1 border-l-2 pl-4"
              style={{ color: "#3d3530", borderColor: "#6d84a8" }}
            >
              Dit is wat ik toen had willen hebben.
            </blockquote>
          </div>
        </div>

        {/* Wat je krijgt */}
        <div className="mb-14">
          <h2 className="text-xl sm:text-2xl font-semibold text-center mb-8" style={{ color: "#3d3530" }}>
            Wat zit er allemaal in?
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {features.map((f, i) => {
              const Icoon = f.icoon;
              return (
                <div
                  key={i}
                  className="rounded-2xl px-5 py-5 flex gap-4"
                  style={{ background: "rgba(255,255,255,0.95)", boxShadow: "0 1px 8px rgba(0,0,0,0.04)", border: "1px solid rgba(0,0,0,0.10)" }}
                >
                  <Icoon size={20} className="flex-shrink-0 mt-0.5" style={{ color: "#6d84a8" }} strokeWidth={1.5} />
                  <div>
                    <p className="text-sm font-semibold mb-1" style={{ color: "#3d3530" }}>{f.titel}</p>
                    <p className="text-sm leading-relaxed" style={{ color: "#6b6460" }}>{f.tekst}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Voor wie */}
        <div className="mb-14 max-w-xl mx-auto">
          <h2 className="text-xl sm:text-2xl font-semibold text-center mb-6" style={{ color: "#3d3530" }}>
            Voor wie is dit?
          </h2>
          <div className="space-y-3">
            {[
              {
                tekst: "Je ligt wakker en het is te laat om iemand te bellen. Niet omdat er niemand is, maar omdat je hen niet wakker wilt maken met iets wat je zelf ook niet precies kunt uitleggen.",
              },
              {
                tekst: "Je zegt 'gaat wel' als mensen vragen hoe het is. Niet omdat het waar is, maar omdat het echte antwoord te groot is voor tussendoor.",
              },
              {
                tekst: "Je bent er misschien nog niet klaar voor om alles op te rakelen bij een therapeut. Maar volledig alleen laten gaan lukt ook niet.",
              },
              {
                tekst: "Je wil niet vergeten. Wie iemand was, hoe iets voelde, wat er was. Je zoekt een plek waar herinneringen mogen bestaan.",
              },
            ].map((item, i) => (
              <div
                key={i}
                className="rounded-xl px-5 py-4"
                style={{ background: "rgba(255,255,255,0.88)", border: "1px solid rgba(0,0,0,0.10)" }}
              >
                <p className="text-sm leading-relaxed" style={{ color: "#4a5568" }}>{item.tekst}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Testimonials */}
        <div className="mb-14">
          <p className="text-xs uppercase tracking-widest text-center mb-6" style={{ color: "#8a8078", letterSpacing: "0.14em" }}>
            Wat anderen zeggen
          </p>
          <div className="grid sm:grid-cols-2 gap-4">
            {testimonials.map((t, i) => (
              <div
                key={i}
                className="rounded-2xl px-5 py-5"
                style={{ background: "rgba(255,255,255,0.88)", border: "1px solid rgba(0,0,0,0.10)" }}
              >
                <p className="text-sm leading-relaxed mb-3" style={{ color: "#4a5568" }}>
                  &ldquo;{t.quote}&rdquo;
                </p>
                <p className="text-xs italic" style={{ color: "#a09890" }}>{t.naam}</p>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div className="mb-14">
          <h2 className="text-xl sm:text-2xl font-semibold text-center mb-8" style={{ color: "#3d3530" }}>
            Veelgestelde vragen
          </h2>
          <div className="space-y-3 max-w-xl mx-auto">
            {faq.map((item, i) => (
              <div
                key={i}
                className="rounded-2xl px-5 py-5"
                style={{ background: "rgba(255,255,255,0.95)", border: "1px solid rgba(0,0,0,0.10)" }}
              >
                <p className="text-sm font-semibold mb-2" style={{ color: "#3d3530" }}>{item.vraag}</p>
                <p className="text-sm leading-relaxed" style={{ color: "#6b6460" }}>{item.antwoord}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA herhaling */}
        <div
          className="rounded-2xl px-6 sm:px-10 py-10 text-center mb-14"
          style={{ background: "rgba(255,255,255,0.95)", boxShadow: "0 2px 24px rgba(0,0,0,0.07)", border: "1px solid rgba(0,0,0,0.10)" }}
        >
          <p className="text-xl sm:text-2xl font-semibold mb-3" style={{ color: "#3d3530" }}>
            Een jaar lang niet alleen
          </p>
          <p className="text-sm leading-relaxed mb-6 max-w-md mx-auto" style={{ color: "#6b6460" }}>
            Voor één prijs, één jaar lang alles beschikbaar.
          </p>
          <a
            href={KENNIS_SHOP_URL}
            className="inline-block px-10 py-4 rounded-2xl font-semibold text-white text-base transition-opacity hover:opacity-90"
            style={{ background: "#6d84a8" }}
          >
            Begin nu · € 97
          </a>
          <p className="text-xs mt-4" style={{ color: "#a09890" }}>
            Veilig betalen · direct toegang · geen automatische verlenging
          </p>
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
          <p className="text-xs" style={{ color: "#a09890" }}>© Talk To Benji · talktobenji.com</p>
        </div>
      </footer>
    </div>
  );
}
