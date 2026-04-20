/**
 * CONCEPT — nieuwe homepagina opzet.
 * Bereikbaar via /home-concept, raakt niets aan de live site.
 * Wanneer klaar: inhoud verplaatsen naar app/page.tsx, huidige chat naar app/chat/page.tsx.
 */

import Link from "next/link";
import Image from "next/image";

// ─── Icoontjes als inline SVG zodat er geen extra dependencies nodig zijn ─────

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

// ─── Data ─────────────────────────────────────────────────────────────────────

const BLOKKEN = [
  {
    icon: <IconChat />,
    kleur: "bg-primary-600",
    lichtKleur: "bg-primary-50",
    tekstKleur: "text-primary-700",
    titel: "Praat met Benji",
    omschrijving:
      "Benji luistert zonder oordeel, ook midden in de nacht. Anoniem, direct beschikbaar — geen wachtlijst, geen drempel.",
    cta: "Begin een gesprek",
    href: "/",
    badge: null,
  },
  {
    icon: <IconBlog />,
    kleur: "bg-primary-700",
    lichtKleur: "bg-primary-50",
    tekstKleur: "text-primary-700",
    titel: "Lees over rouw & verdriet",
    omschrijving:
      "Praktische artikelen over rouwverwerking, verlies en hoe je ermee omgaat — geschreven vanuit echte ervaringen.",
    cta: "Bekijk alle artikelen",
    href: "/blog",
    badge: null,
  },
  {
    icon: <IconHeart />,
    kleur: "bg-primary-800",
    lichtKleur: "bg-primary-50",
    tekstKleur: "text-primary-700",
    titel: "Niet Alleen programma",
    omschrijving:
      "Een persoonlijk rouwprogramma van 6 weken, opgebouwd rond jouw verlies. Dagelijkse steun wanneer jij het nodig hebt.",
    cta: "Ontdek het programma",
    href: "/niet-alleen-nl",
    badge: "Programma",
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
    titel: "Persoonlijk & veilig",
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
    tekst: "Ik kon eindelijk zeggen wat ik niet durfte te zeggen tegen mijn familie. Benji luisterde gewoon.",
    naam: "Anke, 54",
  },
  {
    tekst: "Om drie uur 's nachts, toen ik het niet meer zag zitten, was Benji er. Dat heeft echt geholpen.",
    naam: "Mark, 41",
  },
  {
    tekst: "Ik dacht dat een AI niks voor mij was. Maar het voelt verrassend menselijk.",
    naam: "Sophie, 29",
  },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function HomeConceptPage() {
  return (
    <div className="min-h-screen bg-white">

      {/* ── CONCEPT BANNER ─────────────────────────────────────────────────── */}
      <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-center text-xs text-amber-700 font-medium">
        Concept — alleen zichtbaar via /home-concept, nog niet live
      </div>

      {/* ── HERO ───────────────────────────────────────────────────────────── */}
      <section className="relative bg-primary-900 text-white overflow-hidden">
        {/* Achtergrond laag */}
        <div className="absolute inset-0 opacity-20">
          <Image
            src="/images/achtergrond.png"
            alt=""
            fill
            className="object-cover object-center"
            priority
          />
        </div>

        <div className="relative max-w-5xl mx-auto px-6 py-20 sm:py-28 text-center">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <Image
              src="/images/benji-logo-2.png"
              alt="Benji"
              width={72}
              height={72}
              className="rounded-2xl shadow-lg"
            />
          </div>

          {/* Headline — SEO-gericht op rouwverwerking */}
          <h1 className="text-3xl sm:text-5xl font-bold leading-tight text-white max-w-3xl mx-auto">
            Rouwverwerking begint met
            <span className="block text-primary-200 mt-1">iemand die echt luistert</span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-primary-200 max-w-2xl mx-auto leading-relaxed">
            Benji is een AI-gesprekspartner die er voor je is als je verdriet hebt, rouwt of
            gewoon je gedachten kwijt wilt. Altijd beschikbaar, zonder oordeel.
          </p>

          {/* CTA knoppen */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/"
              className="px-8 py-4 bg-white text-primary-900 font-semibold rounded-xl hover:bg-primary-50 transition-colors shadow text-base"
            >
              Praat nu met Benji
            </Link>
            <Link
              href="/blog"
              className="px-8 py-4 bg-primary-700 text-white font-medium rounded-xl hover:bg-primary-600 transition-colors text-base border border-primary-600"
            >
              Lees over rouw & verlies
            </Link>
          </div>

          {/* Kleine geruststelling */}
          <p className="mt-6 text-sm text-primary-300">
            Anoniem · Geen registratie nodig · Direct beschikbaar
          </p>
        </div>
      </section>

      {/* ── DRIE BLOKKEN ───────────────────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-6 py-16 sm:py-20">
        <h2 className="text-2xl sm:text-3xl font-bold text-primary-900 text-center mb-3">
          Waar kan ik je mee helpen?
        </h2>
        <p className="text-primary-600 text-center mb-12 max-w-xl mx-auto">
          Of je nu wilt praten, lezen of een begeleид programma wilt volgen — kies wat bij jou past.
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

              {/* Icoon */}
              <div className={`w-12 h-12 rounded-xl ${blok.kleur} text-white flex items-center justify-center mb-4 flex-shrink-0`}>
                {blok.icon}
              </div>

              <h3 className="text-base font-semibold text-primary-900 mb-2">{blok.titel}</h3>
              <p className="text-sm text-primary-600 leading-relaxed flex-1">{blok.omschrijving}</p>

              <div className={`mt-5 text-sm font-medium ${blok.tekstKleur} flex items-center gap-1.5 group-hover:gap-2.5 transition-all`}>
                {blok.cta}
                <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 flex-shrink-0">
                  <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                </svg>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── KENMERKEN STRIP ────────────────────────────────────────────────── */}
      <section className="bg-primary-50 border-y border-primary-100">
        <div className="max-w-5xl mx-auto px-6 py-14">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {KENMERKEN.map((k) => (
              <div key={k.titel} className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-white border border-primary-200 text-primary-600 flex items-center justify-center flex-shrink-0 shadow-sm">
                  {k.icon}
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-primary-900 mb-1">{k.titel}</h3>
                  <p className="text-sm text-primary-600 leading-relaxed">{k.tekst}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ERVARINGEN ─────────────────────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-6 py-16 sm:py-20">
        <h2 className="text-2xl sm:text-3xl font-bold text-primary-900 text-center mb-12">
          Wat anderen zeggen
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {ERVARINGEN.map((e) => (
            <div key={e.naam} className="bg-primary-50 rounded-2xl p-6 border border-primary-100">
              {/* Aanhalingstekens */}
              <svg viewBox="0 0 24 24" className="w-6 h-6 text-primary-300 mb-3" fill="currentColor">
                <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
              </svg>
              <p className="text-sm text-primary-700 leading-relaxed italic mb-4">{e.tekst}</p>
              <p className="text-xs font-medium text-primary-500">{e.naam}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── OVER BENJI / IEN ───────────────────────────────────────────────── */}
      <section className="bg-primary-900 text-white">
        <div className="max-w-5xl mx-auto px-6 py-16 sm:py-20">
          <div className="flex flex-col sm:flex-row items-center gap-10">
            <div className="flex-shrink-0">
              <div className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-primary-700 shadow-lg">
                <Image
                  src="/images/ien-founder.png"
                  alt="Ien Vos, oprichter"
                  width={96}
                  height={96}
                  className="object-cover w-full h-full"
                />
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-primary-400 mb-2">Over Benji</p>
              <h2 className="text-xl sm:text-2xl font-bold text-white mb-4">
                Gemaakt vanuit eigen ervaring met verlies
              </h2>
              <p className="text-primary-300 leading-relaxed max-w-xl">
                Benji is ontwikkeld door Ien Vos, die zelf weet hoe moeilijk het is om in een
                moeilijke periode steun te vinden. Benji is geen vervanging voor professionele
                hulp, maar een veilige plek om te beginnen — dag en nacht beschikbaar.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── TWEEDE CTA ─────────────────────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-6 py-16 text-center">
        <h2 className="text-2xl sm:text-3xl font-bold text-primary-900 mb-4">
          Klaar om te beginnen?
        </h2>
        <p className="text-primary-600 mb-8 max-w-md mx-auto">
          Je hoeft je niet te registreren. Begin gewoon een gesprek — anoniem en direct.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-8 py-4 bg-primary-800 text-white font-semibold rounded-xl hover:bg-primary-700 transition-colors shadow text-base"
        >
          <IconChat />
          Praat nu met Benji
        </Link>
      </section>

    </div>
  );
}
