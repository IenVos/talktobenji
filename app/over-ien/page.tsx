import type { Metadata } from "next";
import Link from "next/link";
import { HeaderBar } from "@/components/chat/HeaderBar";
import { SiteFooter } from "@/components/SiteFooter";

const CANONICAL = "https://www.talktobenji.com/over-ien";

// CONCEPT: staat op noindex zolang Ien de tekst nakijkt en de video/foto nog
// moeten landen. Zet `index: true` zodra de pagina live mag (en voeg 'm toe aan
// het "Over"-menu). Dit is een belangrijke EEAT/trust-pagina voor een YMYL-site.
export const metadata: Metadata = {
  title: "Over Ien | De oprichter van Talk To Benji",
  description:
    "Ik ben Ien, de oprichter van Talk To Benji. Ik maakte Benji vanuit wat ik zelf meemaakte: hoe eenzaam het kan zijn om verdriet in stilte te dragen.",
  robots: { index: false, follow: true },
  alternates: { canonical: CANONICAL },
};

const personSchema = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: "Ien",
  jobTitle: "Oprichter",
  worksFor: {
    "@type": "Organization",
    name: "Talk To Benji",
    url: "https://www.talktobenji.com",
  },
  url: CANONICAL,
  image: "https://www.talktobenji.com/images/ien-founder.png",
  description:
    "Ien is de oprichter van Talk To Benji. Ze maakte Benji vanuit haar eigen ervaring met verlies en de overtuiging dat niemand verdriet in stilte hoeft te dragen.",
};

export default function OverIenPage() {
  return (
    <div className="min-h-screen bg-stone-50">
      <HeaderBar />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personSchema) }}
      />

      <div className="max-w-3xl mx-auto px-4 py-12">
        {/* Hero */}
        <div className="flex items-center gap-4 mb-8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/ien-founder.png"
            alt="Ien, oprichter van Talk To Benji"
            className="w-20 h-20 rounded-full object-cover flex-shrink-0 border border-stone-200"
          />
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-stone-800 leading-tight mb-1">
              Over Ien
            </h1>
            <p className="text-sm text-primary-600 font-medium">
              Oprichter van Talk To Benji
            </p>
          </div>
        </div>

        {/* Video-slot: vervang de placeholder door een <video> of embed zodra de
            korte video klaar is waarin Ien haar verhaal vertelt. */}
        <div className="mb-10 rounded-2xl border border-dashed border-stone-300 bg-stone-100 px-6 py-10 text-center">
          <p className="text-sm text-stone-500">
            Hier komt een korte video waarin Ien in het kort haar verhaal vertelt.
          </p>
        </div>

        {/* Verhaal */}
        <div className="space-y-5 text-stone-700 leading-relaxed">
          <p>
            Ik ben Ien, de oprichter van Talk To Benji. Ik heb Benji niet bedacht
            vanachter een bureau, maar vanuit wat ik zelf heb meegemaakt en van
            dichtbij heb zien gebeuren.
          </p>
          <p>
            Toen mijn schoonzus ziek werd en overleed, zag ik hoe iedereen om haar
            heen verdriet droeg, en hoe iedereen daarin op een eigen manier ook
            alleen was. Zelf woon ik in Zweden, ver van mijn familie en vrienden in
            Nederland. Die afstand maakt verdriet nog een beetje zwaarder, want je
            kunt niet even langsgaan.
          </p>
          <p>
            Wat me al jaren bezighoudt, is dat verdriet zo vaak in stilte wordt
            gedragen. Niet omdat er niemand is, maar omdat je niemand wilt
            belasten, omdat iedereen het druk heeft, of omdat je eerst je eigen
            gedachten wilt ordenen.
          </p>
          <p>
            Vier jaar geleden begon ik Beterschap-cadeau.nl, een plek voor mensen
            die iemand willen steunen die iets moeilijks meemaakt. Daar volgde een
            troostwoordenboekje op, en voor wie het verdriet zelf draagt het Niet
            Alleen programma. Maar één vraag bleef terugkomen: hoe help ik mensen
            direct, op het moment dat ze er zelf middenin zitten?
          </p>
          <p>
            Benji is mijn antwoord op die vraag. Een luisterend oor dat er altijd
            is, ook midden in de nacht, zonder oordeel en zonder haast. Geen
            vervanging van professionele hulp, maar een plek om te beginnen.
          </p>
        </div>

        {/* Doorverwijzing naar het Benji-verhaal (geen dubbele content) */}
        <div className="mt-10 p-5 bg-primary-50 rounded-2xl border border-primary-100">
          <p className="text-stone-700 leading-relaxed mb-3">
            Waarom Benji is zoals hij is, en de keuzes die ik daarin bewust heb
            gemaakt, lees je op de pagina over Benji zelf.
          </p>
          <Link
            href="/waarom-benji"
            className="inline-block text-sm text-primary-700 border border-primary-200 rounded-xl px-5 py-2.5 hover:bg-primary-100 transition-colors"
          >
            Lees waarom Benji bestaat →
          </Link>
        </div>

        {/* CTA */}
        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          <Link
            href="/benji"
            className="inline-block text-center bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-xl px-6 py-3 transition-colors"
          >
            Begin een gesprek met Benji
          </Link>
          <Link
            href="/lp/zij-aan-zij"
            className="inline-block text-center border border-stone-300 text-stone-700 font-medium rounded-xl px-6 py-3 hover:bg-stone-100 transition-colors"
          >
            Persoonlijke begeleiding met Ien
          </Link>
        </div>
      </div>

      <SiteFooter variant="dark" />
    </div>
  );
}
