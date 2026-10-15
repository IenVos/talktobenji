"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

// De flipbook-pagina's van het Er Zijn-boekje, gerenderd uit de echte PDF
// (cover → "verdriet leer je dragen" → de hoofdstukken → spiekbriefje → afsluiter).
const PAGINAS = [
  "/images/er-zijn-boek-0.jpg",
  "/images/er-zijn-boek-1.jpg",
  "/images/er-zijn-boek-2.jpg",
  "/images/er-zijn-boek-3.jpg",
  "/images/er-zijn-boek-4.jpg",
  "/images/er-zijn-boek-5.jpg",
  "/images/er-zijn-boek-6.jpg",
  "/images/er-zijn-boek-7.jpg",
  "/images/er-zijn-boek-8.jpg",
];

/** Bladerend boekje met page-turn-animatie. Gedeeld tussen het blog-productblok
 *  en de checkout, zodat de bezoeker dezelfde kaart herkent. */
export function ErZijnFlipbook({ maxWidth = 460 }: { maxWidth?: number }) {
  const [index, setIndex] = useState(0);
  // turn = het blad dat op dit moment omslaat ({from, dir}), null = stil
  const [turn, setTurn] = useState<{ from: number; dir: 1 | -1 } | null>(null);

  const blader = (dir: 1 | -1) => {
    if (turn) return; // niet bladeren tijdens een animatie
    const volgende = (index + dir + PAGINAS.length) % PAGINAS.length;
    setTurn({ from: index, dir });
    setIndex(volgende);
  };

  return (
    <div className="flex flex-col items-center">
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
        <div className="flex-1" style={{ maxWidth, perspective: "1600px" }}>
          <div className="relative w-full" style={{ transformStyle: "preserve-3d" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={PAGINAS[index]}
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
                src={PAGINAS[turn.from]}
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
      <div className="flex justify-center gap-1.5 mt-4 flex-wrap">
        {PAGINAS.map((_, i) => (
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
  );
}
