"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { HeaderBar } from "@/components/chat/HeaderBar";
import { VerhaalPopup } from "@/components/VerhaalPopup";

const KOOP_LINK = "https://talktobenji.kennis.shop/pay/niet-alleen";

const ERVARINGEN = [
  {
    tekst: "Ik dacht dat ik het wel alleen kon. Maar elke ochtend dat bericht gaf me het gevoel dat iemand aan me dacht. Dat was genoeg.",
    naam: "Sandra",
  },
  {
    tekst: "Hier kon ik zeggen wat ik nergens anders kwijt kon. Zonder dat iemand iets terug hoefde te zeggen.",
    naam: "Mariëlle",
  },
  {
    tekst: "Iedereen zei dat het maar een hond was. Hier voelde ik me eindelijk begrepen.",
    naam: "Annelies",
  },
];

const GERUSTSTELLING = [
  "Je hoeft niet elke dag mee te doen. Je schrijft als je er klaar voor bent.",
  "Wat je schrijft is alleen voor jou. Niemand leest het.",
  "Dit is geen therapie. Het is een plek. Als je meer nodig hebt, moedigen we je aan dat te zoeken.",
  "Na 30 dagen kun je alles downloaden of gewoon laten staan. Geen automatische verleningen.",
];

export default function NietAlleenBPage() {
  const [showIen, setShowIen] = useState(false);

  return (
    <div style={{ minHeight: "100vh", background: "#fdf9f4", position: "relative" }}>

      {/* Vaste achtergrond doorlopend zichtbaar */}
      <div style={{ position: "fixed", inset: 0, zIndex: 0 }}>
        <Image
          src="/images/achtergrond.png"
          alt=""
          fill
          className="object-cover"
          priority
        />
        <div style={{ position: "absolute", inset: 0, background: "rgba(253,249,244,0.82)" }} />
      </div>

      {/* Alle content boven de achtergrond */}
      <div style={{ position: "relative", zIndex: 1 }}>

        <HeaderBar />

        {/* HERO */}
        <section className="flex items-center justify-center px-5 pt-12 pb-16">
          <div className="w-full max-w-md text-center">
            <p className="text-xs uppercase tracking-widest mb-5 font-medium" style={{ color: "#8a8078", letterSpacing: "0.14em" }}>
              Voor wie iemand of iets mist
            </p>
            <h1 className="text-4xl sm:text-5xl font-semibold mb-4" style={{ color: "#3d3530", textWrap: "balance" } as any}>
              Niet alleen.
            </h1>
            <p className="text-base leading-relaxed mb-3" style={{ color: "#6b6460", textWrap: "balance" } as any}>
              30 dagen. Elke dag één vraag. Een plek die van jou is.
            </p>
            <p className="text-sm leading-relaxed mb-8" style={{ color: "#8a8078", textWrap: "balance" } as any}>
              Voor €37 ontvang je 30 dagen lang elke ochtend een persoonlijk bericht.
              Eenmalig, geen abonnement.
            </p>
            <a
              href={KOOP_LINK}
              className="inline-block w-full py-3.5 rounded-2xl font-medium text-white text-sm"
              style={{ background: "#6d84a8" }}
            >
              Start mijn reis
            </a>
          </div>
        </section>

        {/* DE KERN */}
        <section className="px-5 pb-16">
          <div className="max-w-lg mx-auto space-y-5 text-base leading-relaxed" style={{ color: "#6b6460" }}>
            <p>
              Er is een soort verdriet dat geen naam heeft in de buitenwereld.
              Geen rouwkaarten, geen bloemen, geen moment waarop iedereen even stil staat.
            </p>
            <p style={{ color: "#3d3530", fontWeight: 500 }}>
              Maar het is er wel. En jij draagt het.
            </p>
            <p>
              Misschien heb je iemand verloren. Misschien een relatie, een huisdier,
              een gezondheid, een toekomst die je voor je zag. Elk verlies is echt.
              Ook als de mensen om je heen niet weten wat te zeggen.
            </p>
            <p>
              "Niet Alleen" is een plek voor de komende 30 dagen. Elke ochtend een klein bericht,
              een vraag, een gedachte, een moment van stilte.
              Je schrijft wat je wilt schrijven. Zoveel of zo weinig als je kunt.
            </p>
            <p>
              Alles wordt bewaard. Op dag 30 heb je jouw eigen verhaal, in jouw woorden, op jouw tempo.
              En als je wilt, schrijf je een brief aan jezelf.
            </p>
            <div className="py-2">
              <Image
                src="/images/niet-alleen-product.png"
                alt="Zo ziet 'Niet Alleen' eruit"
                width={600}
                height={420}
                className="w-full rounded-2xl"
              />
            </div>
            <p style={{ color: "#3d3530" }}>
              Benji is er. Elke dag. Zonder oordeel. Zonder haast.
            </p>
          </div>
        </section>

        {/* ERVARINGEN */}
        <section className="px-5 pb-16">
          <div className="max-w-lg mx-auto space-y-4">
            {ERVARINGEN.map((e, i) => (
              <div
                key={i}
                className="rounded-2xl p-6"
                style={{ background: "rgba(255,255,255,0.85)", boxShadow: "0 2px 16px rgba(0,0,0,0.06)" }}
              >
                <p className="text-sm leading-relaxed mb-3" style={{ color: "#3d3530" }}>
                  "{e.tekst}"
                </p>
                <p className="text-xs" style={{ color: "#8a8078" }}>
                  {e.naam}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* GERUSTSTELLING */}
        <section className="px-5 pb-16">
          <div className="max-w-lg mx-auto space-y-8">
            {GERUSTSTELLING.map((zin, i) => (
              <p key={i} className="text-base leading-relaxed" style={{ color: "#6b6460" }}>
                {zin}
              </p>
            ))}
          </div>
        </section>

        {/* WIE IS IEN */}
        <section className="px-5 pb-16">
          <div className="max-w-lg mx-auto">
            <div className="rounded-2xl p-6 sm:p-8" style={{ background: "rgba(255,255,255,0.85)", boxShadow: "0 2px 20px rgba(0,0,0,0.07)" }}>
              <h2 className="text-lg font-semibold mb-3" style={{ color: "#3d3530" }}>
                Wie is Ien?
              </h2>
              <p className="text-sm leading-relaxed mb-4" style={{ color: "#6b6460" }}>
                Ien is de oprichter van TalkToBenji, het platform waar "Niet Alleen" onderdeel van is.
                Ze weet hoe zwaar het is als verdriet geen plek krijgt.
                "Niet Alleen" is wat ze zelf had willen hebben.
              </p>
              <button
                onClick={() => setShowIen(true)}
                className="text-sm font-medium text-left"
                style={{ color: "#6d84a8" }}
              >
                Lees haar verhaal: Waarom Benji →
              </button>
            </div>
          </div>
        </section>

        {/* FINALE CTA */}
        <section className="px-5 pb-20">
          <div className="max-w-sm mx-auto text-center">
            <div
              className="rounded-2xl px-6 sm:px-8 py-10"
              style={{ background: "rgba(255,255,255,0.90)", boxShadow: "0 2px 24px rgba(0,0,0,0.09)" }}
            >
              <p className="text-base leading-relaxed mb-7" style={{ color: "#6b6460", textWrap: "balance" } as any}>
                Je hoeft het niet alleen te dragen.
              </p>
              <a
                href={KOOP_LINK}
                className="inline-block w-full py-3.5 rounded-2xl font-medium text-white text-sm mb-4"
                style={{ background: "#6d84a8" }}
              >
                Start mijn reis
              </a>
              <p className="text-xs leading-relaxed" style={{ color: "#8a8078" }}>
                Voor €37 eenmalig. Geen abonnement, geen verplichtingen.
                Na aankoop ontvang je direct een bericht van Ien.
                Je eerste dag begint de volgende ochtend.
              </p>
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="px-5 py-10 text-center" style={{ borderTop: "1px solid rgba(0,0,0,0.08)" }}>
          <div className="max-w-lg mx-auto space-y-3">
            <p className="text-xs" style={{ color: "#6b6460" }}>
              Vragen?{" "}
              <a href="mailto:contactmetien@talktobenji.com" style={{ color: "#6d84a8" }}>
                contactmetien@talktobenji.com
              </a>
            </p>
            <p className="text-xs leading-relaxed" style={{ color: "#8a8078" }}>
              "Niet Alleen" is onderdeel van Talk To Benji. Als je na 30 dagen verder wilt,
              kun je een abonnement afsluiten. Alles wat je hebt opgebouwd blijft dan bewaard.
            </p>
            <p className="text-xs" style={{ color: "#8a8078" }}>
              Gesprekken zijn privé en beveiligd. Benji is geen vervanging van professionele hulp.
            </p>
            <p className="text-xs" style={{ color: "#a09890" }}>
              © Talk To Benji — talktobenji.com
            </p>
          </div>
        </footer>

      </div>

      {showIen && <VerhaalPopup onClose={() => setShowIen(false)} />}
    </div>
  );
}
