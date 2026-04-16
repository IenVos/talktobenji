import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { notFound } from "next/navigation";
import Link from "next/link";
import { HeaderBar } from "@/components/chat/HeaderBar";
import { AuthorCard } from "@/components/blog/AuthorCard";
import { CtaBlockB } from "@/components/blog/CtaBlock";
import { BenjiTeaserReflectie, BenjiTeaserNacht, BenjiTeaserLanding, BenjiTeaserHerinnering, BenjiTeaserEmotie, BenjiTeaserCheckin, BenjiTeaserMemories, BenjiTeaserCustom } from "@/components/blog/BenjiTeaser";
import { SiteFooter } from "@/components/SiteFooter";

// Altijd vers renderen — geen ISR caching voor preview
export const dynamic = "force-dynamic";

type Props = { params: { slug: string }; searchParams: { token?: string } };

function headingId(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, "").trim().replace(/\s+/g, "-").slice(0, 60);
}

function readingTime(content: string) {
  return Math.max(1, Math.ceil(content.trim().split(/\s+/).length / 200));
}

function extractTOC(content: string) {
  return content.replace(/\n{3,}/g, "\n\n").split(/\n\n+/)
    .filter(b => b.startsWith("## "))
    .map(b => ({ text: b.slice(3), id: headingId(b.slice(3)) }));
}

type AnchorEntry = { slug: string; pillarSlug?: string | null; anchorPhrases: string[]; isPillar?: boolean };

function renderInlineAll(
  text: string,
  anchorData: AnchorEntry[] | undefined,
  currentSlug: string | undefined,
  currentPillar: string | null | undefined,
  used: Set<string>
): React.ReactNode {
  const candidates = (anchorData?.length && currentSlug)
    ? anchorData
        .filter(a => {
          if (a.slug === currentSlug) return false;
          if (a.isPillar) return currentPillar === a.slug;
          return a.pillarSlug === currentPillar || (!a.pillarSlug && !currentPillar);
        })
        .flatMap(a => a.anchorPhrases.map(p => ({ phrase: p, slug: a.slug, isPillar: a.isPillar ?? false })))
        .sort((a, b) => b.phrase.length - a.phrase.length)
    : [];

  function linkText(t: string): React.ReactNode {
    if (!candidates.length) return t;
    type S = { start: number; end: number; node: React.ReactNode };
    const s: S[] = [];
    const lower = t.toLowerCase();
    for (const { phrase, slug, isPillar } of candidates) {
      if (used.has(phrase)) continue;
      const idx = lower.indexOf(phrase.toLowerCase());
      if (idx === -1) continue;
      if (s.some(x => idx < x.end && idx + phrase.length > x.start)) continue;
      used.add(phrase);
      const href = isPillar ? `/thema/${slug}` : `/blog/${slug}`;
      s.push({ start: idx, end: idx + phrase.length, node: <Link key={`al${idx}`} href={href} className="text-primary-600 underline underline-offset-2 hover:text-primary-800">{t.slice(idx, idx + phrase.length)}</Link> });
    }
    if (!s.length) return t;
    s.sort((a, b) => a.start - b.start);
    const parts: React.ReactNode[] = [];
    let pos = 0;
    for (const seg of s) {
      if (seg.start < pos) continue;
      if (seg.start > pos) parts.push(t.slice(pos, seg.start));
      parts.push(seg.node);
      pos = seg.end;
    }
    if (pos < t.length) parts.push(t.slice(pos));
    return parts.length === 1 && typeof parts[0] === "string" ? parts[0] : <>{parts}</>;
  }

  type Seg = { start: number; end: number; node: React.ReactNode };
  const segs: Seg[] = [];
  const mdRe = /(\*\*(.+?)\*\*|\*(.+?)\*|\[([^\]]+)\]\((https?:\/\/[^)]+|\/[^)]*)\))/g;
  let m;
  while ((m = mdRe.exec(text)) !== null) {
    if (m[0].startsWith("**"))
      segs.push({ start: m.index, end: m.index + m[0].length, node: <strong key={`b${m.index}`} className="font-semibold text-stone-800">{linkText(m[2])}</strong> });
    else if (m[0].startsWith("*"))
      segs.push({ start: m.index, end: m.index + m[0].length, node: <em key={`i${m.index}`}>{linkText(m[3])}</em> });
    else
      segs.push({ start: m.index, end: m.index + m[0].length, node: <a key={`l${m.index}`} href={m[5]} className="text-primary-600 underline underline-offset-2">{m[4]}</a> });
  }

  if (!segs.length) return linkText(text);
  segs.sort((a, b) => a.start - b.start);
  const parts: React.ReactNode[] = [];
  let pos = 0;
  for (const seg of segs) {
    if (seg.start < pos) continue;
    if (seg.start > pos) parts.push(linkText(text.slice(pos, seg.start)));
    parts.push(seg.node);
    pos = seg.end;
  }
  if (pos < text.length) parts.push(linkText(text.slice(pos)));
  return parts.length === 1 && typeof parts[0] === "string" ? parts[0] : <>{parts}</>;
}

function renderInlineCta(data: any, key: number) {
  const bg = data?.bgColor || "#f5f0eb";
  const btnColor = data?.buttonColor || "#6d84a8";
  const borderStyle = data?.borderColor ? { border: `2px solid ${data.borderColor}` } : {};
  const href = data?.buttonUrl?.trim() || "/";
  return (
    <div key={key} style={{ background: bg, borderRadius: "14px", padding: "20px 24px", margin: "24px 0", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px", flexWrap: "wrap" as const, ...borderStyle }}>
      <div>
        <p style={{ fontWeight: 600, fontSize: "15px", marginBottom: "2px", color: "color-mix(in srgb, #000 75%, " + bg + ")" }}>{data?.title || "Wil je hierover praten?"}</p>
        <p style={{ fontSize: "13px", color: "color-mix(in srgb, #000 50%, " + bg + ")" }}>{data?.body || "Benji luistert — dag en nacht beschikbaar."}</p>
      </div>
      <a href={href} style={{ background: btnColor, color: "#fff", fontWeight: 600, fontSize: "13px", padding: "8px 16px", borderRadius: "9px", textDecoration: "none", whiteSpace: "nowrap" as const }}>
        {data?.buttonText || "Begin een gesprek →"}
      </a>
    </div>
  );
}

function renderContent(content: string, ctaData?: any, ctaMap?: Map<string, any>, anchorData?: AnchorEntry[], currentSlug?: string, currentPillar?: string | null) {
  const used = new Set<string>();
  const ri = (text: string) => renderInlineAll(text, anchorData, currentSlug, currentPillar, used);
  const blocks = content.replace(/\n{3,}/g, "\n\n__SPACER__\n\n").split(/\n\n+/);
  return blocks.map((block, i) => {
    if (block.trim() === "__SPACER__") return <div key={i} className="h-6" />;
    const benjiMatch = block.trim().match(/^\[benji:([^\]]+)\]$/);
    if (benjiMatch) {
      if (benjiMatch[1] === "reflectie") return <BenjiTeaserReflectie key={i} />;
      if (benjiMatch[1] === "nacht") return <BenjiTeaserNacht key={i} />;
      if (benjiMatch[1] === "landing") return <BenjiTeaserLanding key={i} />;
      if (benjiMatch[1] === "herinnering") return <BenjiTeaserHerinnering key={i} />;
      if (benjiMatch[1] === "emotie") return <BenjiTeaserEmotie key={i} />;
      if (benjiMatch[1] === "checkin") return <BenjiTeaserCheckin key={i} />;
      if (benjiMatch[1] === "memories") return <BenjiTeaserMemories key={i} />;
      return <BenjiTeaserCustom key={i} type={benjiMatch[1]} />;
    }
    const naMatch = block.trim().match(/^\[niet-alleen:([^\]]+)\]$/);
    if (naMatch) {
      const btnColor = naMatch[1] || "#6d84a8";
      return (
        <div key={i} style={{ margin: "28px 0", textAlign: "center" }}>
          <a
            href="https://www.talktobenji.com/niet-alleen-b"
            style={{
              display: "inline-block",
              background: btnColor,
              color: "#fff",
              fontWeight: 600,
              fontSize: "15px",
              padding: "13px 28px",
              borderRadius: "14px",
              textDecoration: "none",
            }}
          >
            Ontdek Niet Alleen →
          </a>
        </div>
      );
    }
    const ctaMatch = block.trim().match(/^\[cta(?::([^\]]+))?\]$/);
    if (ctaMatch) {
      const key = ctaMatch[1];
      const data = key ? (ctaMap?.get(key) ?? ctaData) : ctaData;
      return renderInlineCta(data, i);
    }
    const imgMatch = block.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
    if (imgMatch) {
      // eslint-disable-next-line @next/next/no-img-element
      return <img key={i} src={imgMatch[2]} alt={imgMatch[1]} className="w-full rounded-xl my-6" />;
    }
    if (block.startsWith("### ")) return <h4 key={i} className="text-lg font-semibold text-stone-800 mt-5 mb-2">{block.slice(4)}</h4>;
    if (block.startsWith("## ")) {
      const text = block.slice(3);
      return <h3 key={i} id={headingId(text)} className="text-xl font-semibold text-stone-800 mt-6 mb-2">{text}</h3>;
    }
    if (block.startsWith("# ")) return <h2 key={i} className="text-2xl font-bold text-stone-800 mt-8 mb-3">{block.slice(2)}</h2>;
    const lines = block.split("\n").filter(Boolean);
    if (lines.length > 0 && lines.every(l => l.startsWith("> "))) {
      return (
        <blockquote key={i} className="border-l-4 border-primary-400 pl-5 pr-4 py-3 my-5 space-y-1 bg-primary-50 rounded-r-xl">
          {lines.map((l, j) => <p key={j} className="text-stone-600 italic leading-relaxed text-[17px]">{ri(l.slice(2))}</p>)}
        </blockquote>
      );
    }
    if (lines.length > 0 && lines.every(l => l.startsWith("✓ "))) {
      return (
        <ul key={i} className="my-4 space-y-2">
          {lines.map((l, j) => (
            <li key={j} className="flex items-start gap-2.5">
              <span className="text-primary-600 font-bold mt-0.5 flex-shrink-0">✓</span>
              <span className="text-stone-600 leading-relaxed text-[17px]">{ri(l.slice(2))}</span>
            </li>
          ))}
        </ul>
      );
    }
    if (lines.length > 0 && lines.every(l => l.startsWith("- ") || l.startsWith("* "))) {
      return (
        <ul key={i} className="my-4 space-y-2">
          {lines.map((l, j) => (
            <li key={j} className="flex items-start gap-2.5">
              <span className="text-stone-400 mt-1 flex-shrink-0">•</span>
              <span className="text-stone-600 leading-relaxed text-[17px]">{ri(l.slice(2))}</span>
            </li>
          ))}
        </ul>
      );
    }
    return (
      <div key={i} className="space-y-3">
        {lines.map((line, j) => <p key={j} className="text-stone-600 leading-relaxed text-[17px]">{ri(line)}</p>)}
      </div>
    );
  });
}

export default async function BlogPostPreviewPage({ params, searchParams }: Props) {
  const token = searchParams?.token;
  if (!token || token !== process.env.NEXT_PUBLIC_PREVIEW_SECRET) notFound();

  const post = await fetchQuery(api.blogPosts.getBySlugAdmin, { slug: params.slug }).catch(() => null);
  if (!post) notFound();

  const [pillar, allCtas, blogAnchorData, pillarAnchorData, allCovers] = await Promise.all([
    post.pillarSlug
      ? fetchQuery(api.pillars.getBySlug, { slug: post.pillarSlug }).catch(() => null)
      : Promise.resolve(null),
    fetchQuery(api.ctaBlocks.listAll, {}).catch(() => [] as any[]),
    fetchQuery(api.blogPosts.listAnchorData, {}).catch(() => [] as any[]),
    fetchQuery(api.pillars.listAnchorData, {}).catch(() => [] as any[]),
    fetchQuery(api.blogPosts.listCovers, {}).catch(() => [] as any[]),
  ]);
  const coverMap = new Map((allCovers as any[]).map((c: any) => [c.slug, c.coverImageUrl]));
  const anchorData = [...(blogAnchorData as any[]), ...(pillarAnchorData as any[])];
  const ctaMap = new Map((allCtas as any[]).map((c: any) => [c.key, c]));
  const ctaData = ctaMap.get(post.ctaKey || "blog_default") ?? ctaMap.get("blog_default") ?? null;

  return (
    <div className="min-h-screen bg-stone-50">
      <HeaderBar />
      <div className="bg-amber-400 text-amber-900 text-sm font-medium text-center py-2 px-4">
        ⚠️ Voorbeeldmodus — {(post as any).isLive ? "dit artikel is live" : "dit artikel is nog niet live"}
      </div>

      <div className="max-w-2xl mx-auto px-4 py-12">
        <nav className="text-xs text-stone-400 mb-8 flex items-center gap-1.5 flex-wrap">
          <Link href="/" className="hover:text-primary-600 whitespace-nowrap">Home</Link>
          <span>›</span>
          <Link href="/blog" className="hover:text-primary-600 whitespace-nowrap">Blog</Link>
          {pillar && (
            <>
              <span>›</span>
              <Link href={`/thema/${pillar.slug}/artikelen`} className="hover:text-primary-600 whitespace-nowrap">{pillar.title}</Link>
            </>
          )}
        </nav>

        <article>
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            {post.publishedAt && (
              <p className="text-sm text-stone-400">
                {new Date(post.publishedAt).toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric" })}
              </p>
            )}
            <span className="text-stone-300 text-sm">·</span>
            <span className="text-xs text-stone-400">{readingTime(post.content)} min lezen</span>
          </div>
          <h1 className="text-3xl font-bold text-stone-800 mb-6 leading-tight">{post.title}</h1>

          <AuthorCard />

          {post.excerpt && (
            <div className="mb-8 p-4 bg-primary-50 border-l-4 border-primary-400 rounded-r-xl">
              <p className="text-xs font-semibold text-primary-700 uppercase tracking-wide mb-2">In het kort</p>
              <div className="space-y-3">
                {post.excerpt.split("\n\n").filter(Boolean).map((para: string, i: number) => (
                  <p key={i} className="text-stone-600 leading-relaxed text-[15px]" style={{ whiteSpace: "pre-line" }}>{para.trim()}</p>
                ))}
              </div>
            </div>
          )}

          {post.coverImageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={post.coverImageUrl} alt={post.title} className="w-full rounded-2xl mb-8 object-cover max-h-80" />
          )}

          {(() => {
            const toc = extractTOC(post.content);
            if (toc.length < 3) return null;
            return (
              <div className="mb-8 p-4 bg-stone-100 rounded-xl border border-stone-200">
                <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-3">In dit artikel</p>
                <ol className="space-y-1.5 list-decimal list-inside">
                  {toc.map((h, i) => (
                    <li key={i}><a href={`#${h.id}`} className="text-sm text-primary-600 hover:underline">{h.text}</a></li>
                  ))}
                </ol>
              </div>
            );
          })()}

          <div className="space-y-5">
            {renderContent(post.content, ctaData, ctaMap, anchorData as AnchorEntry[], post.slug, post.pillarSlug ?? null)}
          </div>

          {post.faqItems && post.faqItems.filter((f: any) => f.question && f.answer).length > 0 && (
            <div className="mt-10">
              <h2 className="text-xl font-bold text-stone-800 mb-5">Veelgestelde vragen</h2>
              <div className="space-y-3">
                {post.faqItems.filter((f: any) => f.question && f.answer).map((faq: any, i: number) => (
                  <details key={i} className="group bg-primary-50 rounded-xl border border-primary-100 p-5">
                    <summary className="font-semibold text-stone-800 cursor-pointer list-none flex justify-between items-center">
                      {faq.question}
                      <span className="text-primary-400 ml-3 flex-shrink-0 group-open:rotate-180 transition-transform">↓</span>
                    </summary>
                    <div className="mt-3 space-y-2">
                      {faq.answer.split("\n").filter(Boolean).map((line: string, j: number) => (
                        <p key={j} className="text-stone-600 leading-relaxed text-sm">{line}</p>
                      ))}
                    </div>
                  </details>
                ))}
              </div>
            </div>
          )}

          {post.sources && (
            <div className="mt-10 p-5 bg-stone-50 rounded-2xl border border-stone-200">
              <p className="text-xs font-semibold text-stone-400 uppercase tracking-wide mb-3">Bronnen</p>
              <ul className="space-y-1">
                {post.sources.split("\n").filter(Boolean).map((source, i) => (
                  <li key={i} className="text-sm italic text-stone-400 leading-relaxed">
                    {source.startsWith("http") ? (
                      <a href={source} target="_blank" rel="noopener noreferrer" className="hover:text-primary-600 underline underline-offset-2">{source}</a>
                    ) : source}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {(() => {
            const articleLinks = (post.internalLinks ?? [])
              .filter((l: any) => l.label && l.slug && !l.slug.startsWith("thema/"))
              .slice(0, 3);
            const hasLinks = articleLinks.length > 0;
            const hasPillar = !!pillar;
            if (!hasLinks && !hasPillar) return null;
            return (
              <div className="mt-10">
                <p className="text-sm font-semibold text-stone-500 uppercase tracking-wide mb-4">Lees ook</p>
                {hasLinks && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                    {articleLinks.map((link: any, i: number) => {
                      const cover = coverMap.get(link.slug);
                      return (
                        <Link key={i} href={`/blog/${link.slug}`}
                          className="group bg-white rounded-2xl border border-stone-200 overflow-hidden hover:shadow-md transition-shadow">
                          {cover
                            ? <img src={cover} alt={link.label} className="w-full h-36 object-cover" />
                            : <div className="w-full h-36 bg-primary-50" />}
                          <div className="p-4">
                            <p className="font-semibold text-stone-800 leading-snug mb-3 group-hover:text-primary-600 transition-colors text-sm line-clamp-2">
                              {link.label}
                            </p>
                            <span className="text-sm text-primary-600 border border-primary-200 px-3 py-1 rounded-lg inline-block">
                              Lees verder →
                            </span>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
                {hasPillar && (
                  <Link href={`/thema/${pillar.slug}`}
                    className="flex items-center gap-2 text-sm text-primary-700 hover:text-primary-900 transition-colors">
                    <span className="text-base">📖</span>
                    <span>Meer over dit thema: <span className="font-semibold">{pillar.title}</span> →</span>
                  </Link>
                )}
              </div>
            );
          })()}

          <CtaBlockB data={ctaData} />
        </article>
      </div>

      <SiteFooter variant="dark" />
    </div>
  );
}
