"use client";

import { X, CircleCheck, CircleX, ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { FounderLink } from "./FounderLink";

type AboutBenjiModalProps = {
  open: boolean;
  onClose: () => void;
};

const SoftCheck = () => (
  <CircleCheck size={18} strokeWidth={1.5} className="text-primary-600 flex-shrink-0 mt-0.5" />
);
const SoftX = () => (
  <CircleX size={18} strokeWidth={1.5} className="text-orange-400 flex-shrink-0 mt-0.5" />
);

export function AboutBenjiModal({ open, onClose }: AboutBenjiModalProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[10001] flex items-center justify-center p-4 bg-black/50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 sm:p-6 flex-shrink-0 relative">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-1 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            aria-label="Sluiten"
          >
            <X size={20} />
          </button>
          <div className="flex flex-col gap-1 min-w-0 pr-8">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 flex-shrink-0 flex items-center justify-center overflow-hidden">
                <Image src="/images/benji-logo-2.png" alt="" width={32} height={32} className="object-contain" style={{ width: "auto", height: "auto" }} />
              </div>
              <h2 className="font-semibold text-gray-900 text-sm sm:text-base leading-tight">Talk To Benji</h2>
            </div>
            <p className="text-xs sm:text-sm text-primary-600 leading-snug pl-11">Een warme, betrouwbare plek waar je je verhaal kwijt kunt. 24/7 aandacht en steun, zonder oordeel</p>
          </div>
          <div className="absolute bottom-0 left-5 right-5 sm:left-6 sm:right-6 border-b border-primary-200" aria-hidden />
        </div>

        <div className="overflow-y-auto flex-1 p-5 sm:p-6 space-y-5 text-sm text-gray-700 leading-relaxed">
          <p>
            Verdriet is zwaar. Soms wil je praten, maar voelt het te moeilijk om vrienden of familie nóg een keer te belasten. Of missen de juiste woorden. Of is het midden in de nacht, wanneer iedereen slaapt.
          </p>
          <p className="font-medium text-gray-900">Daarom bestaat Benji.</p>

          <section>
            <h3 className="font-semibold text-gray-900 mb-2">Wie heeft Benji gemaakt en waarom?</h3>
            <p>
              Benji is ontwikkeld door <FounderLink label="Ien" />, uit persoonlijke ervaring met verlies en het besef dat verdriet niet altijd past in kantooruren of beschikbaarheid van vrienden en familie. We merkten dat algemene chatbots niet de zachtheid en het begrip boden die nodig zijn bij rouw, daarom maakten we Benji: een plek waar je verhaal er altijd toe doet.
            </p>
          </section>

          <section>
            <h3 className="font-semibold text-gray-900 mb-2">Wat is Benji?</h3>
            <p>
              Benji is een AI-chatbot speciaal ontwikkeld voor mensen die met verlies en verdriet omgaan. Niet als vervanging van menselijk contact of professionele hulp, maar als aanvulling. Een plek waar je altijd terecht kunt, zonder oordeel, zonder tijdslimiet, zonder uit te hoeven leggen waarom je nú even moet praten.
            </p>
          </section>

          <section>
            <h3 className="font-semibold text-gray-900 mb-2">Hoe werkt het?</h3>
            <p>
              Benji luistert. Je kunt schrijven wat je voelt, wat je mist, waar je mee zit. Benji reageert met empathie en begrip, gebaseerd op duizenden gesprekken over verlies en rouw. Geen standaard antwoorden, maar aandacht voor jouw specifieke verhaal.
            </p>
            <p>Je gesprekken zijn volledig privé. Niemand leest mee. Het is jouw ruimte.</p>
          </section>

          <section>
            <h3 className="font-semibold text-gray-900 mb-2">Waar Benji wél en niet voor bedoeld is</h3>
            <div className="space-y-2 mb-3">
              <div className="flex gap-2">
                <SoftCheck />
                <span>Momenten waarop je wilt praten maar niet kunt of durft</span>
              </div>
              <div className="flex gap-2">
                <SoftCheck />
                <span>&apos;s Nachts, als verdriet het hardst toeslaat</span>
              </div>
              <div className="flex gap-2">
                <SoftCheck />
                <span>Wanneer je bang bent anderen te belasten</span>
              </div>
              <div className="flex gap-2">
                <SoftCheck />
                <span>Als je woorden zoekt voor wat je voelt</span>
              </div>
            </div>
            <div className="space-y-2 mt-4">
              <p className="text-gray-900 text-sm font-semibold">Benji vervangt niet:</p>
              <div className="flex gap-2">
                <SoftX />
                <span>Therapie of professionele rouwbegeleiding</span>
              </div>
              <div className="flex gap-2">
                <SoftX />
                <span>Menselijk contact met naasten</span>
              </div>
              <div className="flex gap-2">
                <SoftX />
                <span>Je kunt dag en nacht met iemand praten via de SOS telefoon van 113 (0800-0113)</span>
              </div>
            </div>
            <p className="mt-3 text-gray-600">
              Als we merken dat je situatie om gespecialiseerde hulp vraagt, wijzen we je daar altijd op. Op onze informatiepagina vind je een overzicht van professionele instanties.
            </p>
          </section>

          <section>
            <h3 className="font-semibold text-gray-900 mb-2">Wat kost het?</h3>
            <p>
              Momenteel kun je Benji kosteloos gebruiken. We werken aan een duurzaam model zodat Benji beschikbaar blijft. Je hoeft nu niets te betalen om te starten.
            </p>
          </section>

          <section>
            <h3 className="font-semibold text-gray-900 mb-2">Veelgestelde vragen</h3>
            <p className="font-medium text-gray-900 mb-1">Voor wie is Benji?</p>
            <p className="mb-3">
              Voor iedereen met verlies en verdriet. Of je nu iemand bent verloren, rouwt om een huisdier, of gewoon behoefte hebt aan een luisterend oor, Benji is er voor je.
            </p>
            <p className="font-medium text-gray-900 mb-1">Waarom Benji in plaats van vrienden of een forum?</p>
            <p className="mb-3">
              Benji is altijd beschikbaar, dag en nacht. Geen oordeel, geen wachttijd. Een aanvulling op menselijk contact, niet een vervanging. Soms wil je praten op een moment dat vrienden slapen of het te zwaar voelt om ze opnieuw te belasten.
            </p>
            <p className="font-medium text-gray-900 mb-1">Waarom bestaat Benji?</p>
            <p className="mb-3">
              Benji is er voor mensen die met verlies en verdriet omgaan. Soms wil je praten maar voelt het te zwaar om vrienden of familie te belasten. Benji luistert, altijd.
            </p>
            <p className="font-medium text-gray-900 mb-1">Is Benji veilig?</p>
            <p className="mb-3">
              Ja. Je gesprekken zijn privé. We gebruiken encryptie tijdens transport (HTTPS) en bij opslag op servers in de EU. Benji vervangt geen professionele hulp. Bij crisissituaties wijzen we altijd op 113 (0800-0113).
            </p>
            <p className="font-medium text-gray-900 mb-1">Waarom Benji en niet een andere chatbot?</p>
            <p>
              Benji is specifiek ontwikkeld voor rouw en verlies. De antwoorden zijn afgestemd op dit thema, met empathie en begrip. Geen generieke antwoorden, maar aandacht voor jouw verhaal.
            </p>
          </section>

          <section>
            <h3 className="font-semibold text-gray-900 mb-2">Privacy en veiligheid</h3>
            <p>
              Je gesprekken zijn privé en beveiligd. We gebruiken encryptie tijdens transport en bij opslag volgens AVG-richtlijnen. Benji leert van gesprekken om beter te worden, maar jouw persoonlijke informatie wordt nooit gedeeld of verkocht.
            </p>
          </section>

          <p className="font-medium text-gray-900">Benji is er. Wanneer jij dat nodig hebt.</p>

          <Link
            href="/"
            onClick={onClose}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary-700 text-white rounded-xl hover:bg-primary-600 transition-colors font-medium text-sm"
          >
            Start je eerste gesprek
            <ArrowRight size={16} strokeWidth={2} />
          </Link>

          {/* Lijn onder Start button */}
          <div className="border-t border-primary-200 pt-4" aria-hidden />

          {/* Links naast elkaar eronder */}
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
            <Link href="/faq" onClick={onClose} className="text-primary-600 hover:text-primary-700 underline">
              Veelgestelde vragen
            </Link>
            <Link href="/privacy" onClick={onClose} className="text-primary-600 hover:text-primary-700 underline">
              Privacy
            </Link>
            <Link href="/algemene-voorwaarden" onClick={onClose} className="text-primary-600 hover:text-primary-700 underline">
              Algemene voorwaarden
            </Link>
            <a href="mailto:contactmetien@talktobenji.com" className="text-primary-600 hover:text-primary-700 underline">
              Contact
            </a>
          </div>

        </div>
      </div>
    </div>
  );
}
