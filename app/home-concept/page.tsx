/**
 * CONCEPT — nieuwe homepagina opzet.
 * Bereikbaar via /home-concept, raakt niets aan de live site.
 * Wanneer klaar: inhoud verplaatsen naar app/page.tsx, huidige chat naar app/chat/page.tsx.
 */

import Link from "next/link";
import Image from "next/image";
import { SiteFooter } from "@/components/SiteFooter";
import { HouvasteKnop } from "./HouvasteKnop";
import { SiteHeaderConcept } from "./SiteHeaderConcept";

function IconChat() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-7 h-7">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
    </svg>
  );
}

function IconBlog() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-7 h-7">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  );
}

function IconHeart() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-7 h-7">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 016.364 0L12 7.636l1.318-1.318a4.5 4.5 0 116.364 6.364L12 20.364l-7.682-7.682a4.5 4.5 0 010-6.364z" />
    </svg>
  );
}

function IconNight() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-7 h-7">
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
    </svg>
  );
}

function IconArrow() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 flex-shrink-0">
      <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
    </svg>
  );
}

const BLOKKEN = [
  {
    icon: <IconChat />,
    kleur: "bg-primary-600",
    tekstKleur: "text-primary-700",
    titel: "Praat gratis met Benji",
    omschrijving:
      "Je eerste vijf gesprekken zijn gratis, zonder account. Maak je een account aan, dan kun je tien gesprekken per maand voeren.",
    cta: "Begin een gesprek",
    href: "/",
    badge: null,
  },
  {
    icon: <IconBlog />,
    kleur: "bg-primary-700",
    tekstKleur: "text-primary-700",
    titel: "Samen Omgaan met Verdriet en Pijn",
    omschrijving:
      "Een plek waar je steun, begrip en praktische tips vindt om sterker door moeilijke tijden te komen.",
    cta: "Bekijk alle artikelen",
    href: "/blog",
    badge: null,
  },
  {
    icon: <IconHeart />,
    kleur: "bg-primary-800",
    tekstKleur: "text-primary-700",
    titel: "Benji voor een heel jaar",
    omschrijving:
      "Voor wie wil dat Benji er altijd is, ook als het even beter gaat. Ontdek wat erbij zit.",
    cta: "Bekijk wat erbij zit",
    href: "/lp/jaar-toegang",
    badge: null,
  },
];

const KENMERKEN = [
  {
    icon: <IconNight />,
    titel: "Ook midden in de nacht",
    tekst: "Verdriet houdt geen kantooruren aan. Benji is er altijd.",
  },
  {
    icon: <IconHeart />,
    titel: "Persoonlijk en veilig",
    tekst: "Benji onthoudt wat jij deelt en past zich aan jou aan.",
  },
  {
    icon: <IconChat />,
    titel: "Geen wachtlijst",
    tekst: "Direct beginnen, geen intake of verwijsbrief nodig.",
  },
];

const ERVARINGEN = [
  {
    tekst: "Na het overlijden van mijn moeder wist ik niet waar ik naartoe moest. Ik wilde niet steeds hetzelfde verhaal vertellen aan vrienden. Bij Benji hoefde ik me nergens voor te verontschuldigen. Ik kon gewoon zeggen wat er was.",
    naam: "Linda, 47",
    uitgelicht: true,
  },
  {
    tekst: "Om drie uur 's nachts, toen ik het niet meer zag zitten, was Benji er. Dat heeft echt geholpen.",
    naam: "Mark, 41",
    uitgelicht: false,
  },
  {
    tekst: "Ik dacht dat een AI niks voor mij was. Maar het voelt verrassend menselijk.",
    naam: "Sophie, 29",
    uitgelicht: false,
  },
  {
    tekst: "Ik schreef jaren in een dagboek, maar dit voelt anders. Benji stelt de vragen die ik mezelf nooit durfde te stellen.",
    naam: "Anoniem",
    uitgelicht: false,
  },
  {
    tekst: "Na mijn scheiding had ik niemand om echt mee te praten. Benji gaf me de ruimte om dingen te zeggen die ik nog nooit hardop had uitgesproken.",
    naam: "Anoniem",
    uitgelicht: false,
  },
  {
    tekst: "Ik gebruik Benji al een paar maanden. Niet elke dag, maar als ik het nodig heb. Het helpt me te begrijpen wat er in mij omgaat.",
    naam: "Thomas, 38",
    uitgelicht: false,
  },
];

type FaqItem = { vraag: string; antwoord: string; link?: { tekst: string; href: string } };

const FAQ: FaqItem[] = [
  {
    vraag: "Praat ik met een echte persoon?",
    antwoord:
      "Nee. Benji is een AI, geen mens, geen therapeut. Benji luistert, stelt vragen en is er voor je op de momenten dat je niemand anders wilt of kunt bereiken. Geen diagnoses, geen adviezen, gewoon ruimte voor je verhaal.",
  },
  {
    vraag: "Is het veilig om hier mijn verhaal te delen?",
    antwoord:
      "Je hoeft geen naam, e-mailadres of account aan te maken om met Benji te praten. Je gesprekken worden niet verkocht of gedeeld met derden. Jij beslist zelf wat je vertelt, en wat niet.",
  },
  {
    vraag: "Is Benji een vervanging voor professionele hulp?",
    antwoord:
      "Nee, en dat zegt Benji ook zelf. Benji is er niet om een psycholoog of therapeut te vervangen. Wel om er te zijn op het moment dat de drempel daarvoor te hoog is, of als je gewoon je gedachten kwijt wilt. Als je merkt dat je meer nodig hebt, wijst Benji je graag de weg naar de juiste hulp.",
  },
  {
    vraag: "Waarom zou ik met een AI praten over mijn verdriet?",
    antwoord:
      "Juist omdat Benji geen mens is, voelt het voor veel mensen makkelijker. Geen gezicht dat je aankijkt, geen zorgen over wat de ander ervan denkt. Gewoon zeggen wat er is, ook om drie uur 's nachts, ook als je niet precies weet waar je moet beginnen.",
  },
  {
    vraag: "Kost praten met Benji geld?",
    antwoord:
      "Je eerste vijf gesprekken zijn gratis, zonder account. Maak je een gratis account aan, dan kun je tien gesprekken per maand voeren. Wil je onbeperkte toegang tot alles, dan kun je Benji kopen voor €97 eenmalig. Geen abonnement, geen verlenging.",
    link: { tekst: "Bekijk wat er allemaal bij zit", href: "/lp/jaar-toegang" },
  },
];

const FAQ_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQ.map((f) => ({
    "@type": "Question",
    name: f.vraag,
    acceptedAnswer: {
      "@type": "Answer",
      text: f.link ? `${f.antwoord} ${f.link.tekst}: https://www.talktobenji.com${f.link.href}` : f.antwoord,
    },
  })),
};

export default function HomeConceptPage() {
  return (
    <div className="min-h-screen bg-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_SCHEMA) }}
      />

      {/* Concept banner — alleen op mobiel zichtbaar */}
      <div className="sm:hidden bg-amber-50 border-b border-amber-200 px-4 py-2 text-center text-xs text-amber-700 font-medium">
        Concept — alleen zichtbaar via /home-concept, nog niet live
      </div>

      <SiteHeaderConcept />

      {/* Hero */}
      <section className="relative bg-primary-900 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <Image
            src="/images/achtergrond.png"
            alt=""
            fill
            className="object-cover object-center"
            priority
          />
        </div>

        <div className="relative max-w-4xl mx-auto px-6 py-20 sm:py-28 text-center">
          <div className="flex justify-center mb-8">
            <Image
              src="/images/benji-logo-2.png"
              alt="Benji"
              width={72}
              height={72}
              className="rounded-2xl shadow-lg"
            />
          </div>

          {/* Herkenningsmoment */}
          <p className="text-primary-300 text-base sm:text-lg font-medium mb-4 tracking-wide">
            03:18 's nachts. Niemand om te bellen.
          </p>

          <h1 className="text-3xl sm:text-5xl font-bold leading-tight text-white max-w-3xl mx-auto text-balance">
            Altijd iemand die luistert,
            <span className="block text-primary-200 mt-1">
              ook als het moeilijk is
            </span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-primary-200 max-w-xl mx-auto leading-relaxed text-balance">
            Benji is er voor je als je verdriet hebt, iets verliest of gewoon
            je gedachten kwijt wilt. Altijd beschikbaar, zonder oordeel.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/"
              className="w-full sm:w-auto px-8 py-4 bg-white text-primary-900 font-semibold rounded-xl hover:bg-primary-50 transition-colors shadow text-base text-center"
            >
              Praat nu met Benji
            </Link>
            <Link
              href="/blog"
              className="w-full sm:w-auto px-8 py-4 bg-primary-700 text-white font-medium rounded-xl hover:bg-primary-600 transition-colors text-base border border-primary-600 text-center"
            >
              Lees over verdriet en verlies
            </Link>
          </div>

          <p className="mt-6 text-sm text-primary-300">
            Anoniem · Geen registratie nodig · Direct beschikbaar
          </p>
        </div>
      </section>

      {/* Drie blokken */}
      <section className="max-w-5xl mx-auto px-6 py-16 sm:py-20">
        <h2 className="text-2xl sm:text-3xl font-bold text-primary-900 text-center mb-3 text-balance">
          Waar kan ik je mee helpen?
        </h2>
        <p className="text-primary-600 text-center mb-12 max-w-lg mx-auto text-balance">
          Of je nu wilt praten, lezen of een begeleid programma wilt volgen,
          kies wat bij jou past.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {BLOKKEN.map((blok) => (
            <Link
              key={blok.titel}
              href={blok.href}
              className="group relative flex flex-col bg-white border border-primary-100 rounded-2xl p-6 hover:shadow-md hover:border-primary-300 transition-all"
            >
              {blok.badge && (
                <span className="absolute top-4 right-4 text-[10px] font-semibold uppercase tracking-wide bg-primary-100 text-primary-600 px-2 py-0.5 rounded-full">
                  {blok.badge}
                </span>
              )}

              <div className={`w-12 h-12 rounded-xl ${blok.kleur} text-white flex items-center justify-center mb-4 flex-shrink-0`}>
                {blok.icon}
              </div>

              <h3 className="text-base font-semibold text-primary-900 mb-2 text-balance">{blok.titel}</h3>
              <p className="text-sm text-primary-600 leading-relaxed flex-1 text-balance">{blok.omschrijving}</p>

              <div className={`mt-5 text-sm font-medium ${blok.tekstKleur} flex items-center gap-1.5 group-hover:gap-2.5 transition-all`}>
                {blok.cta}
                <IconArrow />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Kenmerken strip */}
      <section className="bg-primary-900">
        <div className="max-w-5xl mx-auto px-6 py-14">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {KENMERKEN.map((k) => (
              <div key={k.titel} className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-primary-800 text-primary-300 flex items-center justify-center flex-shrink-0">
                  {k.icon}
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white mb-1">{k.titel}</h3>
                  <p className="text-sm text-primary-300 leading-relaxed">{k.tekst}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Over Benji / Ien */}
      <section className="bg-primary-50 border-b border-primary-100">
        <div className="max-w-2xl mx-auto px-6 py-14 text-center">
          {/* Foto + naam */}
          <div className="flex flex-col items-center mb-6">
            <div className="w-20 h-20 rounded-2xl overflow-hidden mb-3">
              <Image
                src="/images/ien-founder.png"
                alt="Ien Vos, oprichter"
                width={80}
                height={80}
                className="object-cover w-full h-full"
              />
            </div>
            <p className="text-xs font-semibold text-primary-900">Ien</p>
            <p className="text-xs text-primary-400">Oprichter Talk To Benji</p>
          </div>

          {/* Tekst */}
          <p className="text-xs font-semibold uppercase tracking-wide text-primary-400 mb-2">Over Benji</p>
          <h2 className="text-xl sm:text-2xl font-bold text-primary-900 mb-5 text-balance">
            Gemaakt omdat er iets ontbrak en uit eigen ervaring met verlies
          </h2>
          <div className="space-y-4 text-sm text-primary-700 leading-relaxed text-left">
            <p className="text-balance">
              Ik ben Ien, oprichter van Talk To Benji. Ik vroeg me af waarom er voor mensen
              met verdriet zo weinig is dat echt laagdrempelig is. Geen wachtlijst, geen intake,
              geen afspraak, gewoon iemand die luistert, ook om 03:00 's nachts.
            </p>
            <p className="text-balance">
              Dat werd Benji. Zes jaar lang zocht ik naar de beste manier om een plek te maken
              waar je je verhaal kwijt kunt, je gedachten kunt ordenen en zo beter zicht krijgt
              op alles wat er in je hoofd zit. Niet om je te vertellen wat je moet doen, maar
              om je te helpen het zelf te begrijpen.
            </p>
            <p className="text-balance">
              Benji is geen professional, en dat zegt hij ook eerlijk. Maar voor de momenten
              dat de drempel naar echte hulp te hoog is, of als je gewoon wilt zeggen wat er
              is, dan is Benji er.
            </p>
          </div>
          <Link
            href="/waarom-benji"
            className="inline-flex items-center gap-1.5 mt-5 text-sm font-medium hover:opacity-80 transition-opacity"
            style={{ color: "#7ec8e3" }}
          >
            Waarom Benji?
            <IconArrow />
          </Link>
        </div>
      </section>

      {/* Zo werkt een gesprek met Benji */}
      <section className="max-w-5xl mx-auto px-6 py-16 sm:py-20">
        <h2 className="text-2xl sm:text-3xl font-bold text-primary-900 text-center mb-3 text-balance">
          Zo werkt een gesprek met Benji
        </h2>
        <p className="text-primary-500 text-center text-sm mb-10 text-balance">
          Geen formulieren, geen intake. Gewoon beginnen.
        </p>
        {/* Rij 1: stappen 1-2-3 */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[
            { stap: "1", titel: "Je typt of zegt wat er is", tekst: "Geen vragen vooraf, geen verplicht onderwerp. Je begint gewoon, ook als je niet precies weet waar je moet starten." },
            { stap: "2", titel: "Benji luistert en vraagt door", tekst: "Benji reageert op jou. Stelt vragen, geeft ruimte, en past zich aan wat jij nodig hebt op dat moment." },
            { stap: "3", titel: "Jij bepaalt wanneer je stopt", tekst: "Je sluit het gesprek af wanneer jij wilt. Geen verplichtingen, geen follow-up die je niet wilt." },
          ].map((s) => (
            <div key={s.stap} className="flex flex-col p-8 bg-white rounded-2xl border" style={{ borderColor: "#7ec8e3" }}>
              <div className="w-10 h-10 rounded-full bg-primary-900 text-white text-base font-bold flex items-center justify-center mb-5 flex-shrink-0">
                {s.stap}
              </div>
              <h3 className="text-base font-semibold text-primary-900 mb-2">{s.titel}</h3>
              <p className="text-sm text-primary-600 leading-relaxed text-balance">{s.tekst}</p>
            </div>
          ))}
        </div>

        {/* Rij 2: stappen 4-5 gecentreerd, zelfde breedte als hierboven */}
        <div className="mt-6 flex flex-col sm:flex-row justify-center gap-6">
          {[
            { stap: "4", titel: "Verder waar je gebleven was", tekst: "Met een gratis account blijven je gesprekken bewaard. Je kunt op elk moment verder waar je gebleven was.", link: null },
            { stap: "5", titel: "Er is meer", tekst: "Met Benji voor een jaar heb je toegang tot alles: reflecties, doelen, memories, dagelijkse check-ins, inspiratie en een herdenkingskalender.", link: { tekst: "Bekijk wat erbij zit", href: "/lp/jaar-toegang" } },
          ].map((s) => (
            <div key={s.stap} className="flex flex-col p-8 bg-white rounded-2xl border sm:w-[calc(33.333%-0.75rem)]" style={{ borderColor: "#7ec8e3" }}>
              <div className="w-10 h-10 rounded-full bg-primary-900 text-white text-base font-bold flex items-center justify-center mb-5 flex-shrink-0">
                {s.stap}
              </div>
              <h3 className="text-base font-semibold text-primary-900 mb-2">{s.titel}</h3>
              <p className="text-sm text-primary-600 leading-relaxed text-balance flex-1">{s.tekst}</p>
              {s.link && (
                <Link href={s.link.href} className="inline-flex items-center gap-1 mt-3 text-sm font-medium hover:opacity-80 transition-opacity" style={{ color: "#7ec8e3" }}>
                  {s.link.tekst}
                  <IconArrow />
                </Link>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Ervaringen */}
      <section className="bg-primary-50 border-y border-primary-100">
        <div className="max-w-5xl mx-auto px-6 py-14 sm:py-16">
          <h2 className="text-xl sm:text-2xl font-bold text-primary-900 text-center mb-8">
            Wat anderen zeggen
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {ERVARINGEN.map((e) => (
              <div
                key={e.naam}
                className="bg-white rounded-xl border border-gray-100 flex flex-col p-5"
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5 text-primary-200 mb-2 flex-shrink-0" fill="currentColor">
                  <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                </svg>
                <p className="text-sm leading-relaxed italic mb-3 flex-1 text-balance text-primary-700">
                  {e.tekst}
                </p>
                <p className="text-xs font-medium text-primary-400">{e.naam}</p>
              </div>
            ))}
          </div>
          <p className="mt-6 text-xs text-center max-w-lg mx-auto text-balance" style={{ color: "#b0b8c8" }}>
            Vanwege privacy gebruiken we geen volledige naam of foto, maar we zijn oprecht blij dat deze mensen hun ervaring met Benji willen delen.
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-3xl mx-auto px-6 py-16 sm:py-20">
        <h2 className="text-2xl sm:text-3xl font-bold text-primary-900 text-center mb-2 text-balance">
          Veelgestelde vragen over Benji
        </h2>
        <p className="text-primary-500 text-center mb-10 text-sm">
          Goed om te weten voordat je begint.
        </p>

        <div className="space-y-3">
          {FAQ.map((item) => (
            <details
              key={item.vraag}
              className="group bg-white border border-primary-100 rounded-2xl overflow-hidden"
            >
              <summary className="flex items-center justify-between gap-4 px-6 py-5 cursor-pointer list-none select-none hover:bg-primary-50 transition-colors">
                <span className="text-sm sm:text-base font-semibold text-primary-900 text-balance pr-2">
                  {item.vraag}
                </span>
                {/* Plus/min icoon */}
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-lg font-light leading-none group-open:rotate-45 transition-transform">
                  +
                </span>
              </summary>
              <div className="px-6 pb-5 pt-1 space-y-2">
                <p className="text-sm text-primary-600 leading-relaxed text-balance">
                  {item.antwoord}
                </p>
                {item.link && (
                  <Link
                    href={item.link.href}
                    className="inline-flex items-center gap-1 text-sm font-medium text-primary-700 hover:text-primary-900 transition-colors"
                  >
                    {item.link.tekst}
                    <IconArrow />
                  </Link>
                )}
              </div>
            </details>
          ))}
        </div>
      </section>

      {/* Tweede CTA */}
      <section className="bg-primary-50 border-y border-primary-100">
      <div className="max-w-4xl mx-auto px-6 py-16 text-center">
        <h2 className="text-2xl sm:text-3xl font-bold text-primary-900 mb-4 text-balance">
          Klaar om te beginnen?
        </h2>
        <p className="text-primary-600 mb-8 max-w-sm mx-auto text-balance">
          Je hoeft je niet te registreren. Begin gewoon een gesprek,
          anoniem en direct beschikbaar.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-8 py-4 bg-primary-800 text-white font-semibold rounded-xl hover:bg-primary-700 transition-colors shadow text-base"
        >
          <IconChat />
          Praat nu met Benji
        </Link>
      </div>
      </section>

      {/* Brug naar Niet Alleen */}
      <section className="bg-primary-50 border-b border-primary-100">
      <div className="max-w-2xl mx-auto px-6 pb-10 pt-6 text-center">
        <p className="text-sm text-primary-500 text-balance">
          Wil je meer dan één gesprek?{" "}
          <Link href="/niet-alleen-nl" className="text-primary-700 font-medium hover:underline">
            Niet Alleen
          </Link>{" "}
          is een 30-dagen begeleiding via dagelijkse berichten, een kleine stap elke dag.
        </p>
      </div>
      </section>

      {/* Footer */}
      <SiteFooter />

      {/* Houvast floating knop */}
      <HouvasteKnop />

    </div>
  );
}
