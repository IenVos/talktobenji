"use client";

import { useState, useEffect, useCallback } from "react";
import "./blokPagina.scoped.css";

/* ── Mini-markdown: **vet** → <b> en [tekst](url) → link (met optionele boldClass) ── */
function Rich({ text, boldClass }: { text: string; boldClass?: string }) {
  const src = text || "";
  const nodes: React.ReactNode[] = [];
  const re = /\*\*([^*]+)\*\*|\[([^\]]+)\]\(([^)\s]+)\)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let k = 0;
  while ((m = re.exec(src)) !== null) {
    if (m.index > last) nodes.push(<span key={k++}>{src.slice(last, m.index)}</span>);
    if (m[1] !== undefined) {
      nodes.push(boldClass ? <span key={k++} className={boldClass}>{m[1]}</span> : <b key={k++}>{m[1]}</b>);
    } else {
      const url = (m[3] || "").trim();
      const extern = /^https?:\/\//i.test(url);
      nodes.push(
        <a key={k++} href={url} {...(extern ? { target: "_blank", rel: "noreferrer" } : {})}>{m[2]}</a>
      );
    }
    last = re.lastIndex;
  }
  if (last < src.length) nodes.push(<span key={k++}>{src.slice(last)}</span>);
  return <>{nodes}</>;
}

/* Titel met \n → regels. Elke regel is een eigen block zodat text-wrap:balance
   per regel werkt (geen los woord op een nieuwe regel; balance werkt niet over
   een harde <br> heen). */
function MultiTitle({ text }: { text: string }) {
  const lines = (text || "").split("\n");
  return (
    <>
      {lines.map((l, i) => (
        <span key={i} style={{ display: "block" }}>{l}</span>
      ))}
    </>
  );
}

type Block = any;

/* ── Accentkleur: één hex → afgeleide tinten (sterk/wash/leaf) als CSS-vars ── */
function hexToRgb(hex: string): [number, number, number] | null {
  let h = (hex || "").trim().replace(/^#/, "");
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  if (!/^[0-9a-fA-F]{6}$/.test(h)) return null;
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}
function toHex([r, g, b]: [number, number, number]): string {
  const c = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, "0");
  return `#${c(r)}${c(g)}${c(b)}`;
}
// Meng kleur met wit (amount>0) of zwart, amount 0..1.
function mix(rgb: [number, number, number], target: [number, number, number], amount: number): [number, number, number] {
  return [
    rgb[0] + (target[0] - rgb[0]) * amount,
    rgb[1] + (target[1] - rgb[1]) * amount,
    rgb[2] + (target[2] - rgb[2]) * amount,
  ];
}
// Bouwt een <style>-inhoud die ALLE tinten (accent + achtergrond) op de accentkleur
// afstemt, zowel licht als donker. Gescoped op `.bpg[data-accent]` zodat het altijd
// wint van de basis-CSS (hogere specificiteit), ook binnen de dark-mode media-query.
function accentCss(hex?: string | null): string | null {
  const rgb = hex ? hexToRgb(hex) : null;
  if (!rgb) return null;
  const W: [number, number, number] = [255, 255, 255];
  const K: [number, number, number] = [0, 0, 0];
  const m = (t: [number, number, number], a: number) => toHex(mix(rgb, t, a));
  const licht = [
    `--accent:${toHex(rgb)}`,
    `--accent-strong:${m(K, 0.2)}`,
    `--accent-wash:${m(W, 0.86)}`,
    `--leaf:${m(W, 0.28)}`,
    `--ground:${m(W, 0.9)}`,   // pagina-achtergrond: heel lichte tint van de accentkleur
    `--paper:${m(W, 0.94)}`,
    `--line:${m(W, 0.74)}`,
    `--line-soft:${m(W, 0.87)}`,
  ].join(";");
  const donker = [
    `--accent:${m(W, 0.3)}`,
    `--accent-strong:${m(W, 0.5)}`,
    `--accent-wash:${m(K, 0.8)}`,
    `--leaf:${m(W, 0.45)}`,
    `--ground:${m(K, 0.88)}`,
    `--paper:${m(K, 0.85)}`,
    `--surface:${m(K, 0.82)}`,
    `--line:${m(K, 0.72)}`,
    `--line-soft:${m(K, 0.8)}`,
  ].join(";");
  return `.bpg[data-accent]{${licht}}@media (prefers-color-scheme:dark){.bpg[data-accent]{${donker}}}`;
}

// Resolveert een ctaUrl: de sentinel "intake" wijst naar de eigen intake-pagina.
function makeHref(intakePath: string) {
  return (u?: string) => (u === "intake" ? intakePath : u || "#");
}

/* ── Account-carousel met lightbox ── */
function AccountCarousel({ shots }: { shots: { img: string; label: string }[] }) {
  const [i, setI] = useState(0);
  const [open, setOpen] = useState(false);
  const n = shots.length;
  const go = useCallback((to: number) => setI(((to % n) + n) % n), [n]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
      else if (e.key === "ArrowLeft") go(i - 1);
      else if (e.key === "ArrowRight") go(i + 1);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, i, go]);

  if (n === 0) return null;
  const cur = shots[i];

  return (
    <div className="shot-frame">
      <div className="shot-stage">
        <img src={cur.img} alt={cur.label} onClick={() => setOpen(true)} />
        <span className="shot-zoom">&#10530; Klik om te vergroten</span>
      </div>
      <div className="shot-bar">
        <span className="shot-cap">{cur.label}</span>
        <div className="shot-nav">
          <button className="shot-btn" type="button" aria-label="Vorige afbeelding" onClick={() => go(i - 1)}>&lsaquo;</button>
          <button className="shot-btn" type="button" aria-label="Volgende afbeelding" onClick={() => go(i + 1)}>&rsaquo;</button>
        </div>
      </div>
      <div className="shot-dots">
        {shots.map((_, idx) => (
          <button key={idx} type="button" className={"shot-dot" + (idx === i ? " on" : "")} aria-label={`Naar afbeelding ${idx + 1}`} onClick={() => go(idx)} />
        ))}
      </div>

      <div className={"lb" + (open ? " open" : "")} role="dialog" aria-modal="true" aria-label="Vergrote afbeelding" onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}>
        <button className="lb-x" type="button" aria-label="Sluiten" onClick={(e) => { e.stopPropagation(); setOpen(false); }}>&times;</button>
        <button className="lb-arrow prev" type="button" aria-label="Vorige" onClick={(e) => { e.stopPropagation(); go(i - 1); }}>&lsaquo;</button>
        <img src={cur.img} alt={cur.label} onClick={(e) => { e.stopPropagation(); go(i + 1); }} />
        <button className="lb-arrow next" type="button" aria-label="Volgende" onClick={(e) => { e.stopPropagation(); go(i + 1); }}>&rsaquo;</button>
        <div className="lb-cap">{cur.label}</div>
      </div>
    </div>
  );
}

/* ── Achtergrond-tokens ── */
function sectionStyle(achtergrond?: string): React.CSSProperties | undefined {
  if (achtergrond === "paper") return { background: "var(--paper)" };
  if (achtergrond === "wit") return { background: "var(--surface)" };
  return undefined;
}

/* ── Losse blok-renderers ── */
function renderBlock(b: Block, key: string, href: (u?: string) => string) {
  const t = b.type;

  if (t === "header") {
    return (
      <header className="site-head" key={key}>
        <div className="wrap">
          <a href="/" aria-label="Naar de homepagina"
            style={{ display: "flex", alignItems: "center", gap: ".6rem", textDecoration: "none", color: "inherit" }}>
            {b.logo && <img className="logo" src={b.logo} alt={`${b.merk || "Talk To Benji"} logo`} />}
            <span className="brand">{b.merk}{b.sub && <span className="brand-sub"> &middot; {b.sub}</span>}</span>
          </a>
        </div>
      </header>
    );
  }

  if (t === "hero") {
    return (
      <div className="hero" key={key}>
        <div className="wrap">
          {b.eyebrow && <p className="eyebrow">{b.eyebrow}</p>}
          <h1>{b.titel1}{b.titel2 && <><br /><span className="soft">{b.titel2}</span></>}</h1>
          {(b.body || []).map((p: any, i: number) => (
            <p key={i} className={p.soort === "whisper" ? "whisper" : p.soort === "thought" ? "thought" : "lead"}><Rich text={p.tekst} /></p>
          ))}
          {b.ctaText && (
            <div className="cta-wrap">
              <a className="btn" href={href(b.ctaUrl)}>{b.ctaText} <span className="arrow">&rarr;</span></a>
              {b.micro && <p className="micro">{b.micro}</p>}
            </div>
          )}
          {b.facts && <p className="facts"><Rich text={b.facts} /></p>}
        </div>
      </div>
    );
  }

  if (t === "herkenning") {
    return (
      <section key={key} style={sectionStyle(b.achtergrond)}>
        <div className="wrap">
          {b.eyebrow && <p className="eyebrow">{b.eyebrow}</p>}
          {b.titel && <h2 className="sec-h">{b.titel}</h2>}
          {b.lead && <p className="lead"><Rich text={b.lead} /></p>}
          {b.voices?.length > 0 && (
            <ul className="voices">{b.voices.map((v: string, i: number) => <li key={i}><Rich text={v} /></li>)}</ul>
          )}
          {b.pull && <p className="pull"><Rich text={b.pull} /></p>}
        </div>
      </section>
    );
  }

  if (t === "band" || t === "final") {
    const isFinal = t === "final";
    return (
      <div className={"band" + (isFinal ? " final" : "")} key={key}>
        <div className="wrap">
          {b.eyebrow && <p className="eyebrow">{b.eyebrow}</p>}
          {b.titel && <h2><MultiTitle text={b.titel} /></h2>}
          {b.lead && <p className="lead"><Rich text={b.lead} /></p>}
          {b.stack?.length > 0 && (
            <ul className="stack">{b.stack.map((s: string, i: number) => <li key={i}><Rich text={s} /></li>)}</ul>
          )}
          {b.kicker && <p className="kicker"><Rich text={b.kicker} boldClass="hl" /></p>}
          {b.sub && <p className="sub"><Rich text={b.sub} /></p>}
          {isFinal && b.ctaText && (
            <div className="cta-wrap">
              <a className="btn" href={href(b.ctaUrl)}>{b.ctaText} <span className="arrow">&rarr;</span></a>
              {b.micro && <p className="micro">{b.micro}</p>}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (t === "kern") {
    return (
      <section className="kern" key={key} style={sectionStyle(b.achtergrond)}>
        <div className="wrap">
          {b.eyebrow && <p className="eyebrow">{b.eyebrow}</p>}
          {b.titel && <h2 className="sec-h"><MultiTitle text={b.titel} /></h2>}
          {b.naastLabel && <p className="lead" style={{ marginTop: "1.3rem" }}><strong>{b.naastLabel}</strong></p>}
          {b.naast?.length > 0 && (
            <ul className="naast">{b.naast.map((s: string, i: number) => <li key={i}><Rich text={s} /></li>)}</ul>
          )}
          {b.slot && <p className="lead"><Rich text={b.slot} /></p>}
        </div>
      </section>
    );
  }

  if (t === "cadence") {
    const weken = b.timelineWeken || 8;
    const start: number[] = b.timelineStart || [];
    const gesprek: number[] = b.timelineGesprek || [];
    return (
      <section key={key} style={sectionStyle(b.achtergrond)}>
        <div className="wrap">
          <div className="callout">
            {b.eyebrow && <p className="eyebrow">{b.eyebrow}</p>}
            {b.titel && <h2>{b.titel}</h2>}
            {b.para1 && <p className="lead"><Rich text={b.para1} /></p>}
            {b.para2 && <p className="lead"><Rich text={b.para2} /></p>}
            {b.layersHead && <p className="layers-head">{b.layersHead}</p>}
            {b.layers?.length > 0 && (
              <ul className="layers">
                {b.layers.map((l: any, i: number) => (
                  <li key={i} className={l.kleur === "amber" ? "amber" : l.kleur === "ring" ? "kennismaking" : ""}>
                    <span className="when">{l.badge}</span>
                    <span className="lh">{l.lh}</span>
                    {l.lb && <span className="lb">{l.lb}</span>}
                  </li>
                ))}
              </ul>
            )}
            {b.foot && <p className="lead" style={{ marginTop: ".8rem" }}><Rich text={b.foot} boldClass="hl" /></p>}
            <div className="wtl" aria-hidden="true">
              <div className="wtl-grid">
                {Array.from({ length: weken }).map((_, idx) => {
                  const wk = idx + 1;
                  const cls = gesprek.includes(wk) ? "wtl-col gesprek" : start.includes(wk) ? "wtl-col start" : "wtl-col";
                  return (
                    <div key={idx} className={cls}>
                      <span className="wtl-dot" />
                      <span className="wtl-wk">wk {wk}</span>
                    </div>
                  );
                })}
              </div>
              <div className="wtl-base" />
            </div>
            {b.legend?.length > 0 && (
              <div className="wtl-legend">
                {b.legend.map((lg: any, i: number) => (
                  <span className="lg" key={i}>
                    <span className={lg.soort === "ring" ? "lg-ring" : lg.soort === "bar" ? "lg-bar" : "lg-dot"} /> {lg.label}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    );
  }

  if (t === "stappen") {
    return (
      <section key={key} style={sectionStyle(b.achtergrond)}>
        <div className="wrap">
          {b.eyebrow && <p className="eyebrow">{b.eyebrow}</p>}
          {b.titel && <h2 className="sec-h">{b.titel}</h2>}
          <ol className="steps">
            {(b.steps || []).map((s: any, i: number) => (
              <li key={i}>
                <p className="st-h">{s.kop}</p>
                <p className="st-b"><Rich text={s.tekst} /></p>
              </li>
            ))}
          </ol>
        </div>
      </section>
    );
  }

  if (t === "ditkrijgje") {
    return (
      <section key={key} style={sectionStyle(b.achtergrond)}>
        <div className="wrap">
          {b.eyebrow && <p className="eyebrow">{b.eyebrow}</p>}
          {b.titel && <h2 className="sec-h">{b.titel}</h2>}
          <ul className="incl">
            {(b.items || []).map((it: any, i: number) => (
              <li key={i}>
                <p className="in-h">{it.kop}</p>
                <p className="in-b"><Rich text={it.tekst} /></p>
              </li>
            ))}
          </ul>
        </div>
      </section>
    );
  }

  if (t === "account") {
    return (
      <section key={key} style={sectionStyle(b.achtergrond)}>
        <div className="wrap">
          {b.eyebrow && <p className="eyebrow">{b.eyebrow}</p>}
          {b.titel && <h2 className="sec-h">{b.titel}</h2>}
          {b.lead && <p className="lead"><Rich text={b.lead} /></p>}
          <AccountCarousel shots={b.shots || []} />
        </div>
      </section>
    );
  }

  if (t === "document") {
    return (
      <section className="doc" key={key} style={sectionStyle(b.achtergrond)}>
        <div className="wrap">
          {b.eyebrow && <p className="eyebrow">{b.eyebrow}</p>}
          {b.titel && <h2 className="sec-h">{b.titel}</h2>}
          {b.lead && <p className="lead"><Rich text={b.lead} /></p>}
          {(b.cards || []).map((c: any, i: number) => (
            <div className="doc-card" key={i}>
              {c.tag && <span className="tag">{c.tag}</span>}
              {c.img ? (
                <div className="doc-row">
                  <img className="doc-ipad" src={c.img} alt={c.kop || ""} />
                  <div>
                    <p className="dh">{c.kop}</p>
                    <p><Rich text={c.tekst} /></p>
                  </div>
                </div>
              ) : (
                <>
                  <p className="dh">{c.kop}</p>
                  <p><Rich text={c.tekst} /></p>
                </>
              )}
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (t === "nietis") {
    const firstWord = (s: string) => {
      const idx = s.indexOf(" ");
      return idx < 0 ? [s, ""] : [s.slice(0, idx), s.slice(idx + 1)];
    };
    return (
      <section key={key} style={sectionStyle(b.achtergrond)}>
        <div className="wrap">
          {b.eyebrow && <p className="eyebrow">{b.eyebrow}</p>}
          {b.titel && <h2 className="sec-h">{b.titel}</h2>}
          <ul className="gw">
            {(b.pairs || []).map((p: any, i: number) => {
              const [gw1, gwRest] = firstWord(p.geen || "");
              const [ww1, wwRest] = firstWord(p.wel || "");
              return (
                <li key={i}>
                  <span className="geen"><b>{gw1}</b> {gwRest}</span>
                  <span className="wel"><span className="w">{ww1}</span> {wwRest}</span>
                </li>
              );
            })}
          </ul>
        </div>
      </section>
    );
  }

  if (t === "ien") {
    return (
      <section key={key} style={sectionStyle(b.achtergrond)}>
        <div className="wrap">
          <div className="ien-head">
            {b.foto && <img className="ien-photo" src={b.foto} alt={b.titel || "Ien"} />}
            <div>
              {b.eyebrow && <p className="eyebrow">{b.eyebrow}</p>}
              {b.titel && <h2 className="sec-h">{b.titel}</h2>}
            </div>
          </div>
          {(b.paras || []).map((p: string, i: number) => <p key={i} className="lead"><Rich text={p} /></p>)}
        </div>
      </section>
    );
  }

  if (t === "ervaringen") {
    return (
      <section key={key} style={sectionStyle(b.achtergrond)}>
        <div className="wrap">
          {b.eyebrow && <p className="eyebrow">{b.eyebrow}</p>}
          {b.titel && <h2 className="sec-h">{b.titel}</h2>}
          <div className="quotes">
            {(b.quotes || []).map((q: any, i: number) => (
              <blockquote key={i}>
                <p><Rich text={q.tekst} /></p>
                {q.bron && <cite>{q.bron}</cite>}
              </blockquote>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (t === "faq") {
    return (
      <section key={key} style={sectionStyle(b.achtergrond)}>
        <div className="wrap">
          {b.eyebrow && <p className="eyebrow">{b.eyebrow}</p>}
          {b.titel && <h2 className="sec-h">{b.titel}</h2>}
          {b.lead && <p className="lead"><Rich text={b.lead} /></p>}
          <div className="faq">
            {(b.items || []).map((it: any, i: number) => (
              <details key={i} className="faq-item">
                <summary className="faq-q">{it.vraag}</summary>
                <div className="faq-a"><Rich text={it.antwoord} /></div>
              </details>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (t === "offer") {
    return (
      <section id={b.anchor || "aanbod"} key={key} style={sectionStyle(b.achtergrond)}>
        <div className="wrap">
          {b.introLabel && <p className="offer-intro">{b.introLabel}</p>}
          <div className="offer">
            <div className="price">
              <span className="amt">{b.prijs}</span>
              {b.prijsSub && <span className="per">{b.prijsSub}</span>}
            </div>
            <ul>{(b.bullets || []).map((x: string, i: number) => <li key={i}><Rich text={x} /></li>)}</ul>
            {b.ctaText && <a className="btn" href={href(b.ctaUrl)}>{b.ctaText} <span className="arrow">&rarr;</span></a>}
            {b.micro && <p className="micro">{b.micro}</p>}
          </div>
        </div>
      </section>
    );
  }

  return null;
}

export default function BlokPaginaView({ blocks, slug, footer, accentKleur }: { blocks: Block[]; slug: string; footer?: string; accentKleur?: string | null }) {
  const href = makeHref(`/lp/${slug}/kennismaken`);
  const css = accentCss(accentKleur);
  return (
    <div className="bpg" {...(css ? { "data-accent": "" } : {})}>
      {css && <style dangerouslySetInnerHTML={{ __html: css }} />}
      {(blocks || []).map((b, i) => renderBlock(b, b.key || String(i), href))}
      <footer>
        {footer || "Talk To Benji"}
      </footer>
    </div>
  );
}
