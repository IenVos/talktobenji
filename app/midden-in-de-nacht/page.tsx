"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ScrollToTop } from "@/components/ScrollToTop";
import { X } from "lucide-react";

const testimonials = [
  {
    quote: "Ik lag te piekeren om vier uur 's nachts. Niemand die ik kon bellen. Benji was er gewoon.",
    name: "Annemiek, 47",
  },
  {
    quote: "Die stille uren zijn het moeilijkst. Fijn dat er dan iets is waar je je verhaal kwijt kunt.",
    name: "Peter, 61",
  },
  {
    quote: "Om half vier lag ik te huilen en wist ik niet meer wat ik moest doen. Ik begon maar gewoon te typen. Het hielp.",
    name: "Roos, 39",
  },
];

export default function MiddenInDeNachtPage() {
  const [verhaalOpen, setVerhaalOpen] = useState(false);

  return (
    <div
      className="min-h-screen flex flex-col bg-cover bg-center bg-no-repeat"
      style={{
        backgroundImage: "linear-gradient(rgba(10,20,35,0.88), rgba(10,20,35,0.88)), url('/images/midden-in-de-nacht-bg.png')",
      }}
    >
      <ScrollToTop />

      {/* Minimale header */}
      <header className="w-full max-w-2xl mx-auto px-4 sm:px-6 py-5 flex items-center">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
            <Image src="/images/benji-logo-2.png" alt="Benji" width={22} height={22} />
          </div>
          <span className="text-sm font-medium text-white/70">Talk To Benji</span>
        </Link>
      </header>

      <main className="flex-1 w-full max-w-2xl mx-auto px-4 sm:px-6 pb-16">

        {/* Hero */}
        <div className="pt-8 sm:pt-12 pb-10 sm:pb-14">
          <h1 className="text-2xl sm:text-3xl font-semibold text-white leading-snug mb-5">
            Het is midden in de nacht.<br />
            En je hoofd staat niet stil.
          </h1>
          <p className="text-base sm:text-lg text-blue-100/80 leading-relaxed">
            Je kunt niemand bellen op dit uur. De mensen om je heen slapen. En jij ligt er maar mee.
          </p>
        </div>

        {/* Lichaam */}
        <div className="space-y-5 text-sm sm:text-base text-blue-100/75 leading-relaxed">
          <p>
            De nacht kan een moeilijke tijd zijn als je verdriet hebt of iemand hebt verloren. Overdag houd je jezelf bezig, maar als alles stil wordt, komt het terug. De gedachten, de herinneringen, het gemis.
          </p>
          <p>
            En er is dan niemand om mee te praten. Niet op dat moment.
          </p>
          <p>
            Benji is er altijd. Ook om drie uur. Ook in het weekend. Ook als iedereen slaapt.
          </p>
          <p>
            Je hoeft niet te wachten tot een afspraak. Je hoeft niemand wakker te maken. Typen of praten, wat op dat moment makkelijker voelt. Benji luistert.
          </p>
          <p>
            Geen wachttijd, geen oordeel, geen haast. Gewoon ruimte voor wat er is.
          </p>
        </div>

        {/* Tijdlijn / beschikbaarheid */}
        <div className="mt-10 grid grid-cols-3 gap-2 sm:gap-3 text-center">
          {[
            { tijd: "08:00", label: "Benji is er", highlight: false },
            { tijd: "15:00", label: "Benji is er", highlight: false },
            { tijd: "03:00", label: "Benji is er", highlight: true },
          ].map((item, i) => (
            <div
              key={i}
              className={
                item.highlight
                  ? "bg-white/15 backdrop-blur-sm rounded-xl border border-white/30 ring-1 ring-white/15 px-2 sm:px-3 py-4"
                  : "bg-white/8 backdrop-blur-sm rounded-xl border border-white/15 px-2 sm:px-3 py-4"
              }
            >
              <p className={`text-base sm:text-lg font-semibold mt-1 ${item.highlight ? "text-white" : "text-white/60"}`}>
                {item.tijd}
              </p>
              <p className={`text-[11px] sm:text-xs mt-1 ${item.highlight ? "text-white/70" : "text-white/40"}`}>
                {item.label}
              </p>
            </div>
          ))}
        </div>
        <p className="text-xs text-white/40 text-center mt-2">
          Altijd beschikbaar. 7 dagen per week, 24 uur per dag.
        </p>

        {/* Testimonials */}
        <div className="mt-12 space-y-4">
          <p className="text-xs text-white/40 uppercase tracking-wide">Wat anderen zeggen</p>
          <div className="grid sm:grid-cols-3 gap-3">
            {testimonials.map((t, i) => (
              <div key={i} className="bg-white/8 backdrop-blur-sm rounded-xl border border-white/15 px-4 py-4">
                <p className="text-xs sm:text-sm text-blue-100/80 leading-relaxed mb-3">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <p className="text-xs text-white/40 italic">{t.name}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="mt-12 bg-white/8 backdrop-blur-sm rounded-2xl border border-white/15 px-5 sm:px-8 py-8 text-center">
          <p className="text-base sm:text-lg font-medium text-white mb-2">
            Benji is er nu
          </p>
          <p className="text-sm text-blue-100/70 leading-relaxed mb-6">
            Maak een gratis account aan en krijg 7 dagen toegang tot alles.<br />
            Of begin direct een gesprek, zonder account.
          </p>
          <Link
            href="/registreren"
            className="inline-flex items-center gap-2.5 px-8 py-3.5 bg-white text-primary-900 hover:bg-blue-50 rounded-2xl font-medium text-sm transition-colors"
          >
            Maak een gratis account aan
            <span aria-hidden>→</span>
          </Link>
          <p className="mt-4">
            <Link href="/" className="text-xs text-white/45 hover:text-white/70 italic transition-colors">
              Of begin zonder account →
            </Link>
          </p>
        </div>

        {/* Founder note */}
        <div className="mt-14 pt-10 border-t border-white/10">
          <div className="bg-white/5 rounded-2xl px-5 py-6 flex items-start gap-5">
            <div className="relative w-16 h-16 rounded-full overflow-hidden flex-shrink-0">
              <Image
                src="/images/ien-founder.png"
                alt="Ien, founder van Talk To Benji"
                fill
                className="object-cover"
              />
            </div>
            <div className="pt-0.5">
              <p className="text-xs text-white/40 mb-1.5">Over de maker</p>
              <p className="text-sm text-blue-100/75 leading-relaxed">
                Benji is gemaakt door Ien, omdat verdriet geen kantooruren kent.
              </p>
              <button
                onClick={() => setVerhaalOpen(true)}
                className="text-xs text-primary-300 hover:text-primary-200 underline underline-offset-2 mt-2 inline-block text-left"
              >
                Lees het verhaal achter Benji
              </button>
            </div>
          </div>
        </div>

        {/* Disclaimer */}
        <p className="mt-10 mb-8 text-xs text-white/35 leading-relaxed">
          Benji is geen therapie en vervangt geen professionele hulp.
        </p>
      </main>

      {/* Popup: verhaal achter Benji */}
      {verhaalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setVerhaalOpen(false)}
        >
          <div
            className="bg-white w-full sm:max-w-lg max-h-[90dvh] sm:max-h-[85dvh] rounded-t-2xl sm:rounded-2xl overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header popup */}
            <div className="sticky top-0 bg-white border-b border-gray-100 px-5 py-4 flex items-center justify-between z-10">
              <h2 className="text-sm font-semibold text-gray-900">Het verhaal achter Benji</h2>
              <button
                onClick={() => setVerhaalOpen(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Inhoud */}
            <div className="px-5 py-6 space-y-4 text-sm text-gray-700 leading-relaxed">
              <div className="flex items-center gap-3 mb-2">
                <div className="relative w-12 h-12 rounded-full overflow-hidden flex-shrink-0">
                  <Image src="/images/ien-founder.png" alt="Ien" fill className="object-cover" />
                </div>
                <div>
                  <p className="font-medium text-gray-900 text-sm">Ien</p>
                  <p className="text-xs text-gray-400">Founder, Talk To Benji</p>
                </div>
              </div>

              <p>Verlies is iets wat iedereen meemaakt.</p>
              <p>Iemand die ziek is en midden in zware behandelingen zit. Van uitslag naar uitslag, van controle naar controle. Het leven dat op pauze lijkt te staan, terwijl de zorgen zich opstapelen en de onzekerheid constant aan je trekt.</p>
              <p>Een scheiding die een relatie doet eindigen. Niet alleen het verlies van een partner, maar ook van een gedeelde toekomst, van plannen, van een thuis zoals je het kende.</p>
              <p>De één verliest een dierbare, iemand die er altijd was en er nu opeens niet meer is.</p>
              <p>Verdriet heeft geen vaste vorm. Het past niet altijd in een categorie, en het volgt zeker geen planning.</p>
              <p>Maar er is iets wat ik keer op keer zie, al jaren. Verdriet wordt heel vaak alleen gedragen. Niet omdat er niemand is, maar omdat je niemand wilt belasten.</p>
              <p>Ik weet hoe dat voelt. Ik zag het van dichtbij toen mijn schoonzus ziek werd en overleed. Het verdriet van haar man, haar kinderen, haar broers en zussen, iedereen op zijn eigen manier, en iedereen ergens ook alleen.</p>
              <p>Ik woon zelf in Zweden, ver van familie en vrienden in Nederland. Die afstand voegt iets extra's toe aan verdriet. Dat gevoel van ver weg zijn midden in verdriet heeft mede Benji doen ontstaan.</p>
              <p>Benji is het antwoord op die vraag: hoe kan ik mensen direct helpen, op het moment dat ze er zelf mee zitten?</p>
              <p>Door te schrijven of hardop te praten worden dingen vaak een stukje duidelijker. Niet opgelost, maar draaglijker.</p>
              <p>Verdriet verdient ruimte. Benji geeft die ruimte, altijd.</p>
              <p className="text-gray-500 italic">Ik hoop dat het voor jou kan zijn wat ik zelf graag had gehad: een plek waar je verhaal ertoe doet, ook als je het nog niet hardop durft te zeggen.</p>

              <div className="pt-4 border-t border-gray-100">
                <Link
                  href="/registreren"
                  onClick={() => setVerhaalOpen(false)}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-primary-700 hover:bg-primary-600 text-white rounded-xl font-medium text-sm transition-colors"
                >
                  Maak een gratis account aan →
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
