"use client";

import Image from "next/image";
import Script from "next/script";

const KOOP_LINK = "#";

const ERVARINGEN = [
  {
    tekst: "Ik dacht dat ik het wel alleen kon. Maar elke ochtend dat bericht — het gaf me het gevoel dat iemand aan me dacht. Dat was genoeg.",
    naam: "[Naam]",
  },
  {
    tekst: "Hier kon ik zeggen wat ik nergens anders kwijt kon. Zonder dat iemand iets terug hoefde te zeggen.",
    naam: "[Naam]",
  },
  {
    tekst: "Iedereen zei dat het maar een hond was. Hier voelde ik me eindelijk begrepen.",
    naam: "[Naam]",
  },
];

const GERUSTSTELLING = [
  "Je hoeft niet elke dag mee te doen. Je schrijft als je er klaar voor bent.",
  "Wat je schrijft is alleen voor jou. Niemand leest het.",
  "Dit is geen therapie. Het is een plek. Als je meer nodig hebt, moedigen we je aan dat te zoeken.",
  "Na 30 dagen kun je alles downloaden of gewoon laten staan. Geen automatische verleningen.",
];

export default function NietAlleenBPage() {
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
            className="relative mx-4 rounded-2xl px-8 py-10 text-center max-w-sm w-full"
            style={{ background: "rgba(255,255,255,0.88)", backdropFilter: "blur(8px)", zIndex: 2 }}
          >
            <p
              className="text-xs uppercase tracking-widest mb-5"
              style={{ color: "#7B5EA7", fontWeight: 600, letterSpacing: "0.12em" }}
            >
              Voor wie iemand of iets mist
            </p>
            <h1
              className="text-4xl font-semibold mb-4 leading-tight"
              style={{ color: "#2D2D2D", fontFamily: "Georgia, serif" }}
            >
              Niet alleen.
            </h1>
            <p className="text-base leading-relaxed mb-8" style={{ color: "#6b6460" }}>
              30 dagen. Elke dag één vraag. Een plek die van jou is.
            </p>
            <a
              href={KOOP_LINK}
              className="inline-block w-full py-3.5 rounded-xl font-medium text-white text-sm mb-2"
              style={{ background: "#7B5EA7" }}
            >
              Ik wil dit — €37
            </a>
            <p className="text-xs" style={{ color: "#888888" }}>
              Eenmalig. Geen abonnement.
            </p>
          </div>
        </section>

        {/* DE KERN */}
        <section className="py-20 px-6">
          <div className="max-w-lg mx-auto space-y-6 text-base leading-relaxed" style={{ color: "#6b6460" }}>
            <p>
              Er is een soort verdriet dat geen naam heeft in de buitenwereld. Geen rouwkaarten, geen bloemen,
              geen moment waarop iedereen even stil staat.
            </p>
            <p style={{ color: "#2D2D2D", fontWeight: 500 }}>Maar het is er wel. En jij draagt het.</p>
            <p>
              Misschien heb je iemand verloren. Misschien een relatie, een huisdier, een gezondheid, een
              toekomst die je voor je zag. Elk verlies is echt. Ook als de mensen om je heen niet weten wat
              te zeggen.
            </p>
            <p>
              Niet Alleen is een plek voor de komende 30 dagen. Elke ochtend een klein bericht — een vraag,
              een gedachte, een moment van stilte. Je schrijft wat je wilt schrijven. Zoveel of zo weinig als
              je kunt.
            </p>
            <p>
              Alles wordt bewaard. Op dag 30 heb je je eigen archief — jouw woorden, jouw verhaal. En als je
              wilt, schrijf je een brief aan jezelf.
            </p>
            <p style={{ color: "#2D2D2D" }}>
              Benji is er. Elke dag. Zonder oordeel. Zonder haast.
            </p>
          </div>
        </section>

        {/* ERVARINGEN */}
        <section className="py-4 pb-16 px-6" style={{ background: "#f5f1ec" }}>
          <div className="max-w-lg mx-auto pt-12 space-y-4">
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
                  — {e.naam}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* GERUSTSTELLING */}
        <section className="py-20 px-6">
          <div className="max-w-lg mx-auto space-y-10">
            {GERUSTSTELLING.map((zin, i) => (
              <p
                key={i}
                className="text-base leading-relaxed"
                style={{ color: i % 2 === 0 ? "#6b6460" : "#2D2D2D" }}
              >
                {zin}
              </p>
            ))}
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
            className="relative mx-auto rounded-2xl px-8 py-10 text-center max-w-sm w-full"
            style={{ background: "rgba(255,255,255,0.88)", backdropFilter: "blur(8px)", zIndex: 2 }}
          >
            <p
              className="text-base leading-relaxed mb-7"
              style={{ color: "#6b6460", fontFamily: "Georgia, serif" }}
            >
              Je hoeft het niet alleen te dragen.
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
          <div className="max-w-lg mx-auto space-y-3">
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
