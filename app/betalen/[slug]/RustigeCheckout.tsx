"use client";

import { useState, Fragment, type ReactNode } from "react";
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
type TextBlock = { title?: string; content: string; imageUrl?: string | null };

export type RustigeContent = {
  hero?: { imageUrl?: string | null; titel?: string; subtitel?: string; intro?: string; bullets?: string[]; prijsLabel?: string; buttonText?: string; buttonEnabled?: boolean; buttonColor?: string };
  watJeKrijgt?: { imageUrl?: string | null; titel?: string; tekst?: string; bullets?: string[]; prompts?: Prompt[] };
  herkenning?: { imageUrl?: string | null; quote?: string; intro?: string; bullets?: string[]; slot?: string };
  reviewsTitel?: string;
  benjiVerhaal?: { imageUrl?: string | null; titel?: string; tekst?: string };
  veiligheid?: { bullets?: string[]; buttonText?: string; buttonEnabled?: boolean; buttonColor?: string };
  faq?: { vraag: string; antwoord: string }[];
  // Volgorde van de secties op de pagina (sleutels uit SECTIE_SLEUTELS). Ontbrekende
  // sleutels worden in de standaardvolgorde achteraan aangevuld.
  sectionOrder?: string[];
};

// Vaste standaardvolgorde van de secties. Admin kan hiervan afwijken via sectionOrder.
export const RUSTIGE_SECTIE_VOLGORDE = [
  "hero", "watJeKrijgt", "herkenning", "benjiVerhaal", "veiligheid", "reviews", "betaalblok", "extra", "faq",
] as const;

// Labels voor in de admin (zelfde sleutels).
export const RUSTIGE_SECTIE_LABELS: Record<string, string> = {
  hero: "Hero",
  watJeKrijgt: "Wat je krijgt",
  herkenning: "Herkenning",
  benjiVerhaal: "Persoonlijk verhaal",
  veiligheid: "Veiligheid + knop",
  reviews: "Reviews",
  betaalblok: "Betaalblok",
  extra: "Extra tekstblokken",
  faq: "FAQ",
};

// Bewust géén standaardteksten: wat in de admin leeg blijft, blijft leeg op de
// voorkant. Alleen kleine functionele terugval (knoplabels, prijs) hieronder.

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
  product: { name: string; rustigeContent?: RustigeContent | null; reviews?: Review[]; extraTextBlocks?: TextBlock[] };
  priceFormatted: string;
  gegevensNode?: ReactNode;
  paymentNode: ReactNode;
}) {
  const rc = product.rustigeContent ?? {};
  // Geen standaardteksten: wat leeg is in de admin blijft leeg. Alleen knoplabels
  // en de prijs vallen terug op iets neutraals zodat knoppen niet leeg zijn.
  const hero = rc.hero ?? {};
  const wjk = rc.watJeKrijgt ?? {};
  const herk = rc.herkenning ?? {};
  const benji = rc.benjiVerhaal ?? {};
  const veilig = rc.veiligheid ?? {};
  const faq = rc.faq ?? [];
  const reviewsTitel = rc.reviewsTitel?.trim() || "Hoe anderen dit hebben ervaren";
  const reviews = product.reviews ?? [];
  const extraBlocks = product.extraTextBlocks ?? [];
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // Per sectie bepalen of er überhaupt iets te tonen is, zodat lege secties
  // (en hun witruimte) volledig verdwijnen.
  const heeftWjk = !!(wjk.imageUrl || wjk.prompts?.length || wjk.titel?.trim() || wjk.tekst?.trim() || wjk.bullets?.length);
  const heeftHerk = !!(herk.imageUrl || herk.quote?.trim() || herk.intro?.trim() || herk.bullets?.length || herk.slot?.trim());
  const heeftVeilig = !!(veilig.bullets?.length || veilig.buttonText?.trim());

  // Elke sectie als los blok, gekoppeld aan een sleutel. Lege secties zijn null en
  // vallen weg. De volgorde bepaalt de admin (rc.sectionOrder), met een terugval op
  // de standaardvolgorde en aanvulling van ontbrekende sleutels.
  const secties: Record<string, ReactNode> = {
    hero: (
        <section className="space-y-6">
          <div className="flex justify-center">
            <Image src="/images/benji-logo-2.png" alt="" width={36} height={36} className="opacity-60" style={{ width: "auto", height: "auto" }} />
          </div>
          <SectieFoto url={hero.imageUrl} alt={hero.titel ?? product.name} ratio="aspect-[3/2]" />
          <div className={`${FRAME} space-y-4`}>
            <h1 className="text-3xl font-semibold tracking-tight text-balance" style={{ color: KLEUR.titel }}>{hero.titel || product.name}</h1>
            {hero.subtitel?.trim() && (
              <p className="text-lg leading-relaxed text-pretty" style={{ color: KLEUR.tekst }}>{hero.subtitel}</p>
            )}
            {hero.intro?.trim() && (
              <p className="text-base leading-relaxed text-pretty" style={{ color: KLEUR.tekst }}>{hero.intro}</p>
            )}
            <Vinkjes items={hero.bullets} />
            <p className="text-2xl font-semibold pt-1" style={{ color: KLEUR.titel }}>{hero.prijsLabel || priceFormatted}</p>
          </div>
          {hero.buttonEnabled !== false && (
            <button
              type="button"
              onClick={scrollNaarBetalen}
              className="block w-full max-w-xs mx-auto py-3.5 rounded-2xl font-medium text-white text-base"
              style={{ background: hero.buttonColor || KLEUR.accent }}
            >
              {hero.buttonText || "Ja, ik wil beginnen"}
            </button>
          )}
        </section>
    ),
    watJeKrijgt: heeftWjk ? (
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
    ) : null,
    herkenning: heeftHerk ? (
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
    ) : null,
    benjiVerhaal: (benji.tekst?.trim() || benji.imageUrl) ? (
          <section className="space-y-5">
            <div className="rounded-2xl border p-6 space-y-3" style={{ borderColor: KLEUR.rand }}>
              {benji.titel?.trim() && <h2 className="text-xl font-semibold text-balance text-center" style={{ color: KLEUR.titel }}>{benji.titel}</h2>}
              <div className="flex items-start gap-4 text-left">
                {benji.imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={benji.imageUrl} alt={benji.titel ?? "Benji"} loading="lazy" className="w-16 h-16 rounded-full object-cover flex-shrink-0" />
                )}
                <div className="min-w-0"><Alineas tekst={benji.tekst} className="text-base leading-relaxed text-pretty" /></div>
              </div>
            </div>
          </section>
    ) : null,
    veiligheid: heeftVeilig ? (
        <section className="space-y-5">
          <div className={FRAME}><Vinkjes items={veilig.bullets} /></div>
          {veilig.buttonEnabled !== false && veilig.buttonText?.trim() && (
            <button
              type="button"
              onClick={scrollNaarBetalen}
              className="block w-full max-w-xs mx-auto py-3.5 rounded-2xl font-medium text-white text-base"
              style={{ background: veilig.buttonColor || KLEUR.accent }}
            >
              {veilig.buttonText}
            </button>
          )}
        </section>
    ) : null,
    reviews: reviews.length > 0 ? (
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
    ) : null,
    betaalblok: (
        <section id="betaalblok" className="scroll-mt-6">
          <div id="jouw-gegevens" className="rounded-3xl border p-6 space-y-5 scroll-mt-6" style={{ background: KLEUR.kaart, borderColor: KLEUR.rand }}>
            <div>
              <div className="flex items-baseline justify-between">
                <span className="text-base font-medium" style={{ color: KLEUR.titel }}>{product.name}</span>
                <span className="text-lg font-semibold" style={{ color: KLEUR.titel }}>{priceFormatted}</span>
              </div>
              <p className="mt-1 text-sm" style={{ color: KLEUR.zacht }}>30 dagen, eenmalig. Dat is iets meer dan een euro per dag.</p>
            </div>
            {gegevensNode}
            {paymentNode}
          </div>
        </section>
    ),
    extra: extraBlocks.length > 0 ? (
          <section className="space-y-4">
            {extraBlocks.map((block, i) => (
              <div key={i} className="rounded-2xl border p-6 space-y-3" style={{ background: KLEUR.kaart, borderColor: KLEUR.rand }}>
                {block.title?.trim() && (
                  <h2 className="text-lg font-semibold text-balance text-center" style={{ color: KLEUR.titel }}>{block.title}</h2>
                )}
                {block.imageUrl && (
                  <SectieFoto url={block.imageUrl} alt={block.title ?? ""} />
                )}
                {block.content.trim() && (
                  <Alineas tekst={block.content} className="text-base leading-relaxed text-pretty" />
                )}
              </div>
            ))}
          </section>
    ) : null,
    faq: faq.length > 0 ? (
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
    ) : null,
  };

  // Volgorde: admin-keuze eerst (alleen geldige sleutels), daarna ontbrekende in
  // standaardvolgorde. Zo blijft een oude/onvolledige volgorde altijd compleet.
  const gekozen = (rc.sectionOrder ?? []).filter((k) => k in secties);
  const volgorde = [...gekozen, ...RUSTIGE_SECTIE_VOLGORDE.filter((k) => !gekozen.includes(k))];

  return (
    <div className="min-h-screen" style={{ background: KLEUR.bg }}>
      <main className="max-w-xl mx-auto px-5 py-10 space-y-16">
        {volgorde.map((k) => (secties[k] ? <Fragment key={k}>{secties[k]}</Fragment> : null))}

        <p className="text-center text-xs" style={{ color: KLEUR.zacht }}>
          <Link href="/privacy" className="hover:underline">Privacy</Link>
          {" · "}
          <Link href="/algemene-voorwaarden" className="hover:underline">Algemene voorwaarden</Link>
        </p>
      </main>
    </div>
  );
}
