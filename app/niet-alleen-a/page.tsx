"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { X } from "lucide-react";
import { HeaderBar } from "@/components/chat/HeaderBar";

const KOOP_LINK = "https://talktobenji.kennis.shop/pay/niet-alleen";

const ERVARINGEN = [
  {
    tekst: "Ik dacht dat ik het wel alleen kon. Maar elke ochtend dat bericht gaf me het gevoel dat iemand aan me dacht. Dat was genoeg.",
    naam: "Sandra",
    context: "verloor haar moeder",
  },
  {
    tekst: "Na de scheiding had ik niemand aan wie ik alles kon vertellen. Hier kon dat wel. Zonder oordeel.",
    naam: "Mariëlle",
    context: "scheiding na 12 jaar",
  },
  {
    tekst: "Iedereen zei dat het maar een hond was. Hier voelde ik me eindelijk begrepen.",
    naam: "Annelies",
    context: "verloor haar hond Boris",
  },
];

const VRAGEN = [
  {
    vraag: "Moet ik elke dag meedoen?",
    antwoord: "Nee. Je schrijft alleen als je er klaar voor bent. Er is geen goed of fout tempo. Als je een dag overslaat kun je altijd terugkomen.",
  },
  {
    vraag: "Is dit therapie?",
    antwoord: '"Niet Alleen" is geen vervanging voor professionele hulp. Het is een persoonlijke plek om te schrijven en te voelen, op jouw manier. Als je merkt dat je meer nodig hebt, moedigen we je aan dat te zoeken.',
  },
  {
    vraag: "Wie leest wat ik schrijf?",
    antwoord: "Niemand. Wat je schrijft is van jou en alleen voor jou zichtbaar.",
  },
  {
    vraag: "Wat als ik na 30 dagen wil stoppen?",
    antwoord: "Dan stop je gewoon. Je kunt alles downloaden. Je account wordt gesloten. Geen automatische verleningen, geen verborgen kosten.",
  },
];

// Geen VraagItem component nodig — vragen staan open

const VOOR_WIE = [
  "je iemand hebt verloren en niet weet hoe je verder moet",
  "je rouwt om een relatie, een huisdier, een miskraam of een gezondheid en het gevoel hebt dat niemand het begrijpt",
  "je een plek wilt om te schrijven en te voelen",
  "je 's nachts wakker ligt met gedachten die nergens heen kunnen",
  "je merkt dat je verdriet wegstopt omdat het leven doorgaat, maar het er wel is",
  "je gewoon iemand nodig hebt die er is, zonder oordeel, op het moment dat jij er klaar voor bent",
];


export default function NietAlleenAPage() {
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
              30 dagen begeleiding bij verlies en gemis
            </p>
            <h1 className="text-3xl sm:text-4xl font-semibold mb-4 leading-snug" style={{ color: "#3d3530", textWrap: "balance" } as any}>
              Je hoeft dit niet alleen te dragen.
            </h1>
            <p className="text-base leading-relaxed mb-3" style={{ color: "#6b6460", textWrap: "balance" } as any}>
              Elke dag een kleine vraag. Een plek om te schrijven. Iemand die er is.
            </p>
            <p className="text-sm leading-relaxed mb-8" style={{ color: "#8a8078", textWrap: "balance" } as any}>
              Voor €37 ontvang je 30 dagen lang elke ochtend een persoonlijk bericht in je inbox.
              Eenmalig, geen abonnement, geen verplichtingen.
            </p>
            <a
              href={KOOP_LINK}
              className="inline-block w-full sm:w-auto sm:px-10 py-3.5 rounded-2xl font-medium text-white text-sm"
              style={{ background: "#6d84a8" }}
            >
              Start mijn reis
            </a>
          </div>
        </section>

        {/* ERKENNING */}
        <section className="px-5 pb-12">
          <div className="max-w-lg mx-auto">
            <div className="rounded-2xl p-6 sm:p-8" style={{ background: "rgba(255,255,255,0.85)", boxShadow: "0 2px 20px rgba(0,0,0,0.07)" }}>
              <h2 className="text-lg font-semibold mb-4" style={{ color: "#3d3530" }}>
                Verdriet heeft niet altijd een naam.
              </h2>
              <div className="space-y-3 text-sm leading-relaxed" style={{ color: "#6b6460" }}>
                <p>
                  Het hoeft geen overlijden te zijn. Verdriet kan er zijn na een scheiding, een miskraam,
                  het verlies van een huisdier, een vriendschap die verdween, een gezondheid die veranderde,
                  een leven dat je dacht te gaan leiden.
                </p>
                <p>Elk verlies is echt. Ook als de wereld om je heen gewoon doorgaat.</p>
                <p>
                  En toch sta je er soms alleen voor. Mensen weten niet wat te zeggen.
                  Je wilt anderen niet belasten. Je weet zelf soms niet eens wat je voelt.
                </p>
                <p>
                  "Niet Alleen" is er voor iedereen die iemand of iets mist en wil dat het gemis een plek krijgt.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* HOE HET WERKT */}
        <section className="px-5 pb-12">
          <div className="max-w-lg mx-auto">
            <div className="rounded-2xl p-6 sm:p-8" style={{ background: "rgba(255,255,255,0.85)", boxShadow: "0 2px 20px rgba(0,0,0,0.07)" }}>
              <h2 className="text-lg font-semibold mb-4" style={{ color: "#3d3530" }}>
                Hoe het werkt.
              </h2>
              <div className="space-y-3 text-sm leading-relaxed" style={{ color: "#6b6460" }}>
                <p>
                  Elke ochtend ontvang je een bericht in je inbox. Niet een nieuwsbrief, niet een cursus.
                  Gewoon een kleine vraag voor die dag, over wie je mist, over wat je draagt, over wie je bent nu.
                </p>
                <p>
                  Je klikt door naar jouw persoonlijke plek. Daar schrijf je, in je eigen tempo.
                  Je kunt ook inspreken, of een foto toevoegen.
                </p>
                <p>
                  Alles wordt bewaard. Na 30 dagen heb je jouw eigen woorden bewaard,
                  opgebouwd in jouw tempo.
                </p>
                <p>
                  Op sommige dagen is er iets extra's. Een korte oefening om even te landen.
                  Een stille verrassing halverwege. Een moment om terug te kijken.
                </p>
                <p>Op dag 30 schrijf je een brief aan jezelf. Van nu, voor later.</p>
              </div>
            </div>
          </div>
        </section>

        {/* PRODUCTAFBEELDING — zwevend, na Hoe het werkt */}
        <section className="px-5 pb-12">
          <div className="max-w-lg mx-auto">
            <Image
              src="/images/niet-alleen-product.png"
              alt="Zo ziet 'Niet Alleen' eruit"
              width={600}
              height={420}
              className="w-full rounded-2xl"
            />
          </div>
        </section>

        {/* VOOR WIE */}
        <section className="px-5 pb-12">
          <div className="max-w-lg mx-auto">
            <div className="rounded-2xl p-6 sm:p-8" style={{ background: "rgba(255,255,255,0.85)", boxShadow: "0 2px 20px rgba(0,0,0,0.07)" }}>
              <h2 className="text-lg font-semibold mb-5" style={{ color: "#3d3530" }}>
                Dit is voor jou als...
              </h2>
              <ul className="space-y-3">
                {VOOR_WIE.map((item, i) => (
                  <li key={i} className="flex gap-3 text-sm leading-relaxed" style={{ color: "#6b6460" }}>
                    <span style={{ color: "#b0a8a0", flexShrink: 0, marginTop: 2 }}>·</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* ERVARINGEN */}
        <section className="px-5 pb-12">
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
                  {e.naam}, {e.context}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* WIE IS IEN */}
        <section className="px-5 pb-12">
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

        {/* VRAGEN — open, geen accordion */}
        <section className="px-5 pb-12">
          <div className="max-w-lg mx-auto">
            <h2 className="text-lg font-semibold mb-5" style={{ color: "#3d3530" }}>
              Misschien vraag je je af...
            </h2>
            <div
              className="rounded-2xl p-6 sm:p-7 space-y-6"
              style={{ background: "rgba(255,255,255,0.85)", boxShadow: "0 2px 20px rgba(0,0,0,0.07)" }}
            >
              {VRAGEN.map((v, i) => (
                <div key={i}>
                  <p className="text-sm font-semibold mb-1" style={{ color: "#3d3530" }}>{v.vraag}</p>
                  <p className="text-sm leading-relaxed" style={{ color: "#6b6460" }}>{v.antwoord}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FINALE CTA */}
        <section className="px-5 pb-20">
          <div className="max-w-md mx-auto text-center">
            <div
              className="rounded-2xl px-6 sm:px-10 py-10"
              style={{ background: "rgba(255,255,255,0.90)", boxShadow: "0 2px 24px rgba(0,0,0,0.09)" }}
            >
              <h2 className="text-2xl font-semibold mb-3 leading-snug" style={{ color: "#3d3530", textWrap: "balance" } as any}>
                Je hoeft het niet alleen te dragen.
              </h2>
              <p className="text-sm leading-relaxed mb-7" style={{ color: "#6b6460", textWrap: "balance" } as any}>
                30 dagen. Elke dag één kleine stap. Een plek die van jou is.
                Voor €37 eenmalig, zonder abonnement of verdere verplichtingen.
              </p>
              <a
                href={KOOP_LINK}
                className="inline-block w-full py-3.5 rounded-2xl font-medium text-white text-sm mb-4"
                style={{ background: "#6d84a8" }}
              >
                Start mijn reis
              </a>
              <p className="text-xs leading-relaxed" style={{ color: "#8a8078" }}>
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

      {/* Ien popup */}
      {showIen && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          style={{ background: "rgba(0,0,0,0.45)" }}
          onClick={() => setShowIen(false)}
        >
          <div
            className="relative w-full sm:max-w-lg max-h-[90vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl"
            style={{ background: "#fdf9f4" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 flex justify-end px-5 pt-4 pb-2" style={{ background: "#fdf9f4" }}>
              <button onClick={() => setShowIen(false)} className="p-1.5 rounded-full" style={{ color: "#8a8078" }}>
                <X size={20} />
              </button>
            </div>
            <div className="px-6 pb-10 space-y-4 text-sm leading-relaxed" style={{ color: "#6b6460" }}>
              <h2 className="text-lg font-semibold" style={{ color: "#3d3530" }}>Waarom ik Talk To Benji ben gestart</h2>
              <p>Verlies is iets wat iedereen meemaakt.</p>
              <p>Iemand die ziek is en midden in zware behandelingen zit. Van uitslag naar uitslag, van controle naar controle. Het leven dat op pauze lijkt te staan, terwijl de zorgen zich opstapelen en de onzekerheid constant aan je trekt.</p>
              <p>Een scheiding die een relatie doet eindigen. Niet alleen het verlies van een partner, maar ook van een gedeelde toekomst, van plannen, van een thuis zoals je het kende.</p>
              <p>De één verliest een dierbare, iemand die er altijd was en er nu opeens niet meer is.</p>
              <p>Verdriet heeft geen vaste vorm. Het past niet altijd in een categorie, en het volgt zeker geen planning.</p>
              <p>Maar er is iets wat ik keer op keer zie, al jaren.<br />Verdriet wordt heel vaak alleen gedragen.</p>
              <p>Niet omdat er niemand is. Maar omdat je niemand wilt belasten. Omdat iedereen het druk heeft. Omdat je je misschien al te veel voelt.</p>
              <p>Ik weet hoe dat voelt. Ik zag het van dichtbij toen mijn schoonzus ziek werd en overleed. Het verdriet van haar man, haar kinderen, haar broers en zussen, iedereen op zijn eigen manier, en iedereen ergens ook alleen.</p>
              <p>Ik woon zelf in Zweden, ver van familie en vrienden in Nederland. Die afstand voegt iets extra's toe aan verdriet. Dat gevoel van ver weg zijn midden in verdriet heeft mede Benji doen ontstaan.</p>
              <p>Vanuit die overtuiging begon ik vier jaar geleden Beterschap-cadeau.nl, een plek voor mensen die iemand willen steunen die iets moeilijks meemaakt.</p>
              <Image src="/images/beterschap-cadeau.png" alt="Beterschap-cadeau.nl" width={600} height={380} className="w-full rounded-xl" />
              <p>Er volgde een troostwoordenboekje, omdat mensen behoefte bleken te hebben aan woorden als die van henzelf niet komen.</p>
              <div className="flex justify-center">
                <Image src="/images/troostende-woorden-cover.png" alt="Troostende woorden" width={200} height={280} className="rounded-xl shadow-sm" />
              </div>
              <p>En langzaamaan groeide de vraag die me al die tijd bezighield: hoe kan ik mensen direct helpen, op het moment dat ze er zelf mee zitten?</p>
              <p>Benji is het antwoord op die vraag.</p>
              <p>Ik hoop dat het voor jou kan zijn wat ik zelf graag had gehad: een plek waar je verhaal ertoe doet, ook als je het (nog) niet hardop durft te zeggen.</p>
              <div className="flex items-center gap-3 pt-2">
                <Image src="/images/ien-founder.png" alt="Ien" width={48} height={48} className="rounded-full flex-shrink-0" />
                <div>
                  <p className="font-medium text-sm" style={{ color: "#3d3530" }}>Ien</p>
                  <p className="text-xs" style={{ color: "#8a8078" }}>Founder, Talk To Benji</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
