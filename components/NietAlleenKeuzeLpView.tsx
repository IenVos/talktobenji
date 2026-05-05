"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";

type TypeKey = "persoon" | "huisdier" | "relatie" | "kinderloos";

interface Props {
  typeCtaUrlPersoon?: string;
  typeCtaUrlHuisdier?: string;
  typeCtaUrlRelatie?: string;
  typeCtaUrlKinderloos?: string;
  typeButtonLabelPersoon?: string;
  typeButtonLabelHuisdier?: string;
  typeButtonLabelRelatie?: string;
  typeButtonLabelKinderloos?: string;
  defaultCtaUrl?: string;
}

const TYPES: { key: TypeKey; emoji: string; defaultLabel: string }[] = [
  { key: "persoon",    emoji: "💔", defaultLabel: "Ik mis iemand" },
  { key: "huisdier",  emoji: "🐾", defaultLabel: "Ik heb mijn dier verloren" },
  { key: "relatie",   emoji: "💭", defaultLabel: "Relatie voorbij? Laat los en vind rust." },
  { key: "kinderloos",emoji: "🌱", defaultLabel: "Ongewenst kinderloos vind steun en ruimte" },
];

function CtaButton({ url, fallback, label }: { url?: string; fallback?: string; label: string }) {
  const href = url || fallback;
  const base = "inline-block w-full sm:w-auto px-7 py-3.5 rounded-xl font-semibold text-sm text-white text-center transition-opacity";
  if (!href) return <span className={`${base} opacity-40 cursor-default`} style={{ background: "#6d84a8" }}>{label}</span>;
  return <Link href={href} className={`${base} hover:opacity-90`} style={{ background: "#6d84a8" }}>{label}</Link>;
}

function Voordelen({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2 my-5">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2 text-sm" style={{ color: "#6b6460" }}>
          <span className="mt-0.5 flex-shrink-0" style={{ color: "#6d84a8" }}>✦</span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export function NietAlleenKeuzeLpView({
  typeCtaUrlPersoon, typeCtaUrlHuisdier, typeCtaUrlRelatie, typeCtaUrlKinderloos,
  typeButtonLabelPersoon, typeButtonLabelHuisdier, typeButtonLabelRelatie, typeButtonLabelKinderloos,
  defaultCtaUrl,
}: Props) {
  const [actief, setActief] = useState<TypeKey | null>(null);
  const persoonRef  = useRef<HTMLDivElement>(null);
  const huisdierRef = useRef<HTMLDivElement>(null);
  const relatieRef  = useRef<HTMLDivElement>(null);
  const kinderloosRef = useRef<HTMLDivElement>(null);

  const refs: Record<TypeKey, React.RefObject<HTMLDivElement>> = {
    persoon: persoonRef, huisdier: huisdierRef, relatie: relatieRef, kinderloos: kinderloosRef,
  };
  const ctaUrls: Record<TypeKey, string | undefined> = {
    persoon: typeCtaUrlPersoon, huisdier: typeCtaUrlHuisdier, relatie: typeCtaUrlRelatie, kinderloos: typeCtaUrlKinderloos,
  };
  const buttonLabels: Record<TypeKey, string> = {
    persoon:    typeButtonLabelPersoon    || "Ik mis iemand",
    huisdier:   typeButtonLabelHuisdier   || "Ik heb mijn dier verloren",
    relatie:    typeButtonLabelRelatie    || "Mijn relatie is voorbij",
    kinderloos: typeButtonLabelKinderloos || "Ongewenst kinderloos",
  };

  function kiesType(key: TypeKey) {
    const url = ctaUrls[key];
    if (url) { window.location.href = url; return; }
    setActief(key);
    refs[key].current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const TypeKnoppen = ({ klein }: { klein?: boolean }) => (
    <div className="space-y-3">
      {TYPES.map(({ key, emoji }) => (
        <button key={key} onClick={() => kiesType(key)}
          className={`w-full flex items-center gap-${klein ? "3" : "4"} px-5 py-${klein ? "3.5" : "4"} rounded-2xl border${klein ? "" : "-2"} text-left transition-all`}
          style={{ borderColor: actief === key ? "#6d84a8" : "#e8e0d8", background: actief === key ? "#eef1f6" : "white", color: "#3d3530" }}
        >
          <span className={`text-${klein ? "xl" : "2xl"} flex-shrink-0`}>{emoji}</span>
          <span className="text-sm font-medium">{buttonLabels[key]}</span>
          {!klein && actief === key && <span className="ml-auto text-xs font-semibold flex-shrink-0" style={{ color: "#6d84a8" }}>↓</span>}
        </button>
      ))}
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#fdf9f4", position: "relative" }}>
      <div style={{ position: "fixed", inset: 0, zIndex: 0 }}>
        <Image src="/images/achtergrond.png" alt="" fill className="object-cover" priority />
        <div style={{ position: "absolute", inset: 0, background: "rgba(253,249,244,0.88)" }} />
      </div>

      <div style={{ position: "relative", zIndex: 1 }}>
        <header className="flex justify-center pt-8 pb-2 px-5">
          <Link href="/">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/niet-alleen-logo.png" alt="Niet Alleen" width={88} height={88} />
          </Link>
        </header>

        {/* HERO */}
        <section className="max-w-lg mx-auto px-6 pt-10 pb-12 text-center space-y-4">
          <h1 className="text-3xl sm:text-4xl font-semibold leading-snug" style={{ color: "#3d3530" }}>
            Overdag hou je het vol.<br />
            <span style={{ color: "#6b6460", fontWeight: 400 }}>Maar &apos;s nachts… voelt het zwaarder.</span>
          </h1>
          <div className="space-y-3 text-base leading-relaxed max-w-md mx-auto" style={{ color: "#6b6460" }}>
            <p>Je gaat door. Voor de buitenwereld.<br />Maar er is zoveel dat je nergens kwijt kunt.</p>
            <p>Niet omdat er niemand is.<br />Maar omdat je niemand wilt belasten.<br />Of simpelweg niet weet waar je moet beginnen.</p>
          </div>
          <p className="text-base font-medium pt-2" style={{ color: "#3d3530" }}>Je hoeft het niet langer alleen te dragen.</p>
        </section>

        {/* KEUZEMOMENT */}
        <section className="max-w-md mx-auto px-6 pb-14 space-y-5">
          <div className="text-center space-y-1">
            <p className="text-sm font-medium" style={{ color: "#8a8078" }}>Je hoeft het hier niet uit te leggen.</p>
            <p className="text-base font-semibold" style={{ color: "#3d3530" }}>Kies gewoon wat het dichtst bij je ligt:</p>
          </div>
          <TypeKnoppen />
        </section>

        <div style={{ borderTop: "1px solid #e8e0d8" }} className="max-w-2xl mx-auto" />

        {/* SECTIE: PERSOON */}
        <section ref={persoonRef} id="persoon" className="max-w-lg mx-auto px-6 py-16 space-y-5 scroll-mt-8">
          <p className="text-xs uppercase tracking-widest font-medium" style={{ color: "#b0a8a0" }}>💔 Verlies van een persoon</p>
          <h2 className="text-2xl sm:text-3xl font-semibold leading-snug" style={{ color: "#3d3530" }}>
            Je mist iemand.<br /><span style={{ fontWeight: 400, color: "#6b6460" }}>En niemand kan dat echt opvangen.</span>
          </h2>
          <p style={{ color: "#6b6460" }} className="leading-relaxed">Mensen vragen hoe het gaat.<br />En je zegt: &ldquo;gaat wel.&rdquo;</p>
          <p style={{ color: "#6b6460" }} className="leading-relaxed">Maar wat moet je anders zeggen?<br /><br />Dat je soms nog steeds automatisch aan ze denkt?<br />Dat je midden op de dag ineens stilvalt?<br />Dat het &apos;s nachts het hardst binnenkomt?</p>
          <p style={{ color: "#6b6460" }} className="leading-relaxed">Je wil het delen.<br />Maar niet elke keer het hele verhaal vertellen.<br />Niet weer die stilte aan de andere kant.</p>
          <p className="text-base font-medium" style={{ color: "#3d3530" }}>Dus je houdt het maar bij jezelf.</p>
          <div className="border-l-2 pl-5 py-1 space-y-3" style={{ borderColor: "#6d84a8" }}>
            <p className="text-sm font-semibold" style={{ color: "#6d84a8" }}>Dit is waar Niet Alleen begint</p>
            <p style={{ color: "#6b6460" }} className="text-sm leading-relaxed">30 dagen lang ontvang je elke dag een e-mail.<br />Met daarin een bericht van Benji.<br /><br />Geen oplossingen. Geen &ldquo;je moet gewoon…&rdquo;<br /><br />Maar woorden die begrijpen hoe het voelt.<br />En een plek waar jij even alles kwijt kunt.<br /><br />Wanneer jij daar klaar voor bent.</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "#b0a8a0" }}>Wat het je geeft</p>
            <Voordelen items={["Iemand die elke dag even naast je zit", "Ruimte om te voelen zonder oordeel", "Je gedachten ordenen zonder druk", "Van alles alleen dragen → naar even delen"]} />
          </div>
          <p className="text-sm italic" style={{ color: "#8a8078" }}>Niet opgelost. Maar wél iets lichter.</p>
          <CtaButton url={typeCtaUrlPersoon} fallback={defaultCtaUrl} label="Start met Niet Alleen – Verlies Persoon (€37)" />
        </section>

        <div style={{ borderTop: "1px solid #e8e0d8" }} className="max-w-2xl mx-auto" />

        {/* SECTIE: HUISDIER */}
        <section ref={huisdierRef} id="huisdier" className="max-w-lg mx-auto px-6 py-16 space-y-5 scroll-mt-8">
          <p className="text-xs uppercase tracking-widest font-medium" style={{ color: "#b0a8a0" }}>🐾 Verlies van een dier</p>
          <h2 className="text-2xl sm:text-3xl font-semibold leading-snug" style={{ color: "#3d3530" }}>
            Ze zeggen: &ldquo;het was maar een dier.&rdquo;<br /><span style={{ fontWeight: 400, color: "#6b6460" }}>Maar voor jou was het zoveel meer.</span>
          </h2>
          <p style={{ color: "#6b6460" }} className="leading-relaxed">Een maatje.<br />Routine.<br />Stilte die nu anders voelt.</p>
          <p style={{ color: "#6b6460" }} className="leading-relaxed">Je mist de kleine dingen.<br />De vanzelfsprekendheid.<br />De aanwezigheid.</p>
          <p style={{ color: "#6b6460" }} className="leading-relaxed">En misschien voelt het alsof je dit niet &ldquo;groot genoeg&rdquo; mag maken.<br /><br />Dus je zegt er minder over.<br />Dan je eigenlijk zou willen.</p>
          <p className="text-base font-medium" style={{ color: "#3d3530" }}>Maar jouw verdriet is echt.</p>
          <div className="border-l-2 pl-5 py-1 space-y-3" style={{ borderColor: "#6d84a8" }}>
            <p className="text-sm font-semibold" style={{ color: "#6d84a8" }}>Dit is waar Niet Alleen begint</p>
            <p style={{ color: "#6b6460" }} className="text-sm leading-relaxed">Elke dag een moment voor jou.<br />Waar je niets hoeft uit te leggen.<br /><br />Waar je vandaag meer mag zijn dan gisteren.</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "#b0a8a0" }}>Wat het je geeft</p>
            <Voordelen items={["Erkenning zonder dat je het hoeft te verdedigen", "Dagelijks een moment van zachtheid", "Ruimte voor herinneringen én gemis", "Van stil verdriet → naar gedeeld gevoel"]} />
          </div>
          <CtaButton url={typeCtaUrlHuisdier} fallback={defaultCtaUrl} label="Start met Niet Alleen – Verlies Huisdier (€37)" />
        </section>

        <div style={{ borderTop: "1px solid #e8e0d8" }} className="max-w-2xl mx-auto" />

        {/* SECTIE: RELATIE */}
        <section ref={relatieRef} id="relatie" className="max-w-lg mx-auto px-6 py-16 space-y-5 scroll-mt-8">
          <p className="text-xs uppercase tracking-widest font-medium" style={{ color: "#b0a8a0" }}>💭 Einde van een relatie</p>
          <h2 className="text-2xl sm:text-3xl font-semibold leading-snug" style={{ color: "#3d3530" }}>
            Je relatie is voorbij.<br /><span style={{ fontWeight: 400, color: "#6b6460" }}>Maar je hoofd is dat nog niet.</span>
          </h2>
          <p style={{ color: "#6b6460" }} className="leading-relaxed">Je denkt terug.<br />Analyseert.<br />Twijfelt.</p>
          <p style={{ color: "#6b6460" }} className="leading-relaxed">Was het de juiste keuze?<br />Had je iets anders kunnen doen?<br />Waarom voelt het nog zo aanwezig?</p>
          <p style={{ color: "#6b6460" }} className="leading-relaxed">Overdag red je je wel.<br />Maar &apos;s avonds… begint het weer.</p>
          <p className="text-base font-medium" style={{ color: "#3d3530" }}>En je wil er niet steeds over praten met anderen.</p>
          <div className="border-l-2 pl-5 py-1 space-y-3" style={{ borderColor: "#6d84a8" }}>
            <p className="text-sm font-semibold" style={{ color: "#6d84a8" }}>Dit is waar Niet Alleen begint</p>
            <p style={{ color: "#6b6460" }} className="text-sm leading-relaxed">Een plek waar je gedachten mogen bestaan.<br />Zonder dat iemand meteen een mening heeft.<br /><br />Waar je niet &ldquo;sterk&rdquo; hoeft te zijn.<br />Maar gewoon even eerlijk.</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "#b0a8a0" }}>Wat het je geeft</p>
            <Voordelen items={["Rust in je hoofd", "Ruimte om te verwerken in jouw tempo", "Iemand die luistert zonder oordeel", "Van blijven malen → naar zacht loslaten"]} />
          </div>
          <CtaButton url={typeCtaUrlRelatie} fallback={defaultCtaUrl} label="Start met Niet Alleen – Relatie (€37)" />
        </section>

        <div style={{ borderTop: "1px solid #e8e0d8" }} className="max-w-2xl mx-auto" />

        {/* SECTIE: KINDERLOOS */}
        <section ref={kinderloosRef} id="kinderloos" className="max-w-lg mx-auto px-6 py-16 space-y-5 scroll-mt-8">
          <p className="text-xs uppercase tracking-widest font-medium" style={{ color: "#b0a8a0" }}>🌱 Ongewenst kinderloos</p>
          <h2 className="text-2xl sm:text-3xl font-semibold leading-snug" style={{ color: "#3d3530" }}>
            Ongewenst kinderloos.<br /><span style={{ fontWeight: 400, color: "#6b6460" }}>Iets wat mensen niet kunnen zien.</span>
          </h2>
          <p style={{ color: "#6b6460" }} className="leading-relaxed">En waarvoor niemand de juiste woorden heeft.</p>
          <p style={{ color: "#6b6460" }} className="leading-relaxed">Want het is niet zichtbaar.<br />Niet tastbaar.<br />Maar het is er. Altijd.</p>
          <p style={{ color: "#6b6460" }} className="leading-relaxed">In momenten.<br />In gesprekken.<br />In wat er niet is.<br /><br />En misschien voel je je alleen in hoe groot het is.</p>
          <p className="text-base font-medium" style={{ color: "#3d3530" }}>Alsof je het niet helemaal mag voelen.</p>
          <div className="border-l-2 pl-5 py-1 space-y-3" style={{ borderColor: "#6d84a8" }}>
            <p className="text-sm font-semibold" style={{ color: "#6d84a8" }}>Dit is waar Niet Alleen begint</p>
            <p style={{ color: "#6b6460" }} className="text-sm leading-relaxed">Een plek waar je niets hoeft uit te leggen.<br />Waar alles er mag zijn.<br /><br />Ook de dingen die je normaal inslikt.</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "#b0a8a0" }}>Wat het je geeft</p>
            <Voordelen items={["Erkenning zonder uitleg", "Ruimte voor rauwe gedachten", "Dagelijkse steun zonder druk", "Van alleen dragen → naar even samen"]} />
          </div>
          <CtaButton url={typeCtaUrlKinderloos} fallback={defaultCtaUrl} label="Start met Niet Alleen – Ongewenst kinderloos (€37)" />
        </section>

        <div style={{ borderTop: "2px solid #e8e0d8" }} className="max-w-2xl mx-auto" />

        {/* ALGEMEEN */}
        <section className="max-w-lg mx-auto px-6 py-16 space-y-8">
          <div className="space-y-4">
            <h3 className="text-xl font-semibold" style={{ color: "#3d3530" }}>Wat is Niet Alleen precies?</h3>
            <ul className="space-y-2">
              {["30 dagen lang dagelijkse e-mails", "Geschreven als een gesprek (via Benji)", "Met ruimte om te reageren wanneer jij wilt"].map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm" style={{ color: "#6b6460" }}>
                  <span style={{ color: "#6d84a8" }}>✦</span>{item}
                </li>
              ))}
            </ul>
            <p className="text-sm" style={{ color: "#8a8078" }}>Geen vaste tijden. Geen verwachtingen. Geen druk.<br />Alleen een plek waar jij even kunt zijn.</p>
          </div>
          <div className="space-y-3">
            <h3 className="text-xl font-semibold" style={{ color: "#3d3530" }}>Voor wie is dit?</h3>
            <p className="text-sm" style={{ color: "#8a8078" }}>Voor vrouwen die:</p>
            <ul className="space-y-2">
              {["Veel dragen, maar weinig delen", "Niemand willen belasten", "Hun gedachten eerst zelf willen ordenen", "Verlangen naar zachtheid, niet naar oplossingen"].map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm" style={{ color: "#6b6460" }}>
                  <span style={{ color: "#6d84a8" }}>✦</span>{item}
                </li>
              ))}
            </ul>
          </div>
          <div className="text-center space-y-4 pt-4">
            <p className="text-base leading-relaxed" style={{ color: "#6b6460" }}>
              Samen maken we het lichter.<br />Je hoeft het niet meer Alleen te dragen.
            </p>
            <p className="text-sm font-semibold" style={{ color: "#3d3530" }}>Kies wat bij je past en begin vandaag</p>
            <TypeKnoppen klein />
          </div>
        </section>

        <footer className="text-center py-8 px-6">
          <p className="text-xs" style={{ color: "#c4bdb6" }}>
            &copy; {new Date().getFullYear()} Talk To Benji ·{" "}
            <Link href="/privacy" className="hover:underline">Privacy</Link>
          </p>
        </footer>
      </div>
    </div>
  );
}
