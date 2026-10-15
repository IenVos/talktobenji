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
  "Concrete woorden die wél kloppen als iemand rouwt",
  "Een spiekbriefje met zinnen om te sturen of te zeggen",
  "Digitaal boekje, meteen na aankoop in je inbox",
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
      : "€17";

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

      <div className="flex flex-col sm:flex-row">
        {/* Flipbook */}
        <div className="sm:w-1/2 p-5 flex flex-col items-center justify-center" style={{ background: "#f2ece5" }}>
          <div className="relative flex items-center gap-2 w-full justify-center">
            <button
              type="button"
              onClick={() => blader(-1)}
              aria-label="Vorige pagina"
              className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center border transition-colors hover:bg-white"
              style={{ background: "rgba(255,255,255,0.85)", borderColor: "rgba(160,148,136,0.35)" }}
            >
              <ChevronLeft size={16} style={{ color: "#8a8078" }} />
            </button>

            {/* Het boek: perspectief-stage met het huidige blad onder en het omslaande blad erboven */}
            <div className="flex-1 max-w-[260px]" style={{ perspective: "1400px" }}>
              <div className="relative w-full" style={{ transformStyle: "preserve-3d" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={SPREADS[index]}
                  alt="Pagina uit het boekje Er Zijn"
                  loading="lazy"
                  decoding="async"
                  className="w-full rounded-lg shadow-md block"
                  style={{ objectFit: "contain" }}
                />
                {turn && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={`${turn.from}-${turn.dir}`}
                    src={SPREADS[turn.from]}
                    alt=""
                    aria-hidden
                    className="absolute inset-0 w-full h-full rounded-lg shadow-lg block"
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
              className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center border transition-colors hover:bg-white"
              style={{ background: "rgba(255,255,255,0.85)", borderColor: "rgba(160,148,136,0.35)" }}
            >
              <ChevronRight size={16} style={{ color: "#8a8078" }} />
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

        {/* Productinfo */}
        <div className="sm:w-1/2 p-6 flex flex-col justify-center">
          <p className="text-xs uppercase tracking-widest mb-1" style={{ color: "#a08c78", letterSpacing: "0.12em" }}>
            Digitaal boekje
          </p>
          <h3 className="text-2xl font-semibold mb-3" style={{ color: "#3d3530" }}>
            Er Zijn
          </h3>
          <ul className="space-y-2 mb-5">
            {KERNPUNTEN.map((punt) => (
              <li key={punt} className="flex items-start gap-2 text-sm leading-relaxed" style={{ color: "#6b6460" }}>
                <Check size={15} className="shrink-0 mt-0.5" style={{ color: "#6d84a8" }} />
                <span>{punt}</span>
              </li>
            ))}
          </ul>
          <div className="flex items-center gap-3">
            <Link
              href="/betalen/er-zijn"
              className="inline-block text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
              style={{ background: "#6d84a8" }}
            >
              Ik wil Er Zijn →
            </Link>
            <span className="text-base font-semibold" style={{ color: "#3d3530" }}>
              {prijs}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
