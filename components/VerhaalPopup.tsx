"use client";

import Image from "next/image";
import Link from "next/link";
import { X } from "lucide-react";
import { useState } from "react";

interface VerhaalPopupProps {
  onClose: () => void;
}

export function VerhaalTrigger({ className, children }: { className?: string; children?: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(true)} className={className}>
        {children ?? "Lees het verhaal achter Benji"}
      </button>
      {open && <VerhaalPopup onClose={() => setOpen(false)} />}
    </>
  );
}

export function VerhaalPopup({ onClose }: VerhaalPopupProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white w-full sm:max-w-lg max-h-[92dvh] sm:max-h-[88dvh] rounded-t-2xl sm:rounded-2xl overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 px-5 py-4 flex items-center justify-between z-10">
          <h2 className="text-sm font-semibold text-gray-900">Het verhaal achter Benji</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            aria-label="Sluiten"
          >
            <X size={18} />
          </button>
        </div>

        {/* Inhoud */}
        <div className="px-5 py-6 space-y-4 text-sm text-gray-700 leading-relaxed">

          {/* Founder */}
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

          <p>
            Vanuit die overtuiging begon ik Beterschap-cadeau.nl, een plek voor mensen die iemand willen steunen die iets moeilijks meemaakt.
          </p>

          <div className="rounded-xl overflow-hidden">
            <a href="https://www.beterschap-cadeau.nl" target="_blank" rel="noopener noreferrer">
              <Image
                src="/images/beterschap-cadeau.png"
                alt="Beterschap-cadeau.nl"
                width={800}
                height={500}
                className="w-full object-cover hover:opacity-90 transition-opacity"
              />
            </a>
          </div>

          <p>
            Er volgde een{" "}
            <Link href="/lp/troostende-woorden" onClick={onClose} className="text-primary-600 hover:text-primary-700 underline underline-offset-2">
              troostwoordenboekje
            </Link>
            , omdat mensen behoefte bleken te hebben aan woorden als die van henzelf niet komen.
          </p>

          <div className="flex justify-center">
            <Link href="/lp/troostende-woorden" onClick={onClose}>
              <Image
                src="/images/troostende-woorden-cover.png"
                alt="Troostende woorden"
                width={220}
                height={320}
                className="rounded-xl shadow-sm hover:opacity-90 transition-opacity"
              />
            </Link>
          </div>

          <p>
            En voor mensen die dat verdriet zelf dragen, en er niet alleen mee willen zijn, ontwikkelde ik het{" "}
            <Link href="/lp/niet-alleen-a" onClick={onClose} className="text-primary-600 hover:text-primary-700 underline underline-offset-2">
              Niet Alleen programma
            </Link>
            {" "}— begeleiding via dagelijkse gesprekken met Benji, speciaal voor wie rouwt en dat niet langer alleen wil doen.
          </p>

          <div className="rounded-xl overflow-hidden">
            <Link href="/lp/niet-alleen-a" onClick={onClose}>
              <Image
                src="/images/niet-alleen-product.png"
                alt="Niet Alleen programma"
                width={800}
                height={500}
                className="w-full object-cover hover:opacity-90 transition-opacity"
              />
            </Link>
          </div>

          <p>Benji is het antwoord op de vraag: hoe kan ik mensen direct helpen, op het moment dat ze er zelf mee zitten?</p>

          <p>Door te schrijven of hardop te praten worden dingen vaak een stukje duidelijker. Niet opgelost, maar draaglijker.</p>

          <p>Verdriet verdient ruimte. Benji geeft die ruimte, altijd.</p>

          <p className="text-gray-500 italic">Ik hoop dat het voor jou kan zijn wat ik zelf graag had gehad: een plek waar je verhaal ertoe doet, ook als je het nog niet hardop durft te zeggen.</p>

          {/* CTA */}
          <div className="pt-4 border-t border-gray-100 space-y-3">
            <Link
              href="/registreren"
              onClick={onClose}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-primary-700 hover:bg-primary-600 text-white rounded-xl font-medium text-sm transition-colors"
            >
              Maak een gratis account aan →
            </Link>
            <Link
              href="/voor-jou"
              onClick={onClose}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-xl font-medium text-sm transition-colors border border-gray-200"
            >
              Bekijk alle producten en programma's
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
