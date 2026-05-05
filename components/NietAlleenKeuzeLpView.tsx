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
}

const DEFAULT_LABELS: Record<TypeKey, string> = {
  persoon:    "Ik mis iemand",
  huisdier:   "Ik heb mijn dier verloren",
  relatie:    "Mijn relatie is voorbij",
  kinderloos: "Ongewenst kinderloos",
};

const TYPES: { key: TypeKey; emoji: string }[] = [
  { key: "persoon",    emoji: "💔" },
  { key: "huisdier",  emoji: "🐾" },
  { key: "relatie",   emoji: "💭" },
  { key: "kinderloos",emoji: "🌱" },
];

function CtaButton({ url, label }: { url?: string; label: string }) {
  const base =
    "inline-block w-full sm:w-auto px-7 py-3.5 rounded-xl font-semibold text-sm text-white text-center transition-opacity";
  if (!url) {
    return (
      <span className={`${base} opacity-50 cursor-default`} style={{ background: "#6d84a8" }}>
        {label}
      </span>
    );
  }
  return (
    <Link href={url} className={`${base} hover:opacity-90`} style={{ background: "#6d84a8" }}>
      {label}
    </Link>
  );
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

export function NietAlleenKeuzeLpView({ typeCtaUrlPersoon, typeCtaUrlHuisdier, typeCtaUrlRelatie, typeCtaUrlKinderloos, typeButtonLabelPersoon, typeButtonLabelHuisdier, typeButtonLabelRelatie, typeButtonLabelKinderloos }: Props) {
  const buttonLabels: Record<TypeKey, string> = {
    persoon:    typeButtonLabelPersoon    || DEFAULT_LABELS.persoon,
    huisdier:   typeButtonLabelHuisdier   || DEFAULT_LABELS.huisdier,
    relatie:    typeButtonLabelRelatie    || DEFAULT_LABELS.relatie,
    kinderloos: typeButtonLabelKinderloos || DEFAULT_LABELS.kinderloos,
  };
  const [actief, setActief] = useState<TypeKey | null>(null);
  const sectionRefs: Record<TypeKey, React.RefObject<HTMLDivElement>> = {
    persoon:    useRef<HTMLDivElement>(null),
    huisdier:   useRef<HTMLDivElement>(null),
    relatie:    useRef<HTMLDivElement>(null),
    kinderloos: useRef<HTMLDivElement>(null),
  };

  const ctaUrls: Record<TypeKey, string | undefined> = {
    persoon:    typeCtaUrlPersoon,
    huisdier:   typeCtaUrlHuisdier,
    relatie:    typeCtaUrlRelatie,
    kinderloos: typeCtaUrlKinderloos,
  };

  function kiesType(key: TypeKey) {
    const url = ctaUrls[key];
    if (url) {
      window.location.href = url;
      return;
    }
    setActief(key);
    sectionRefs[key].current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const t = (text: string) =>
    text.split("\n\n").map((para, i) => (
      <p key={i} className="leading-relaxed mb-3" style={{ color: "#6b6460" }}>
        {para.split("\n").map((line, j, arr) => (
          <span key={j}>{line}{j < arr.length - 1 && <br />}</span>
        ))}
      </p>
    ));

  return (
    <div style={{ minHeight: "100vh", background: "#fdf9f4", position: "relative" }}>
      {/* Achtergrond */}
      <div style={{ position: "fixed", inset: 0, zIndex: 0 }}>
        <Image src="/images/achtergrond.png" alt="" fill className="object-cover" priority />
        <div style={{ position: "absolute", inset: 0, background: "rgba(253,249,244,0.88)" }} />
      </div>

      <div style={{ position: "relative", zIndex: 1 }}>
        {/* Header */}
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
          <p className="text-base font-medium pt-2" style={{ color: "#3d3530" }}>
            Je hoeft het niet langer alleen te dragen.
          </p>
        </section>

        {/* KEUZEMOMENT */}
        <section className="max-w-md mx-auto px-6 pb-14 space-y-5">
          <div className="text-center space-y-1">
            <p className="text-sm font-medium" style={{ color: "#8a8078" }}>Je hoeft het hier niet uit te leggen.</p>
            <p className="text-base font-semibold" style={{ color: "#3d3530" }}>Kies gewoon wat het dichtst bij je ligt:</p>
          </div>
          <div className="space-y-3">
            {TYPES.map(({ key, emoji }) => (
              <button
                key={key}
                onClick={() => kiesType(key)}
                className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl border-2 text-left transition-all"
                style={{
                  borderColor: actief === key ? "#6d84a8" : "#e8e0d8",
                  background: actief === key ? "#eef1f6" : "white",
                  color: "#3d3530",
                }}
              >
                <span className="text-2xl flex-shrink-0">{emoji}</span>
                <span className="text-sm font-medium">{buttonLabels[key]}</span>
                {actief === key && (
                  <span className="ml-auto text-xs font-semibold flex-shrink-0" style={{ color: "#6d84a8" }}>↓</span>
                )}
              </button>
            ))}
          </div>
        </section>

        {/* DIVIDER */}
        <div style={{ borderTop: "1px solid #e8e0d8" }} className="max-w-2xl mx-auto" />

        {/* ─── SECTIE: PERSOON ─── */}
        <section ref={sectionRefs.persoon} id="persoon" className="max-w-lg mx-auto px-6 py-16 space-y-5 scroll-mt-8">
          <p className="text-xs uppercase tracking-widest font-medium" style={{ color: "#b0a8a0" }}>💔 Verlies van een persoon</p>
          <h2 className="text-2xl sm:text-3xl font-semibold leading-snug" style={{ color: "#3d3530" }}>
            Je mist iemand.<br />
            <span style={{ fontWeight: 400, color: "#6b6460" }}>En niemand kan dat echt opvangen.</span>
          </h2>
          {t(`Mensen vragen hoe het gaat.\nEn je zegt: "gaat wel."

Maar wat moet je anders zeggen?

Dat je soms nog steeds automatisch aan ze denkt?\nDat je midden op de dag ineens stilvalt?\nDat het 's nachts het hardst binnenkomt?

Je wil het delen.\nMaar niet elke keer het hele verhaal vertellen.\nNiet weer die stilte aan de andere kant.`)}
          <p className="text-base font-medium" style={{ color: "#3d3530" }}>Dus je houdt het maar bij jezelf.</p>
          <div className="border-l-2 pl-5 py-1 space-y-3" style={{ borderColor: "#6d84a8" }}>
            <p className="text-sm font-semibold" style={{ color: "#6d84a8" }}>Dit is waar Niet Alleen begint</p>
            {t(`30 dagen lang ontvang je elke dag een e-mail.\nMet daarin een bericht van Benji.

Geen oplossingen.\nGeen "je moet gewoon…"

Maar woorden die begrijpen hoe het voelt.\nEn een plek waar jij even alles kwijt kunt.

Wanneer jij daar klaar voor bent.`)}
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "#b0a8a0" }}>Wat het je geeft</p>
            <Voordelen items={[
              "Iemand die elke dag even naast je zit",
              "Ruimte om te voelen zonder oordeel",
              "Je gedachten ordenen zonder druk",
              "Van alles alleen dragen → naar even delen",
            ]} />
          </div>
          <p className="text-sm italic" style={{ color: "#8a8078" }}>Niet opgelost. Maar wél iets lichter.</p>
          <CtaButton url={ctaUrls.persoon} label="Start met Niet Alleen – Verlies Persoon (€37)" />
        </section>

        <div style={{ borderTop: "1px solid #e8e0d8" }} className="max-w-2xl mx-auto" />

        {/* ─── SECTIE: HUISDIER ─── */}
        <section ref={sectionRefs.huisdier} id="huisdier" className="max-w-lg mx-auto px-6 py-16 space-y-5 scroll-mt-8">
          <p className="text-xs uppercase tracking-widest font-medium" style={{ color: "#b0a8a0" }}>🐾 Verlies van een dier</p>
          <h2 className="text-2xl sm:text-3xl font-semibold leading-snug" style={{ color: "#3d3530" }}>
            Ze zeggen: &ldquo;het was maar een dier.&rdquo;<br />
            <span style={{ fontWeight: 400, color: "#6b6460" }}>Maar voor jou was het zoveel meer.</span>
          </h2>
          {t(`Een maatje.\nRoutine.\nStilte die nu anders voelt.

Je mist de kleine dingen.\nDe vanzelfsprekendheid.\nDe aanwezigheid.

En misschien voelt het alsof je dit niet "groot genoeg" mag maken.

Dus je zegt er minder over.\nDan je eigenlijk zou willen.`)}
          <p className="text-base font-medium" style={{ color: "#3d3530" }}>Maar jouw verdriet is echt.</p>
          <div className="border-l-2 pl-5 py-1 space-y-3" style={{ borderColor: "#6d84a8" }}>
            <p className="text-sm font-semibold" style={{ color: "#6d84a8" }}>Dit is waar Niet Alleen begint</p>
            {t(`Elke dag een moment voor jou.\nWaar je niets hoeft uit te leggen.

Waar je vandaag meer mag zijn dan gisteren.`)}
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "#b0a8a0" }}>Wat het je geeft</p>
            <Voordelen items={[
              "Erkenning zonder dat je het hoeft te verdedigen",
              "Dagelijks een moment van zachtheid",
              "Ruimte voor herinneringen én gemis",
              "Van stil verdriet → naar gedeeld gevoel",
            ]} />
          </div>
          <CtaButton url={ctaUrls.huisdier} label="Start met Niet Alleen – Verlies Huisdier (€37)" />
        </section>

        <div style={{ borderTop: "1px solid #e8e0d8" }} className="max-w-2xl mx-auto" />

        {/* ─── SECTIE: RELATIE ─── */}
        <section ref={sectionRefs.relatie} id="relatie" className="max-w-lg mx-auto px-6 py-16 space-y-5 scroll-mt-8">
          <p className="text-xs uppercase tracking-widest font-medium" style={{ color: "#b0a8a0" }}>💭 Einde van een relatie</p>
          <h2 className="text-2xl sm:text-3xl font-semibold leading-snug" style={{ color: "#3d3530" }}>
            Je relatie is voorbij.<br />
            <span style={{ fontWeight: 400, color: "#6b6460" }}>Maar je hoofd is dat nog niet.</span>
          </h2>
          {t(`Je denkt terug.\nAnalyseert.\nTwijfelt.

Was het de juiste keuze?\nHad je iets anders kunnen doen?\nWaarom voelt het nog zo aanwezig?

Overdag red je je wel.\nMaar 's avonds… begint het weer.`)}
          <p className="text-base font-medium" style={{ color: "#3d3530" }}>En je wil er niet steeds over praten met anderen.</p>
          <div className="border-l-2 pl-5 py-1 space-y-3" style={{ borderColor: "#6d84a8" }}>
            <p className="text-sm font-semibold" style={{ color: "#6d84a8" }}>Dit is waar Niet Alleen begint</p>
            {t(`Een plek waar je gedachten mogen bestaan.\nZonder dat iemand meteen een mening heeft.

Waar je niet "sterk" hoeft te zijn.\nMaar gewoon even eerlijk.`)}
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "#b0a8a0" }}>Wat het je geeft</p>
            <Voordelen items={[
              "Rust in je hoofd",
              "Ruimte om te verwerken in jouw tempo",
              "Iemand die luistert zonder oordeel",
              "Van blijven malen → naar zacht loslaten",
            ]} />
          </div>
          <CtaButton url={ctaUrls.relatie} label="Start met Niet Alleen – Relatie (€37)" />
        </section>

        <div style={{ borderTop: "1px solid #e8e0d8" }} className="max-w-2xl mx-auto" />

        {/* ─── SECTIE: KINDERLOOS ─── */}
        <section ref={sectionRefs.kinderloos} id="kinderloos" className="max-w-lg mx-auto px-6 py-16 space-y-5 scroll-mt-8">
          <p className="text-xs uppercase tracking-widest font-medium" style={{ color: "#b0a8a0" }}>🌱 Ongewenst kinderloos</p>
          <h2 className="text-2xl sm:text-3xl font-semibold leading-snug" style={{ color: "#3d3530" }}>
            Ongewenst kinderloos.<br />
            <span style={{ fontWeight: 400, color: "#6b6460" }}>Iets wat mensen niet kunnen zien.</span>
          </h2>
          {t(`En waarvoor niemand de juiste woorden heeft.

Want het is niet zichtbaar.\nNiet tastbaar.\nMaar het is er. Altijd.

In momenten.\nIn gesprekken.\nIn wat er niet is.

En misschien voel je je alleen in hoe groot het is.`)}
          <p className="text-base font-medium" style={{ color: "#3d3530" }}>Alsof je het niet helemaal mag voelen.</p>
          <div className="border-l-2 pl-5 py-1 space-y-3" style={{ borderColor: "#6d84a8" }}>
            <p className="text-sm font-semibold" style={{ color: "#6d84a8" }}>Dit is waar Niet Alleen begint</p>
            {t(`Een plek waar je niets hoeft uit te leggen.\nWaar alles er mag zijn.

Ook de dingen die je normaal inslikt.`)}
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "#b0a8a0" }}>Wat het je geeft</p>
            <Voordelen items={[
              "Erkenning zonder uitleg",
              "Ruimte voor rauwe gedachten",
              "Dagelijkse steun zonder druk",
              "Van alleen dragen → naar even samen",
            ]} />
          </div>
          <CtaButton url={ctaUrls.kinderloos} label="Start met Niet Alleen – Ongewenst kinderloos (€37)" />
        </section>

        <div style={{ borderTop: "2px solid #e8e0d8" }} className="max-w-2xl mx-auto" />

        {/* ─── ALGEMENE SECTIE ─── */}
        <section className="max-w-lg mx-auto px-6 py-16 space-y-8">
          <div className="space-y-4">
            <h3 className="text-xl font-semibold" style={{ color: "#3d3530" }}>Wat is Niet Alleen precies?</h3>
            <ul className="space-y-2">
              {[
                "30 dagen lang dagelijkse e-mails",
                "Geschreven als een gesprek (via Benji)",
                "Met ruimte om te reageren wanneer jij wilt",
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm" style={{ color: "#6b6460" }}>
                  <span style={{ color: "#6d84a8" }}>✦</span>
                  {item}
                </li>
              ))}
            </ul>
            <p className="text-sm" style={{ color: "#8a8078" }}>
              Geen vaste tijden. Geen verwachtingen. Geen druk.<br />
              Alleen een plek waar jij even kunt zijn.
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="text-xl font-semibold" style={{ color: "#3d3530" }}>Voor wie is dit?</h3>
            <p className="text-sm" style={{ color: "#8a8078" }}>Voor vrouwen die:</p>
            <ul className="space-y-2">
              {[
                "Veel dragen, maar weinig delen",
                "Niemand willen belasten",
                "Hun gedachten eerst zelf willen ordenen",
                "Verlangen naar zachtheid, niet naar oplossingen",
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm" style={{ color: "#6b6460" }}>
                  <span style={{ color: "#6d84a8" }}>✦</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="text-center space-y-4 pt-4">
            <p className="text-base leading-relaxed" style={{ color: "#6b6460" }}>
              Samen maken we het lichter.<br />
              Je hoeft het niet meer Alleen te dragen.
            </p>
            <p className="text-sm font-semibold" style={{ color: "#3d3530" }}>Kies wat bij je past en begin vandaag</p>
            <div className="space-y-3">
              {TYPES.map(({ key, emoji }) => (
                <button
                  key={key}
                  onClick={() => kiesType(key)}
                  className="w-full flex items-center gap-3 px-5 py-3.5 rounded-2xl border text-left transition-all hover:border-primary-300"
                  style={{
                    borderColor: actief === key ? "#6d84a8" : "#e8e0d8",
                    background: actief === key ? "#eef1f6" : "white",
                    color: "#3d3530",
                  }}
                >
                  <span className="text-xl">{emoji}</span>
                  <span className="text-sm font-medium">{buttonLabels[key]}</span>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Footer */}
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
