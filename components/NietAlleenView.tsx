"use client";

import Image from "next/image";
import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

interface Ervaring { tekst: string; naam: string; context?: string; }
interface Vraag { vraag: string; antwoord: string; }

export function NietAlleenView({ slug }: { slug: string }) {
  const page = useQuery(api.landingPages.getBySlug, { slug });

  if (page === undefined) {
    return (
      <div style={{ minHeight: "100vh", background: "#fdf9f4", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: "#6d84a8" }} />
      </div>
    );
  }

  if (page === null) return null;

  const ctaUrl = (page as any).ctaUrl || "#";
  const ctaText = (page as any).ctaText || "Begin vandaag";

  const voorWieBullets: string[] = (page as any).voorWieBullets
    ? (page as any).voorWieBullets.split("\n").filter(Boolean)
    : [];

  let ervaringen: Ervaring[] = [];
  try { if ((page as any).ervaringenJson) ervaringen = JSON.parse((page as any).ervaringenJson); } catch { ervaringen = []; }

  let vragen: Vraag[] = [];
  try { if ((page as any).vragenJson) vragen = JSON.parse((page as any).vragenJson); } catch { vragen = []; }

  const renderText = (text: string) =>
    text.split("\n\n").map((para, i) => {
      const videoMatch = para.trim().match(/^\[video:(.+)\]$/);
      if (videoMatch) {
        const inner = videoMatch[1];
        const isCenter = inner.endsWith(":center");
        const src = isCenter ? inner.slice(0, -7) : inner;
        return isCenter ? (
          <div key={i} className="my-4 flex justify-center">
            <video src={src} controls playsInline className="rounded-xl max-h-[360px] w-auto max-w-full" style={{ maxWidth: "60%" }} />
          </div>
        ) : (
          <video key={i} src={src} controls playsInline className="w-auto max-w-full rounded-xl my-4 max-h-[360px] mx-auto block" />
        );
      }
      return (
        <p key={i}>
          {para.split("\n").map((line, j, arr) => (
            <span key={j}>{line}{j < arr.length - 1 && <br />}</span>
          ))}
        </p>
      );
    });

  return (
    <div style={{ minHeight: "100vh", background: "#fdf9f4", position: "relative" }}>

      {/* Achtergrond */}
      <div style={{ position: "fixed", inset: 0, zIndex: 0 }}>
        <Image src="/images/achtergrond.png" alt="" fill className="object-cover" priority />
        <div style={{ position: "absolute", inset: 0, background: "rgba(253,249,244,0.82)" }} />
      </div>

      <div style={{ position: "relative", zIndex: 1 }}>

        {/* HEADER */}
        <header className="flex flex-col items-center pt-8 pb-2 px-5">
          <Link href="/">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/niet-alleen-logo.png" alt="Niet Alleen" width={96} height={96} />
          </Link>
        </header>

        {/* HERO */}
        <section className="flex items-center justify-center px-5 pt-8 pb-16">
          <div className="w-full max-w-md text-center">
            {(page as any).heroLabel && (
              <p className="text-xs uppercase tracking-widest mb-5 font-medium" style={{ color: "#8a8078", letterSpacing: "0.14em" }}>
                {(page as any).heroLabel}
              </p>
            )}
            <h1 className="text-3xl sm:text-4xl font-semibold mb-4 leading-snug" style={{ color: "#3d3530", textWrap: "balance" } as React.CSSProperties}>
              {(page as any).heroTitle}
            </h1>
            {(page as any).heroSubtitle && (
              <p className="text-base leading-relaxed mb-3" style={{ color: "#6b6460", textWrap: "balance" } as React.CSSProperties}>
                {(page as any).heroSubtitle}
              </p>
            )}
            {(page as any).heroBody && (
              <p className="text-sm leading-relaxed mb-8" style={{ color: "#8a8078", textWrap: "balance" } as React.CSSProperties}>
                {(page as any).heroBody}
              </p>
            )}
            {(page as any).heroVideoUrl && (
              <div className="mb-8">
                <video src={(page as any).heroVideoUrl} controls playsInline
                  className="w-auto max-w-full mx-auto block rounded-2xl"
                  style={{ maxHeight: "420px" }}
                />
              </div>
            )}
            <a
              href={ctaUrl}
              className="inline-block w-full sm:w-auto sm:px-10 py-3.5 rounded-2xl font-medium text-white text-sm"
              style={{ background: "#6d84a8" }}
            >
              {ctaText}
            </a>
          </div>
        </section>

        {/* SECTIE 1 */}
        {((page as any).section1Title || (page as any).section1Text) && (
          <section className="px-5 pb-12">
            <div className="max-w-lg mx-auto">
              <div className="rounded-2xl p-6 sm:p-8" style={{ background: "#ffffff", border: "1px solid rgba(160,148,136,0.35)", boxShadow: "0 6px 32px rgba(61,53,48,0.18)" }}>
                {(page as any).section1Title && (
                  <h2 className="text-lg font-semibold mb-4" style={{ color: "#3d3530" }}>{(page as any).section1Title}</h2>
                )}
                {(page as any).section1Text && (
                  <div className="space-y-3 text-sm leading-relaxed" style={{ color: "#6b6460" }}>
                    {renderText((page as any).section1Text)}
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* SECTIE 2 */}
        {((page as any).section2Title || (page as any).section2Text) && (
          <section className="px-5 pb-12">
            <div className="max-w-lg mx-auto">
              <div className="rounded-2xl p-6 sm:p-8" style={{ background: "#ffffff", border: "1px solid rgba(160,148,136,0.35)", boxShadow: "0 6px 32px rgba(61,53,48,0.18)" }}>
                {(page as any).section2Title && (
                  <h2 className="text-lg font-semibold mb-4" style={{ color: "#3d3530" }}>{(page as any).section2Title}</h2>
                )}
                {(page as any).section2Text && (
                  <div className="space-y-3 text-sm leading-relaxed" style={{ color: "#6b6460" }}>
                    {renderText((page as any).section2Text)}
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* PRODUCTAFBEELDING */}
        {((page as any).productImageUrl || (page as any).productImagePath) && (
          <section className="px-5 pb-12">
            <div className="max-w-lg mx-auto">
              {(page as any).productImageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={(page as any).productImageUrl} alt="" className="w-full rounded-2xl" />
              ) : (
                <Image src={(page as any).productImagePath} alt="" width={600} height={420} className="w-full rounded-2xl" />
              )}
            </div>
          </section>
        )}

        {/* VOOR WIE */}
        {voorWieBullets.length > 0 && (
          <section className="px-5 pb-12">
            <div className="max-w-lg mx-auto">
              <div className="rounded-2xl p-6 sm:p-8" style={{ background: "#ffffff", border: "1px solid rgba(160,148,136,0.35)", boxShadow: "0 6px 32px rgba(61,53,48,0.18)" }}>
                <h2 className="text-lg font-semibold mb-5" style={{ color: "#3d3530" }}>
                  {(page as any).voorWieTitle || "Dit is voor jou als..."}
                </h2>
                <ul className="space-y-3">
                  {voorWieBullets.map((item, i) => (
                    <li key={i} className="flex gap-3 text-sm leading-relaxed" style={{ color: "#6b6460" }}>
                      <span style={{ color: "#b0a8a0", flexShrink: 0, marginTop: 2 }}>·</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>
        )}

        {/* ERVARINGEN */}
        {ervaringen.length > 0 && (
          <section className="px-5 pb-12">
            <div className="max-w-lg mx-auto space-y-4">
              {ervaringen.map((e, i) => (
                <div key={i} className="rounded-2xl p-6" style={{ background: "#ffffff", border: "1px solid rgba(160,148,136,0.35)", boxShadow: "0 6px 32px rgba(61,53,48,0.18)" }}>
                  <p className="text-sm leading-relaxed mb-3" style={{ color: "#3d3530" }}>"{e.tekst}"</p>
                  <p className="text-xs" style={{ color: "#8a8078" }}>{e.naam}{e.context ? `, ${e.context}` : ""}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* WIE IS IEN */}
        {((page as any).wieIsTitle || (page as any).wieIsText) && (
          <section className="px-5 pb-12">
            <div className="max-w-lg mx-auto">
              <div className="rounded-2xl p-6 sm:p-8" style={{ background: "#ffffff", border: "1px solid rgba(160,148,136,0.35)", boxShadow: "0 6px 32px rgba(61,53,48,0.18)" }}>
                <div className="flex items-center gap-4 mb-4">
                  <img src="https://talktobenji.com/images/ien-founder.png" alt="Ien" width={64} height={64} style={{ borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
                  {(page as any).wieIsTitle && (
                    <h2 className="text-lg font-semibold leading-snug" style={{ color: "#3d3530" }}>{(page as any).wieIsTitle}</h2>
                  )}
                </div>
                {(page as any).wieIsText && (
                  <div className="space-y-3 text-sm leading-relaxed" style={{ color: "#6b6460" }}>
                    {renderText((page as any).wieIsText)}
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* FAQ */}
        {vragen.length > 0 && (
          <section className="px-5 pb-12">
            <div className="max-w-lg mx-auto">
              <h2 className="text-lg font-semibold mb-5" style={{ color: "#3d3530" }}>Misschien vraag je je af...</h2>
              <div className="rounded-2xl p-6 sm:p-7 space-y-6" style={{ background: "#ffffff", border: "1px solid rgba(160,148,136,0.35)", boxShadow: "0 6px 32px rgba(61,53,48,0.18)" }}>
                {vragen.map((v, i) => (
                  <div key={i}>
                    <p className="text-sm font-semibold mb-1" style={{ color: "#3d3530" }}>{v.vraag}</p>
                    <p className="text-sm leading-relaxed" style={{ color: "#6b6460" }}>{v.antwoord}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* FINALE CTA */}
        {((page as any).finalCtaTitle || (page as any).finalCtaBody) && (
          <section className="px-5 pb-20">
            <div className="max-w-md mx-auto text-center">
              <div className="rounded-2xl px-6 sm:px-10 py-10" style={{ background: "#ffffff", border: "1px solid rgba(160,148,136,0.35)", boxShadow: "0 6px 32px rgba(61,53,48,0.18)" }}>
                {(page as any).finalCtaTitle && (
                  <h2 className="text-2xl font-semibold mb-3 leading-snug" style={{ color: "#3d3530", textWrap: "balance" } as React.CSSProperties}>
                    {(page as any).finalCtaTitle}
                  </h2>
                )}
                {(page as any).finalCtaBody && (
                  <div className="space-y-3 text-sm leading-relaxed mb-7" style={{ color: "#6b6460" }}>
                    {renderText((page as any).finalCtaBody)}
                  </div>
                )}
                <a
                  href={ctaUrl}
                  className="inline-block w-full py-3.5 rounded-2xl font-medium text-white text-sm mb-4"
                  style={{ background: "#6d84a8" }}
                >
                  {ctaText}
                </a>
                <p className="text-xs leading-relaxed" style={{ color: "#8a8078" }}>
                  Na aankoop ontvang je direct een bevestiging. Je eerste dag begint de volgende ochtend.
                </p>
              </div>
            </div>
          </section>
        )}

        {/* FOOTER */}
        <footer className="px-5 py-8 text-center" style={{ borderTop: "1px solid rgba(0,0,0,0.08)" }}>
          <div className="max-w-lg mx-auto">
            <Link href="/privacy" className="text-xs" style={{ color: "#b0a8a0" }}>Privacybeleid</Link>
          </div>
        </footer>

      </div>
    </div>
  );
}
