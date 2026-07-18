"use client";

/**
 * Kennismaking-tour met Niet Alleen, direct na Even Houvast ("En nu?"). Een rustige
 * swipe langs de echte schermen, geen verkoop. Begin- en slotscherm op een lucht-
 * achtergrond (naadloos na "En nu?"). Op het ademoefening-scherm beweegt de cirkel.
 * Bereikbaar via de "En nu?"-knop: /niet-alleen/tour?type=huisdier&n=Anna&e=..
 * Zacht slot linkt naar de brugpagina, met naam en e-mail mee.
 */

import { Suspense, useRef, useState } from "react";
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

  const brugUrl =
    `/niet-alleen/waarom?type=${type}` +
    (naam ? `&n=${encodeURIComponent(naam)}` : "") +
    (email ? `&e=${encodeURIComponent(email)}` : "");

  return (
    <div
      className="stage"
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
        .stage{ position:relative; width:100%; max-width:520px; margin:0 auto; height:100dvh; overflow:hidden; background:#e7ded1;
          font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif; color:#3d3530; user-select:none; touch-action:pan-y; }
        .dots{ position:absolute; top:14px; left:16px; right:16px; z-index:6; display:flex; gap:6px; }
        .dots i{ flex:1; height:3px; border-radius:3px; background:rgba(70,60,50,.22); }
        .dots i.on{ background:rgba(60,50,40,.8); }
        .track{ display:flex; height:100%; transition:transform .4s cubic-bezier(.4,0,.2,1); }
        .slide{ min-width:100%; height:100%; overflow:hidden; display:flex; flex-direction:column; align-items:center; justify-content:center; padding:34px 12px 46px; gap:13px; }
        .slide.lucht{ background:${SKY}; }
        .shot{ flex:0 1 auto; max-height:88%; display:flex; justify-content:center; align-items:center; }
        .shot img{ max-height:100%; max-width:100%; width:auto; height:auto; border-radius:20px; box-shadow:0 16px 50px rgba(50,40,32,.28); display:block; }
        .oefwrap{ position:relative; display:flex; max-height:100%; overflow:hidden; }
        .oefcover{ position:absolute; left:50%; top:78%; width:22%; aspect-ratio:1; transform:translate(-50%,-50%); background:#efeae4; border-radius:50%; }
        .oefcirkel{ position:absolute; left:50%; top:78%; width:12%; aspect-ratio:1; transform:translate(-50%,-50%) scale(.55); border-radius:50%; background:rgba(109,132,168,.45); box-shadow:0 0 14px 4px rgba(109,132,168,.16); animation:adem 12s ease-in-out infinite; }
        @keyframes adem{ 0%{transform:translate(-50%,-50%) scale(.55);opacity:.65} 45%{transform:translate(-50%,-50%) scale(1);opacity:.9} 55%{transform:translate(-50%,-50%) scale(1);opacity:.9} 100%{transform:translate(-50%,-50%) scale(.55);opacity:.65} }
        .cap{ font-size:16px; line-height:1.45; color:#6b6460; text-align:center; text-wrap:balance; max-width:30ch; }
        .kaart{ background:#fff; border-radius:26px; padding:40px 30px; box-shadow:0 18px 54px rgba(50,52,60,.20); max-width:340px; display:flex; flex-direction:column; align-items:center; gap:9px; text-align:center; }
        .titel{ font-family:'Iowan Old Style','Palatino Linotype',Palatino,Georgia,serif; font-size:27px; line-height:1.2; color:#3d3530; }
        .sub{ font-size:16px; line-height:1.55; color:#6b6460; text-wrap:pretty; max-width:26ch; }
        .zacht{ margin-top:22px; display:inline-block; color:#9a8168; font-weight:600; font-size:15px; text-decoration:none; border-bottom:1.5px solid rgba(154,129,104,.4); padding-bottom:2px; }
        .zone{ position:absolute; top:40px; bottom:0; z-index:4; width:30%; cursor:pointer; }
        .zone.l{ left:0; } .zone.r{ right:0; width:70%; }
        .pijl{ position:absolute; bottom:14px; z-index:6; background:none; border:none; cursor:pointer; color:rgba(70,60,50,.4); font-size:26px; line-height:1; padding:6px 12px; }
        .pijl.p{ left:6px; } .pijl.n{ right:6px; }
        .pijl:disabled{ opacity:0; pointer-events:none; }
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

      {i < totaal - 1 && (
        <>
          <div className="zone l" onClick={() => toon(i - 1)} />
          <div className="zone r" onClick={() => toon(i + 1)} />
        </>
      )}
      <button className="pijl p" onClick={() => toon(i - 1)} disabled={i === 0} aria-label="Vorige">‹</button>
      <button className="pijl n" onClick={() => toon(i + 1)} disabled={i === totaal - 1} aria-label="Volgende">›</button>
    </div>
  );
}

export default function TourPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", background: "#e7ded1" }} />}>
      <TourInner />
    </Suspense>
  );
}
