"use client";

import Image from "next/image";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { ExternalLink } from "lucide-react";

const VASTE_ITEMS = [
  {
    id: "niet-alleen",
    title: "Niet Alleen",
    omschrijving: "30 dagen. Elke dag één vraag. Een plek die van jou is. Voor wie iemand of iets mist.",
    prijs: "€37",
    knop: "Start mijn reis",
    link: "https://talktobenji.kennis.shop/pay/niet-alleen",
    afbeelding: "/images/niet-alleen-meer.png",
  },
  {
    id: "troostende-woorden",
    title: "Troostende woorden",
    omschrijving: "Een boekje vol woorden van bemoediging. Voor als je niet weet wat je zeggen moet — aan jezelf of aan een ander.",
    prijs: null,
    knop: "Aanschaffen",
    link: "https://talktobenji.kennis.shop/pay/troostende-woorden",
    afbeelding: "/images/troostende-woorden-cover.png",
  },
  {
    id: "woorden-die-omarmen",
    title: "Woorden die omarmen",
    omschrijving: "Een gratis verzameling van troostende en steunende woorden. Gewoon om te lezen, te bewaren, of door te sturen.",
    prijs: "Gratis",
    knop: "Lees het hier",
    link: "https://heyzine.com/flip-book/1b15e11883.html",
    afbeelding: null,
  },
];

function ProductKaart({ item }: { item: typeof VASTE_ITEMS[0] }) {
  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: "rgba(255,255,255,0.88)", boxShadow: "0 2px 16px rgba(0,0,0,0.07)" }}
    >
      {item.afbeelding && (
        <div className="w-full overflow-hidden" style={{ maxHeight: "200px" }}>
          <Image
            src={item.afbeelding}
            alt={item.title}
            width={600}
            height={200}
            className="w-full object-cover"
            style={{ maxHeight: "200px" }}
          />
        </div>
      )}
      <div className="p-5">
        <h2 className="text-base font-semibold mb-1" style={{ color: "#3d3530" }}>
          {item.title}
        </h2>
        <p className="text-sm leading-relaxed mb-4" style={{ color: "#6b6460" }}>
          {item.omschrijving}
        </p>
        <div className="flex items-center gap-3">
          {item.prijs && (
            <span className="text-sm font-medium" style={{ color: "#3d3530" }}>
              {item.prijs}
            </span>
          )}
          <a
            href={item.link}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium text-white"
            style={{ background: "#6d84a8" }}
          >
            {item.knop}
            <ExternalLink size={13} />
          </a>
        </div>
      </div>
    </div>
  );
}

export default function VoorJouPage() {
  const dynamischeItems = useQuery(api.onderweg.listVoorJou, {});

  return (
    <div style={{ minHeight: "100vh", background: "#fdf9f4", position: "relative" }}>

      {/* Achtergrond */}
      <div style={{ position: "fixed", inset: 0, zIndex: 0 }}>
        <Image src="/images/achtergrond.png" alt="" fill className="object-cover" priority />
        <div style={{ position: "absolute", inset: 0, background: "rgba(253,249,244,0.82)" }} />
      </div>

      <div style={{ position: "relative", zIndex: 1 }}>

        {/* Logo */}
        <div className="px-5 pt-6 pb-2">
          <a href="https://talktobenji.com">
            <Image
              src="/images/benji-logo-2.png"
              alt="Talk To Benji"
              width={32}
              height={32}
              className="opacity-60 hover:opacity-80 transition-opacity"
            />
          </a>
        </div>

        {/* Header */}
        <section className="px-5 pt-10 pb-8 text-center">
          <div className="max-w-md mx-auto">
            <p className="text-xs uppercase tracking-widest mb-3 font-medium" style={{ color: "#8a8078", letterSpacing: "0.14em" }}>
              Van Talk To Benji
            </p>
            <h1 className="text-3xl sm:text-4xl font-semibold mb-3" style={{ color: "#3d3530" }}>
              Voor jou
            </h1>
            <p className="text-sm leading-relaxed" style={{ color: "#6b6460" }}>
              Producten en programma's die je kunnen helpen als je iets moeilijks meemaakt.
            </p>
          </div>
        </section>

        {/* Kaders */}
        <section className="px-5 pb-20">
          <div className="max-w-lg mx-auto space-y-4">

            {/* Vaste producten */}
            {VASTE_ITEMS.map((item) => (
              <ProductKaart key={item.id} item={item} />
            ))}

            {/* Dynamische items via admin */}
            {dynamischeItems?.map((item) => (
              <div
                key={item._id}
                className="rounded-2xl overflow-hidden"
                style={{ background: "rgba(255,255,255,0.88)", boxShadow: "0 2px 16px rgba(0,0,0,0.07)" }}
              >
                {item.imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.imageUrl}
                    alt={item.title ?? ""}
                    className="w-full object-cover"
                    style={{ maxHeight: "200px" }}
                  />
                )}
                <div className="p-5">
                  {item.title && (
                    <h2 className="text-base font-semibold mb-1" style={{ color: "#3d3530" }}>
                      {item.title}
                    </h2>
                  )}
                  {item.content && (
                    <p className="text-sm leading-relaxed mb-4" style={{ color: "#6b6460" }}>
                      {item.content}
                    </p>
                  )}
                  {item.paymentUrl && (
                    <div className="flex items-center gap-3">
                      {item.priceCents != null && item.priceCents > 0 && (
                        <span className="text-sm font-medium" style={{ color: "#3d3530" }}>
                          €{(item.priceCents / 100).toFixed(2).replace(".", ",")}
                        </span>
                      )}
                      <a
                        href={item.paymentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium text-white"
                        style={{ background: "#6d84a8" }}
                      >
                        {item.buttonLabel ?? "Bekijken"}
                        <ExternalLink size={13} />
                      </a>
                    </div>
                  )}
                </div>
              </div>
            ))}

          </div>
        </section>

        {/* Footer */}
        <footer className="px-5 py-8 text-center" style={{ borderTop: "1px solid rgba(0,0,0,0.08)" }}>
          <p className="text-xs" style={{ color: "#8a8078" }}>
            Vragen?{" "}
            <a href="mailto:contactmetien@talktobenji.com" style={{ color: "#6d84a8" }}>
              contactmetien@talktobenji.com
            </a>
          </p>
        </footer>

      </div>
    </div>
  );
}
