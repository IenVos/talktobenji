"use client";

import { useState } from "react";
import Image from "next/image";
import Script from "next/script";
import { ChevronDown } from "lucide-react";

const KOOP_LINK = "#";

const ERVARINGEN = [
  {
    tekst: "Ik dacht dat ik het wel alleen kon. Maar elke ochtend dat bericht — het gaf me het gevoel dat iemand aan me dacht. Dat was genoeg.",
    naam: "[Naam]",
    context: "verloor haar moeder",
  },
  {
    tekst: "Na de scheiding had ik niemand aan wie ik alles kon vertellen. Hier kon dat wel. Zonder oordeel.",
    naam: "[Naam]",
    context: "scheiding na 12 jaar",
  },
  {
    tekst: "Iedereen zei dat het maar een hond was. Hier voelde ik me eindelijk begrepen.",
    naam: "[Naam]",
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
    antwoord: "Nee. Niet Alleen is geen vervanging voor professionele hulp. Het is een persoonlijke plek om te schrijven en te voelen, op jouw manier. Als je merkt dat je meer nodig hebt, moedigen we je aan dat te zoeken.",
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

const VOOR_WIE = [
  "je iemand hebt verloren en niet weet hoe je verder moet",
  "je rouwt om een relatie, een huisdier, een miskraam, een gezondheid — en het gevoel hebt dat niemand het begrijpt",
  "je niet in therapie wilt maar wel een plek wilt om te schrijven en te voelen",
  "je 's nachts wakker ligt met gedachten die nergens heen kunnen",
  "je merkt dat je verdriet wegstopt omdat het leven doorgaat — maar het er wel is",
  "je gewoon iemand nodig hebt die er is, zonder oordeel, op het moment dat jij er klaar voor bent",
];

function VraagItem({ vraag, antwoord }: { vraag: string; antwoord: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className="border-b last:border-0 cursor-pointer"
      style={{ borderColor: "#e8e0d8" }}
      onClick={() => setOpen((v) => !v)}
    >
      <div className="flex items-center justify-between py-4 gap-4">
        <p className="text-sm font-medium" style={{ color: "#2D2D2D" }}>
          {vraag}
        </p>
        <ChevronDown
          size={16}
          style={{
            color: "#7B5EA7",
            flexShrink: 0,
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.2s",
          }}
        />
      </div>
      {open && (
        <p className="text-sm leading-relaxed pb-4" style={{ color: "#6b6460" }}>
          {antwoord}
        </p>
      )}
    </div>
  );
}

export default function NietAlleenAPage() {
  return (
    <>
      {/* Meta Pixel */}
      <Script id="meta-pixel" strategy="afterInteractive">{`
        !function(f,b,e,v,n,t,s)
        {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
        n.callMethod.apply(n,arguments):n.queue.push(arguments)};
        if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
        n.queue=[];t=b.createElement(e);t.async=!0;
        t.src=v;s=b.getElementsByTagName(e)[0];
        s.parentNode.insertBefore(t,s)}(window, document,'script',
        'https://connect.facebook.net/en_US/fbevents.js');
        fbq('init', '2054062258501361');
        fbq('track', 'PageView');
      `}</Script>

      <div style={{ background: "#fdf9f4", minHeight: "100vh", fontFamily: "inherit" }}>

        {/* HERO */}
        <section
          className="relative flex flex-col items-center justify-center"
          style={{ minHeight: "100svh" }}
        >
          <Image
            src="/images/achtergrond.png"
            alt=""
            fill
            className="object-cover"
            priority
            style={{ zIndex: 0 }}
          />
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.18)", zIndex: 1 }} />

          {/* Logo */}
          <div className="absolute top-5 left-5" style={{ zIndex: 2 }}>
            <a href="https://talktobenji.com">
              <Image src="/images/benji-logo-2.png" alt="Talk To Benji" width={34} height={34} />
            </a>
          </div>

          {/* Card */}
          <div
            className="relative mx-4 rounded-2xl px-8 py-10 text-center max-w-md w-full"
            style={{ background: "rgba(255,255,255,0.88)", backdropFilter: "blur(8px)", zIndex: 2 }}
          >
            <p
              className="text-xs uppercase tracking-widest mb-4"
              style={{ color: "#7B5EA7", fontWeight: 600, letterSpacing: "0.12em" }}
            >
              30 dagen begeleiding bij verlies en gemis
            </p>
            <h1
              className="text-3xl font-semibold mb-3 leading-tight"
              style={{ color: "#2D2D2D", fontFamily: "Georgia, serif" }}
            >
              Je hoeft dit niet alleen te dragen.
            </h1>
            <p className="text-base leading-relaxed mb-7" style={{ color: "#6b6460" }}>
              Elke dag een kleine vraag. Een plek om te schrijven. Iemand die er is.
            </p>
            <a
              href={KOOP_LINK}
              className="inline-block w-full py-3.5 rounded-xl font-medium text-white text-sm mb-2"
              style={{ background: "#7B5EA7" }}
            >
              Ik wil dit — €37
            </a>
            <p className="text-xs" style={{ color: "#888888" }}>
              30 dagen begeleiding. Eenmalig. Geen verplichtingen.
            </p>
          </div>
        </section>

        {/* ERKENNING */}
        <section className="py-16 px-6">
          <div className="max-w-xl mx-auto">
            <div
              className="rounded-2xl p-8"
              style={{ background: "white", boxShadow: "0 2px 16px rgba(0,0,0,0.06)" }}
            >
              <h2
                className="text-xl font-semibold mb-5"
                style={{ color: "#2D2D2D", fontFamily: "Georgia, serif" }}
              >
                Verdriet heeft niet altijd een naam.
              </h2>
              <div className="space-y-4 text-sm leading-relaxed" style={{ color: "#6b6460" }}>
                <p>
                  Het hoeft geen overlijden te zijn. Verdriet kan er zijn na een scheiding, een miskraam,
                  het verlies van een huisdier, een vriendschap die verdween, een gezondheid die veranderde,
                  een leven dat je dacht te gaan leiden.
                </p>
                <p>Elk verlies is echt. Ook als de wereld om je heen gewoon doorgaat.</p>
                <p>
                  En toch sta je er soms alleen voor. Mensen weten niet wat te zeggen. Je wilt anderen niet
                  belasten. Je weet zelf soms niet eens wat je voelt.
                </p>
                <p>
                  Niet Alleen is er voor iedereen die iemand of iets mist — en wil dat het gemis een plek
                  krijgt.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* HOE HET WERKT */}
        <section className="py-10 px-6" style={{ background: "#f5f1ec" }}>
          <div className="max-w-xl mx-auto">
            <h2
              className="text-xl font-semibold mb-6"
              style={{ color: "#2D2D2D", fontFamily: "Georgia, serif" }}
            >
              Hoe het werkt.
            </h2>
            <div className="space-y-4 text-sm leading-relaxed" style={{ color: "#6b6460" }}>
              <p>
                Elke ochtend ontvang je een bericht. Niet een nieuwsbrief, niet een cursus. Gewoon een kleine
                vraag voor die dag — over wie je mist, over wat je draagt, over wie je bent nu.
              </p>
              <p>
                Je klikt door naar jouw persoonlijke plek. Daar schrijf je, in je eigen tempo. Je kunt ook
                inspreken, of een foto toevoegen.
              </p>
              <p>
                Alles wordt bewaard. Na 30 dagen heb je een archief van jouw eigen woorden — jouw verhaal,
                opgebouwd in jouw tempo.
              </p>
              <p>
                Op sommige dagen is er iets extra's. Een korte oefening om even te landen. Een stille
                verrassing halverwege. Een moment om terug te kijken.
              </p>
              <p>Op dag 30 schrijf je een brief aan jezelf. Van nu, voor later.</p>
            </div>
          </div>
        </section>

        {/* VOOR WIE */}
        <section className="py-14 px-6">
          <div className="max-w-xl mx-auto">
            <div
              className="rounded-2xl p-8"
              style={{ background: "white", boxShadow: "0 2px 16px rgba(0,0,0,0.06)" }}
            >
              <h2
                className="text-xl font-semibold mb-6"
                style={{ color: "#2D2D2D", fontFamily: "Georgia, serif" }}
              >
                Dit is voor jou als...
              </h2>
              <ul className="space-y-3">
                {VOOR_WIE.map((item, i) => (
                  <li key={i} className="flex gap-3 text-sm leading-relaxed" style={{ color: "#6b6460" }}>
                    <span style={{ color: "#C8A4D4", flexShrink: 0, marginTop: 2 }}>·</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* ERVARINGEN */}
        <section className="py-10 px-6" style={{ background: "#f5f1ec" }}>
          <div className="max-w-xl mx-auto space-y-4">
            {ERVARINGEN.map((e, i) => (
              <div
                key={i}
                className="rounded-2xl p-6"
                style={{ background: "white", boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}
              >
                <p className="text-sm leading-relaxed mb-3" style={{ color: "#2D2D2D" }}>
                  "{e.tekst}"
                </p>
                <p className="text-xs" style={{ color: "#888888" }}>
                  — {e.naam}, {e.context}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* VRAGEN */}
        <section className="py-14 px-6">
          <div className="max-w-xl mx-auto">
            <h2
              className="text-xl font-semibold mb-6"
              style={{ color: "#2D2D2D", fontFamily: "Georgia, serif" }}
            >
              Misschien vraag je je af...
            </h2>
            <div
              className="rounded-2xl p-6"
              style={{ background: "white", boxShadow: "0 2px 16px rgba(0,0,0,0.06)" }}
            >
              {VRAGEN.map((v, i) => (
                <VraagItem key={i} vraag={v.vraag} antwoord={v.antwoord} />
              ))}
            </div>
          </div>
        </section>

        {/* FINALE CTA */}
        <section
          className="relative flex flex-col items-center justify-center py-24 px-6"
          style={{ minHeight: "60svh" }}
        >
          <Image
            src="/images/achtergrond.png"
            alt=""
            fill
            className="object-cover"
            style={{ zIndex: 0 }}
          />
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.18)", zIndex: 1 }} />
          <div
            className="relative mx-auto rounded-2xl px-8 py-10 text-center max-w-md w-full"
            style={{ background: "rgba(255,255,255,0.88)", backdropFilter: "blur(8px)", zIndex: 2 }}
          >
            <h2
              className="text-2xl font-semibold mb-3 leading-tight"
              style={{ color: "#2D2D2D", fontFamily: "Georgia, serif" }}
            >
              Je hoeft het niet alleen te dragen.
            </h2>
            <p className="text-sm leading-relaxed mb-7" style={{ color: "#6b6460" }}>
              30 dagen. Elke dag één kleine stap. Een plek die van jou is.
            </p>
            <a
              href={KOOP_LINK}
              className="inline-block w-full py-3.5 rounded-xl font-medium text-white text-sm mb-2"
              style={{ background: "#7B5EA7" }}
            >
              Ik wil dit — €37
            </a>
            <p className="text-xs mb-6" style={{ color: "#888888" }}>
              Eenmalig. Geen abonnement. Geen verplichtingen.
            </p>
            <p className="text-xs leading-relaxed" style={{ color: "#888888" }}>
              Na aankoop ontvang je direct een bericht van Ien. Je eerste dag begint de volgende ochtend.
            </p>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="py-10 px-6 text-center" style={{ borderTop: "1px solid #e8e0d8" }}>
          <div className="max-w-xl mx-auto space-y-3">
            <p className="text-xs" style={{ color: "#888888" }}>
              Vragen?{" "}
              <a href="mailto:contactmetien@talktobenji.com" style={{ color: "#7B5EA7" }}>
                contactmetien@talktobenji.com
              </a>
            </p>
            <p className="text-xs leading-relaxed" style={{ color: "#888888" }}>
              Niet Alleen is onderdeel van Talk To Benji. Als je na 30 dagen verder wilt, kun je een
              abonnement afsluiten. Alles wat je hebt opgebouwd blijft dan bewaard.
            </p>
            <p className="text-xs" style={{ color: "#aaa" }}>
              Gesprekken zijn privé en beveiligd. Benji is geen vervanging van professionele hulp.
            </p>
            <p className="text-xs" style={{ color: "#ccc" }}>
              © Talk To Benji — talktobenji.com
            </p>
          </div>
        </footer>
      </div>
    </>
  );
}
