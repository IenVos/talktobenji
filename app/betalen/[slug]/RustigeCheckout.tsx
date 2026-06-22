"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";

/**
 * Rustige checkout-layout (variant voor verdriet/rouw).
 * Bewust geen sales-trucs: rust, herkenning en witruimte. Alle teksten/afbeeldingen
 * komen uit product.rustigeContent (admin), met zachte defaults als terugval.
 * De betaal-plumbing (Stripe) blijft in de pagina; die wordt als `paymentNode`
 * doorgegeven en hier in het betaalblok geplaatst. CTA-knoppen scrollen ernaartoe.
 */

const KLEUR = {
  bg: "#fdf9f4",
  titel: "#3d3530",
  tekst: "#6b6460",
  zacht: "#a09890",
  accent: "#6d84a8",
  kaart: "#ffffff",
  rand: "#e8e0d8",
  accentZacht: "#eef1f6",
};

type Prompt = { dag: string; vraag: string };
type Review = { author: string; role?: string; text: string; imageUrl?: string | null };

export type RustigeContent = {
  hero?: { imageUrl?: string | null; titel?: string; subtitel?: string; intro?: string; bullets?: string[]; prijsLabel?: string; buttonText?: string };
  watJeKrijgt?: { imageUrl?: string | null; titel?: string; tekst?: string; bullets?: string[]; prompts?: Prompt[] };
  herkenning?: { imageUrl?: string | null; quote?: string; intro?: string; bullets?: string[]; slot?: string };
  reviewsTitel?: string;
  benjiVerhaal?: { imageUrl?: string | null; titel?: string; tekst?: string };
  veiligheid?: { bullets?: string[]; buttonText?: string };
  faq?: { vraag: string; antwoord: string }[];
};

const DEFAULT: Required<Omit<RustigeContent, "reviewsTitel">> & { reviewsTitel: string } = {
  hero: {
    titel: "Niet Alleen",
    subtitel: "30 dagen zachte begeleiding wanneer je hoofd vol zit en je even niet weet hoe verder.",
    intro: "💙 Een klein dagelijks ankerpunt voor mensen die door een moeilijke periode gaan.",
    bullets: ["Slechts 3 tot 5 minuten per dag", "Geen zware opdrachten", "Op jouw tempo", "Direct toegang"],
    prijsLabel: "€37 eenmalig",
    buttonText: "Ja, ik wil beginnen",
  },
  watJeKrijgt: {
    titel: "Geen grote opdrachten",
    tekst: "Gewoon kleine dagelijkse momenten die helpen om stil te staan bij wat je voelt.",
    bullets: ["30 dagen begeleiding", "Reflectievragen", "Kleine oefeningen", "Meer rust en overzicht"],
    prompts: [
      { dag: "Dag 3", vraag: "Wat heb je vandaag nodig?" },
      { dag: "Dag 7", vraag: "Welke gedachte blijft steeds terugkomen?" },
      { dag: "Dag 14", vraag: "Wat zou je tegen jezelf zeggen als je je beste vriend was?" },
    ],
  },
  herkenning: {
    quote: "Soms ben je niet verdrietig.\nSoms ben je gewoon moe van alles dragen.",
    intro: "Misschien herken je dit:",
    bullets: [
      "Je hoofd blijft maar doorgaan",
      "Je weet niet goed wat je voelt",
      "Je probeert sterk te blijven",
      "Je bent moe van alles alleen dragen",
    ],
    slot: "Dan is Niet Alleen voor jou gemaakt.",
  },
  reviewsTitel: "Hoe anderen dit hebben ervaren",
  benjiVerhaal: {
    titel: "Waarom ik dit maakte",
    tekst: "Ik heb Niet Alleen gemaakt omdat ik zag hoe vaak mensen alleen gelaten worden met verdriet.",
  },
  veiligheid: {
    bullets: ["Direct toegang na betaling", "Eenmalig, geen abonnement", "Op jouw tempo", "Geen druk of verwachtingen"],
    buttonText: "Ja, ik gun mezelf dit moment",
  },
  faq: [
    { vraag: "Moet ik veel schrijven?", antwoord: "Nee. Een paar woorden is genoeg. Je hoeft niets, je mag alles." },
    { vraag: "Hoeveel tijd kost dit?", antwoord: "Een paar minuten per dag, meer niet." },
    { vraag: "Is dit therapie?", antwoord: "Nee. Het is zachte begeleiding, geen vervanging voor professionele hulp." },
    { vraag: "Krijg ik direct toegang?", antwoord: "Ja, meteen na je betaling kun je beginnen." },
    { vraag: "Wat als ik een dag oversla?", antwoord: "Helemaal niet erg. Je pakt het op wanneer het jou uitkomt, op jouw tempo." },
  ],
};

function scrollNaarBetalen() {
  document.getElementById("betaalblok")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function Alineas({ tekst, className }: { tekst?: string; className?: string }) {
  if (!tekst?.trim()) return null;
  return (
    <>
      {tekst.split("\n\n").map((para, i) => (
        <p key={i} className={className}>
          {para.split("\n").map((line, j) => (j === 0 ? line : <span key={j}>{<br />}{line}</span>))}
        </p>
      ))}
    </>
  );
}

function Vinkjes({ items }: { items?: string[] }) {
  if (!items?.length) return null;
  // Vinkjes als groep gecentreerd, items links uitgelijnd zodat ze onder elkaar
  // op één lijn beginnen.
  return (
    <div className="flex justify-center">
      <ul className="space-y-3 text-left">
        {items.map((b, i) => (
          <li key={i} className="flex items-start gap-3">
            <span className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center mt-0.5" style={{ background: KLEUR.accentZacht }}>
              <svg width="11" height="9" viewBox="0 0 10 8" fill="none">
                <path d="M1 4l2.5 2.5L9 1" stroke={KLEUR.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <span className="text-base leading-relaxed text-pretty" style={{ color: KLEUR.tekst }}>{b}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// Vast, iets smaller kader voor álle losse tekst (koppen, subkoppen, alinea's):
// gecentreerd op de pagina, tekst gecentreerd. Vinkjes vormen een gecentreerde
// groep met links uitgelijnde items. Kaarten (prompts, quote, reviews, foto's)
// blijven op de volle breedte.
const FRAME = "max-w-md mx-auto text-center";

function SectieFoto({ url, alt, ratio = "aspect-[4/3]" }: { url?: string | null; alt: string; ratio?: string }) {
  if (!url) return null;
  return (
    <div className={`relative w-full ${ratio} rounded-3xl overflow-hidden`} style={{ background: KLEUR.accentZacht }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={url} alt={alt} loading="lazy" decoding="async" className="absolute inset-0 w-full h-full object-cover" />
    </div>
  );
}

export function RustigeCheckout({
  product,
  priceFormatted,
  gegevensNode,
  paymentNode,
}: {
  product: { name: string; rustigeContent?: RustigeContent | null; reviews?: Review[] };
  priceFormatted: string;
  gegevensNode?: ReactNode;
  paymentNode: ReactNode;
}) {
  const rc = product.rustigeContent ?? {};
  const hero = { ...DEFAULT.hero, ...(rc.hero ?? {}) };
  const wjk = { ...DEFAULT.watJeKrijgt, ...(rc.watJeKrijgt ?? {}) };
  const herk = { ...DEFAULT.herkenning, ...(rc.herkenning ?? {}) };
  const benji = { ...DEFAULT.benjiVerhaal, ...(rc.benjiVerhaal ?? {}) };
  const veilig = { ...DEFAULT.veiligheid, ...(rc.veiligheid ?? {}) };
  const faq = rc.faq?.length ? rc.faq : DEFAULT.faq;
  const reviewsTitel = rc.reviewsTitel?.trim() || DEFAULT.reviewsTitel;
  const reviews = product.reviews ?? [];
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen" style={{ background: KLEUR.bg }}>
      <main className="max-w-xl mx-auto px-5 py-10 space-y-16">

        {/* ── Sectie 1 — Hero ── */}
        <section className="space-y-6">
          <div className="flex justify-center">
            <Image src="/images/benji-logo-2.png" alt="" width={36} height={36} className="opacity-60" style={{ width: "auto", height: "auto" }} />
          </div>
          <SectieFoto url={hero.imageUrl} alt={hero.titel ?? product.name} ratio="aspect-[3/2]" />
          <div className={`${FRAME} space-y-4`}>
            <h1 className="text-3xl font-semibold tracking-tight text-balance" style={{ color: KLEUR.titel }}>{hero.titel || product.name}</h1>
            <p className="text-lg leading-relaxed text-pretty" style={{ color: KLEUR.tekst }}>{hero.subtitel}</p>
            {hero.intro?.trim() && (
              <p className="text-base leading-relaxed text-pretty" style={{ color: KLEUR.tekst }}>{hero.intro}</p>
            )}
            <Vinkjes items={hero.bullets} />
            <p className="text-2xl font-semibold pt-1" style={{ color: KLEUR.titel }}>{hero.prijsLabel || priceFormatted}</p>
          </div>
          <button
            type="button"
            onClick={scrollNaarBetalen}
            className="block w-full max-w-xs mx-auto py-3.5 rounded-2xl font-medium text-white text-base"
            style={{ background: KLEUR.accent }}
          >
            {hero.buttonText}
          </button>
        </section>

        {/* ── Sectie 2 — Wat je krijgt ── */}
        <section className="space-y-6">
          <SectieFoto url={wjk.imageUrl} alt={wjk.titel ?? "Wat je krijgt"} />
          {wjk.prompts && wjk.prompts.length > 0 && (
            <div className="space-y-3">
              {wjk.prompts.map((p, i) => (
                <div key={i} className="rounded-2xl border p-5" style={{ background: KLEUR.kaart, borderColor: KLEUR.rand }}>
                  <p className="text-xs font-medium mb-1" style={{ color: KLEUR.zacht }}>{p.dag}</p>
                  <p className="text-base leading-relaxed" style={{ color: KLEUR.titel }}>&ldquo;{p.vraag}&rdquo;</p>
                </div>
              ))}
            </div>
          )}
          {(wjk.titel?.trim() || wjk.tekst?.trim()) && (
            <div className="text-center rounded-2xl border p-6 space-y-4" style={{ borderColor: KLEUR.rand }}>
              {wjk.titel?.trim() && <h2 className="text-xl font-semibold text-balance" style={{ color: KLEUR.titel }}>{wjk.titel}</h2>}
              <Alineas tekst={wjk.tekst} className="text-base leading-relaxed text-pretty" />
            </div>
          )}
          {wjk.bullets && wjk.bullets.length > 0 && (
            <div><Vinkjes items={wjk.bullets} /></div>
          )}
        </section>

        {/* ── Sectie 3 — Herkenning ── */}
        <section className="space-y-6">
          {herk.imageUrl ? (
            <SectieFoto url={herk.imageUrl} alt="" ratio="aspect-[3/2]" />
          ) : herk.quote?.trim() ? (
            <div className="rounded-3xl p-8 text-center" style={{ background: KLEUR.accentZacht }}>
              <Alineas tekst={herk.quote} className="text-xl leading-relaxed font-medium" />
            </div>
          ) : null}
          <div className={`${FRAME} space-y-4`}>
            {herk.intro?.trim() && <p className="text-lg" style={{ color: KLEUR.titel }}>{herk.intro}</p>}
            <Vinkjes items={herk.bullets} />
            {herk.slot?.trim() && <p className="text-lg leading-relaxed text-pretty pt-1" style={{ color: KLEUR.titel }}>{herk.slot}</p>}
          </div>
        </section>

        {/* ── Sectie 5 — Persoonlijk verhaal Benji ── */}
        {(benji.tekst?.trim() || benji.imageUrl) && (
          <section className="space-y-5">
            <div className="flex items-start gap-4 text-left rounded-2xl border p-6" style={{ borderColor: KLEUR.rand }}>
              {benji.imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={benji.imageUrl} alt={benji.titel ?? "Benji"} loading="lazy" className="w-16 h-16 rounded-full object-cover flex-shrink-0" />
              )}
              <div className="min-w-0 space-y-3">
                {benji.titel?.trim() && <h2 className="text-xl font-semibold text-balance text-center" style={{ color: KLEUR.titel }}>{benji.titel}</h2>}
                <Alineas tekst={benji.tekst} className="text-base leading-relaxed text-pretty" />
              </div>
            </div>
          </section>
        )}

        {/* ── Sectie 6 — Veiligheid vlak boven de laatste knop ── */}
        <section className="space-y-5">
          <div className={FRAME}><Vinkjes items={veilig.bullets} /></div>
          <button
            type="button"
            onClick={scrollNaarBetalen}
            className="block w-full max-w-xs mx-auto py-3.5 rounded-2xl font-medium text-white text-base"
            style={{ background: KLEUR.accent }}
          >
            {veilig.buttonText}
          </button>
        </section>

        {/* ── Reviews — vlak boven het betaalscherm voor extra vertrouwen ── */}
        {reviews.length > 0 && (
          <section className="space-y-4">
            <h2 className={`text-xl font-semibold ${FRAME}`} style={{ color: KLEUR.titel }}>{reviewsTitel}</h2>
            <div className="space-y-3">
              {reviews.map((r, i) => (
                <div key={i} className="rounded-2xl border p-6" style={{ background: KLEUR.kaart, borderColor: KLEUR.rand }}>
                  <p className="text-base leading-relaxed italic mb-3" style={{ color: KLEUR.tekst }}>&ldquo;{r.text}&rdquo;</p>
                  <div className="flex items-center gap-2.5">
                    {r.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={r.imageUrl} alt={r.author} loading="lazy" className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
                    ) : (
                      <div className="w-8 h-8 rounded-full flex items-center justify-center font-semibold text-xs flex-shrink-0" style={{ background: KLEUR.accentZacht, color: KLEUR.accent }}>
                        {r.author.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-semibold" style={{ color: KLEUR.titel }}>{r.author}</p>
                      {r.role && <p className="text-xs" style={{ color: KLEUR.zacht }}>{r.role}</p>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Betaalblok ── */}
        <section id="betaalblok" className="scroll-mt-6">
          <div id="jouw-gegevens" className="rounded-3xl border p-6 space-y-5 scroll-mt-6" style={{ background: KLEUR.kaart, borderColor: KLEUR.rand }}>
            <div className="flex items-baseline justify-between">
              <span className="text-base font-medium" style={{ color: KLEUR.titel }}>{product.name}</span>
              <span className="text-lg font-semibold" style={{ color: KLEUR.titel }}>{priceFormatted}</span>
            </div>
            {gegevensNode}
            {paymentNode}
          </div>
        </section>

        {/* ── Sectie 7 — FAQ ── */}
        {faq.length > 0 && (
          <section className="space-y-3">
            <h2 className={`text-xl font-semibold ${FRAME}`} style={{ color: KLEUR.titel }}>Veelgestelde vragen</h2>
            <div className="space-y-2">
              {faq.map((item, i) => (
                <div key={i} className="rounded-2xl border overflow-hidden" style={{ background: KLEUR.kaart, borderColor: KLEUR.rand }}>
                  <button
                    type="button"
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full text-left px-5 py-4 flex items-center justify-between gap-3"
                  >
                    <span className="text-base font-medium" style={{ color: KLEUR.titel }}>{item.vraag}</span>
                    <span className="flex-shrink-0 text-xl leading-none" style={{ color: KLEUR.zacht }}>{openFaq === i ? "−" : "+"}</span>
                  </button>
                  {openFaq === i && (
                    <div className="px-5 pb-4 -mt-1">
                      <p className="text-base leading-relaxed" style={{ color: KLEUR.tekst }}>{item.antwoord}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        <p className="text-center text-xs" style={{ color: KLEUR.zacht }}>
          <Link href="/privacy" className="hover:underline">Privacy</Link>
          {" · "}
          <Link href="/algemene-voorwaarden" className="hover:underline">Algemene voorwaarden</Link>
        </p>
      </main>
    </div>
  );
}
