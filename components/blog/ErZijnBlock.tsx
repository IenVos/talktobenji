"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Check } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

// De flipbook-spreads van het Er Zijn-boekje (zelfde beelden als op /lp/er-zijn).
const SPREADS = [
  "/images/er-zijn-spread-0-cover.png",
  "/images/er-zijn-spread-1-binnen.png",
  "/images/er-zijn-spread-2-nietzeggen.png",
  "/images/er-zijn-spread-3-aanwezig.png",
  "/images/er-zijn-spread-4-zinnen.png",
  "/images/er-zijn-spread-5-verlies.png",
  "/images/er-zijn-spread-6-spiekbriefje.png",
  "/images/er-zijn-spread-7-meernodig.png",
];

const KERNPUNTEN = [
  "Woorden die wél troosten bij verlies, verdriet of eenzaamheid",
  "Wat je beter niet zegt, en wat je in plaats daarvan kunt doen",
  "Een spiekbriefje met zinnen om te sturen of te zeggen",
  "69 pagina's, direct in je inbox",
];

export function ErZijnBlock() {
  const product = useQuery(api.checkoutProducts.getBySlug, { slug: "er-zijn" });
  const [index, setIndex] = useState(0);
  // turn = het blad dat op dit moment omslaat ({from, dir}), null = stil
  const [turn, setTurn] = useState<{ from: number; dir: 1 | -1 } | null>(null);

  const prijs =
    product?.priceInCents != null
      ? new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(
          product.priceInCents / 100,
        )
      : "€17,00";

  const blader = (dir: 1 | -1) => {
    if (turn) return; // niet bladeren tijdens een animatie
    const volgende = (index + dir + SPREADS.length) % SPREADS.length;
    setTurn({ from: index, dir });
    setIndex(volgende);
  };

  return (
    <div className="my-10 rounded-2xl overflow-hidden border" style={{ background: "#faf7f4", borderColor: "#e8e1d9" }}>
      <style>{`
        @keyframes erzijn-turn-next {
          from { transform: rotateY(0deg); }
          to   { transform: rotateY(-178deg); }
        }
        @keyframes erzijn-turn-prev {
          from { transform: rotateY(0deg); }
          to   { transform: rotateY(178deg); }
        }
      `}</style>

      {/* Flipbook bovenaan */}
      <div className="px-5 pt-7 pb-6 flex flex-col items-center" style={{ background: "#f2ece5" }}>
        <div className="flex items-center gap-3 w-full justify-center">
          <button
            type="button"
            onClick={() => blader(-1)}
            aria-label="Vorige pagina"
            className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center border transition-colors hover:bg-white"
            style={{ background: "rgba(255,255,255,0.85)", borderColor: "rgba(160,148,136,0.35)" }}
          >
            <ChevronLeft size={18} style={{ color: "#8a8078" }} />
          </button>

          {/* Het boek: perspectief-stage met huidig blad onder, omslaand blad erboven */}
          <div className="flex-1 max-w-[460px]" style={{ perspective: "1600px" }}>
            <div className="relative w-full" style={{ transformStyle: "preserve-3d" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={SPREADS[index]}
                alt="Pagina uit het boekje Er Zijn"
                loading="lazy"
                decoding="async"
                className="w-full rounded-lg shadow-lg block"
                style={{ objectFit: "contain" }}
              />
              {turn && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={`${turn.from}-${turn.dir}`}
                  src={SPREADS[turn.from]}
                  alt=""
                  aria-hidden
                  className="absolute inset-0 w-full h-full rounded-lg shadow-xl block"
                  style={{
                    objectFit: "contain",
                    backfaceVisibility: "hidden",
                    transformOrigin: turn.dir === 1 ? "left center" : "right center",
                    animation: `${turn.dir === 1 ? "erzijn-turn-next" : "erzijn-turn-prev"} 0.6s ease-in-out forwards`,
                  }}
                  onAnimationEnd={() => setTurn(null)}
                />
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={() => blader(1)}
            aria-label="Volgende pagina"
            className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center border transition-colors hover:bg-white"
            style={{ background: "rgba(255,255,255,0.85)", borderColor: "rgba(160,148,136,0.35)" }}
          >
            <ChevronRight size={18} style={{ color: "#8a8078" }} />
          </button>
        </div>

        {/* Dots */}
        <div className="flex justify-center gap-1.5 mt-4">
          {SPREADS.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => !turn && setIndex(i)}
              aria-label={`Ga naar pagina ${i + 1}`}
              className="rounded-full transition-all"
              style={{
                width: i === index ? 18 : 6,
                height: 6,
                background: i === index ? "#6d84a8" : "rgba(160,148,136,0.4)",
              }}
            />
          ))}
        </div>
      </div>

      {/* Streep */}
      <div style={{ borderTop: "1px solid #e8e1d9" }} />

      {/* Productinfo onder de streep */}
      <div className="px-6 py-7 max-w-2xl mx-auto text-center">
        <p className="text-xs uppercase tracking-widest mb-1.5" style={{ color: "#a08c78", letterSpacing: "0.14em" }}>
          Digitaal boekje
        </p>
        <h3 className="text-2xl font-semibold mb-1" style={{ color: "#3d3530" }}>
          Er Zijn
        </h3>
        <p className="text-base mb-4" style={{ color: "#6d84a8" }}>
          Wat je zegt als je niet weet wat je moet zeggen
        </p>
        <p className="text-sm leading-relaxed mb-5 max-w-lg mx-auto" style={{ color: "#6b6460" }}>
          Iemand in je omgeving heeft verdriet, en je wilt er zijn. Maar wat zeg je dan? Dit boekje helpt je op weg.
        </p>

        <ul className="space-y-2 mb-6 text-left max-w-md mx-auto">
          {KERNPUNTEN.map((punt) => (
            <li key={punt} className="flex items-start gap-2.5 text-sm leading-relaxed" style={{ color: "#6b6460" }}>
              <Check size={16} className="shrink-0 mt-0.5" style={{ color: "#6d84a8" }} />
              <span>{punt}</span>
            </li>
          ))}
        </ul>

        <div className="flex items-center justify-center gap-3">
          <Link
            href="/betalen/er-zijn"
            className="inline-block text-white text-sm font-semibold px-6 py-3 rounded-xl transition-colors"
            style={{ background: "#6d84a8" }}
          >
            Download het boekje →
          </Link>
          <span className="text-base font-semibold" style={{ color: "#3d3530" }}>
            {prijs}
          </span>
        </div>
        <p className="text-xs mt-3" style={{ color: "#a08c78" }}>
          Eenmalige aankoop · Direct te downloaden
        </p>
      </div>
    </div>
  );
}
