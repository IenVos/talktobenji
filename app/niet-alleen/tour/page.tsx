"use client";

/**
 * Kennismaking-tour met Niet Alleen, direct na Even Houvast ("En nu?"). Een rustige
 * fullscreen swipe langs de echte schermen, geen verkoop. Begin/slot op lucht-
 * achtergrond (naadloos na "En nu?"). Op het ademoefening-scherm beweegt de cirkel.
 * Bereikbaar via de "En nu?"-knop: /niet-alleen/tour?type=huisdier&n=Anna&e=..
 * Zacht slot linkt naar de brugpagina, met naam en e-mail mee.
 */

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { normVerlies } from "@/lib/nietAlleenTypes";

const B = "/images/na-tour";
const SLIDES: { img: string; cap: string; oef?: boolean }[] = [
  { img: `${B}/mail.jpg`, cap: "Elke ochtend een klein bericht in je mailbox, alleen voor jou." },
  { img: `${B}/dag1.jpg`, cap: "Maak het je eigen plek: een profielfoto, je woorden geschreven of ingesproken, en foto's erbij." },
  { img: `${B}/mail2.jpg`, cap: "Elke dag een andere vraag, die met je meebeweegt." },
  { img: `${B}/dag2oef.jpg`, cap: "Op zware dagen een oefening, om even te landen.", oef: true },
  { img: `${B}/dag2foto.jpg`, cap: "Jouw herinneringen, veilig bewaard." },
  { img: `${B}/dagboek.jpg`, cap: "Aan het eind is alles van jou, om te bewaren, downloaden of printen." },
];

const SKY = "linear-gradient(to bottom,#b5c1cf 0%,#cbd1d5 38%,#d8d4ca 66%,#cdc0a9 100%)";

function TourInner() {
  const params = useSearchParams();
  const type = normVerlies(params?.get("type"));
  const naam = (params?.get("n") || "").trim();
  const email = (params?.get("e") || "").trim();
  const voornaam = naam.split(" ")[0];

  const totaal = SLIDES.length + 2; // opening + slides + slot
  const [i, setI] = useState(0);
  const x0 = useRef<number | null>(null);
  const toon = (n: number) => setI(Math.max(0, Math.min(totaal - 1, n)));

  // Fullscreen-overname: geen paginascroll of overscroll (voorkomt de "blauwe pagina").
  useEffect(() => {
    const b = document.body.style;
    const h = document.documentElement.style;
    const prev = { bo: b.overflow, ho: h.overflow, ov: (h as any).overscrollBehavior };
    b.overflow = "hidden";
    h.overflow = "hidden";
    (h as any).overscrollBehavior = "none";
    return () => {
      b.overflow = prev.bo;
      h.overflow = prev.ho;
      (h as any).overscrollBehavior = prev.ov;
    };
  }, []);

  const brugUrl =
    `/niet-alleen/waarom?type=${type}` +
    (naam ? `&n=${encodeURIComponent(naam)}` : "") +
    (email ? `&e=${encodeURIComponent(email)}` : "");

  return (
    <div className="tour-backdrop">
    <div
      className="tour-stage"
      onTouchStart={(e) => (x0.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (x0.current === null) return;
        const dx = e.changedTouches[0].clientX - x0.current;
        if (dx < -45) toon(i + 1);
        else if (dx > 45) toon(i - 1);
        x0.current = null;
      }}
    >
      <style>{`
        .tour-backdrop{ position:fixed; inset:0; z-index:1000; display:flex; justify-content:center; overflow:hidden; overscroll-behavior:none; background:#cfc7b8; }
        .tour-stage{ position:relative; width:100%; max-width:440px; height:100dvh; overflow:hidden; touch-action:none;
          background:#e7ded1; box-shadow:0 0 50px rgba(60,54,44,.28);
          font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif; color:#3d3530; user-select:none; }
        .tour-stage .dots{ position:absolute; top:14px; left:16px; right:16px; z-index:6; display:flex; gap:6px; }
        .tour-stage .dots i{ flex:1; height:3px; border-radius:3px; background:rgba(70,60,50,.22); }
        .tour-stage .dots i.on{ background:rgba(60,50,40,.8); }
        .tour-stage .track{ display:flex; height:100%; transition:transform .4s cubic-bezier(.4,0,.2,1); }
        .tour-stage .slide{ min-width:100%; height:100%; overflow:hidden; display:flex; flex-direction:column; align-items:center; justify-content:center; padding:30px 12px 40px; gap:12px; }
        .tour-stage .slide.lucht{ background:${SKY}; }
        .tour-stage .shot{ flex:0 1 auto; width:min(92vw,400px); max-height:88%; overflow:hidden; border-radius:18px; box-shadow:0 14px 44px rgba(50,40,32,.26); }
        .tour-stage .shot img{ width:100%; height:auto; display:block; }
        .tour-stage .oefwrap{ position:relative; width:100%; }
        .tour-stage .oefcover{ position:absolute; left:50%; top:86%; width:28%; aspect-ratio:1; transform:translate(-50%,-50%); background:#efeae4; border-radius:50%; }
        .tour-stage .oefcirkel{ position:absolute; left:50%; top:86%; width:15%; aspect-ratio:1; transform:translate(-50%,-50%) scale(.55); border-radius:50%; background:rgba(109,132,168,.45); box-shadow:0 0 14px 4px rgba(109,132,168,.16); animation:tour-adem 12s ease-in-out infinite; }
        @keyframes tour-adem{ 0%{transform:translate(-50%,-50%) scale(.55);opacity:.65} 45%{transform:translate(-50%,-50%) scale(1);opacity:.9} 55%{transform:translate(-50%,-50%) scale(1);opacity:.9} 100%{transform:translate(-50%,-50%) scale(.55);opacity:.65} }
        .tour-stage .cap{ font-size:16px; line-height:1.45; color:#6b6460; text-align:center; text-wrap:balance; max-width:30ch; padding:0 8px; }
        .tour-stage .kaart{ background:#fff; border-radius:26px; padding:40px 30px; box-shadow:0 18px 54px rgba(50,52,60,.20); max-width:340px; display:flex; flex-direction:column; align-items:center; gap:9px; text-align:center; }
        .tour-stage .titel{ font-family:'Iowan Old Style','Palatino Linotype',Palatino,Georgia,serif; font-size:27px; line-height:1.2; color:#3d3530; }
        .tour-stage .sub{ font-size:16px; line-height:1.55; color:#6b6460; text-wrap:pretty; max-width:26ch; }
        .tour-stage .zacht{ margin-top:22px; display:inline-block; color:#9a8168; font-weight:600; font-size:15px; text-decoration:none; border-bottom:1.5px solid rgba(154,129,104,.4); padding-bottom:2px; }
        .tour-stage .zone{ position:absolute; top:40px; bottom:60px; z-index:4; width:32%; cursor:pointer; }
        .tour-stage .zone.l{ left:0; } .tour-stage .zone.r{ right:0; width:68%; }
        .tour-stage .pijl{ position:absolute; bottom:14px; z-index:6; background:none; border:none; cursor:pointer; color:rgba(70,60,50,.45); font-size:30px; line-height:1; padding:6px 12px; }
        .tour-stage .pijl.p{ left:6px; } .tour-stage .pijl.n{ right:6px; }
        .tour-stage .pijl:disabled{ opacity:0; pointer-events:none; }
      `}</style>

      <div className="dots">
        {Array.from({ length: totaal }, (_, k) => (
          <i key={k} className={k <= i ? "on" : ""} />
        ))}
      </div>

      <div className="track" style={{ transform: `translateX(${-i * 100}%)` }}>
        {/* Opening */}
        <div className="slide lucht">
          <div className="kaart">
            <p className="titel" style={{ textWrap: "normal" } as React.CSSProperties}>
              {voornaam ? (<>Je bent niet de enige,<br />{voornaam}.</>) : "Je bent niet de enige."}
            </p>
            <p className="sub">Je brief komt eraan. Anderen gingen je voor, en vonden hier de ruimte die ze nergens anders kregen.</p>
          </div>
        </div>

        {/* Schermen */}
        {SLIDES.map((s, k) => (
          <div className="slide" key={k}>
            <div className="shot">
              {s.oef ? (
                <div className="oefwrap">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={s.img} alt="" />
                  <span className="oefcover" />
                  <span className="oefcirkel" />
                </div>
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={s.img} alt="" />
              )}
            </div>
            <p className="cap">{s.cap}</p>
          </div>
        ))}

        {/* Zacht slot */}
        <div className="slide lucht">
          <div className="kaart">
            <p className="titel">Dit is Niet Alleen.</p>
            <p className="sub">Er is geen haast. Je brief komt zo in je mailbox, en Niet Alleen is er wanneer jij er klaar voor bent.</p>
            <Link className="zacht" href={brugUrl}>Rustig meer lezen →</Link>
          </div>
        </div>
      </div>

      {/* Tik-zones uit op het slotscherm, anders liggen ze over de "meer lezen"-link */}
      {i < totaal - 1 && (
        <>
          <div className="zone l" onClick={() => toon(i - 1)} />
          <div className="zone r" onClick={() => toon(i + 1)} />
        </>
      )}
      <button className="pijl p" onClick={() => toon(i - 1)} disabled={i === 0} aria-label="Vorige">‹</button>
      <button className="pijl n" onClick={() => toon(i + 1)} disabled={i === totaal - 1} aria-label="Volgende">›</button>
    </div>
    </div>
  );
}

export default function TourPage() {
  return (
    <Suspense fallback={<div style={{ position: "fixed", inset: 0, background: "#e7ded1" }} />}>
      <TourInner />
    </Suspense>
  );
}
