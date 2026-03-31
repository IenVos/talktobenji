import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { HeaderBar } from "@/components/chat/HeaderBar";
import { AuthorCard } from "@/components/blog/AuthorCard";
import { CtaBlockB } from "@/components/blog/CtaBlock";
import { BenjiTeaserReflectie, BenjiTeaserNacht, BenjiTeaserLanding, BenjiTeaserHerinnering, BenjiTeaserEmotie, BenjiTeaserCheckin, BenjiTeaserMemories } from "@/components/blog/BenjiTeaser";
import { SiteFooter } from "@/components/SiteFooter";

export const revalidate = 3600;

type Props = { params: { slug: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = await fetchQuery(api.blogPosts.getBySlug, { slug: params.slug }).catch(() => null);
  if (!post) return { title: "Artikel niet gevonden" };
  return {
    title: post.seoTitle ? `${post.seoTitle} — Talk To Benji` : `${post.title} — Talk To Benji`,
    description: post.metaDescription || post.excerpt || undefined,
    alternates: {
      canonical: `https://www.talktobenji.com/blog/${post.slug}`,
    },
    openGraph: {
      title: post.title,
      description: post.metaDescription || post.excerpt || undefined,
      url: `https://www.talktobenji.com/blog/${post.slug}`,
      siteName: "Talk To Benji",
      images: post.coverImageUrl ? [{ url: post.coverImageUrl }] : undefined,
      type: "article",
      publishedTime: post.publishedAt ? new Date(post.publishedAt).toISOString() : undefined,
      modifiedTime: post.updatedAt ? new Date(post.updatedAt).toISOString() : undefined,
    },
  };
}

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

/** Verwerkt **vet**, *cursief*, [link](url) én auto-linking in één pass */
function renderInlineAll(
  text: string,
  anchorData: AnchorEntry[] | undefined,
  currentSlug: string | undefined,
  currentPillar: string | null | undefined,
  used: Set<string>
): React.ReactNode {
  type Seg = { start: number; end: number; node: React.ReactNode };
  const segs: Seg[] = [];

  // Markdown: **bold**, *italic*, [text](url)
  const mdRe = /(\*\*(.+?)\*\*|\*(.+?)\*|\[([^\]]+)\]\((https?:\/\/[^)]+|\/[^)]*)\))/g;
  let m;
  while ((m = mdRe.exec(text)) !== null) {
    if (m[0].startsWith("**"))
      segs.push({ start: m.index, end: m.index + m[0].length, node: <strong key={`b${m.index}`} className="font-semibold text-stone-800">{m[2]}</strong> });
    else if (m[0].startsWith("*"))
      segs.push({ start: m.index, end: m.index + m[0].length, node: <em key={`i${m.index}`}>{m[3]}</em> });
    else
      segs.push({ start: m.index, end: m.index + m[0].length, node: <a key={`l${m.index}`} href={m[5]} className="text-primary-600 underline underline-offset-2">{m[4]}</a> });
  }

  // Auto-link ankers (alleen buiten markdown-matches)
  if (anchorData?.length && currentSlug) {
    const candidates = anchorData
      .filter(a => {
        if (a.slug === currentSlug) return false;
        if (a.isPillar) {
          // Pillar-ankerzin linkt alleen binnen zijn eigen cluster
          return currentPillar === a.slug;
        }
        // Blog-ankerzin linkt alleen binnen dezelfde pillar
        return a.pillarSlug === currentPillar || (!a.pillarSlug && !currentPillar);
      })
      .flatMap(a => a.anchorPhrases.map(p => ({ phrase: p, slug: a.slug, isPillar: a.isPillar ?? false })))
      .sort((a, b) => b.phrase.length - a.phrase.length);
    const lower = text.toLowerCase();
    for (const { phrase, slug, isPillar } of candidates) {
      if (used.has(phrase)) continue;
      const idx = lower.indexOf(phrase.toLowerCase());
      if (idx === -1) continue;
      if (segs.some(s => idx < s.end && idx + phrase.length > s.start)) continue;
      used.add(phrase);
      const href = isPillar ? `/thema/${slug}` : `/blog/${slug}`;
      segs.push({ start: idx, end: idx + phrase.length, node: <Link key={`al${idx}`} href={href} className="text-primary-600 underline underline-offset-2 hover:text-primary-800">{text.slice(idx, idx + phrase.length)}</Link> });
    }
  }

  if (!segs.length) return text;
  segs.sort((a, b) => a.start - b.start);
  const parts: React.ReactNode[] = [];
  let pos = 0;
  for (const seg of segs) {
    if (seg.start < pos) continue;
    if (seg.start > pos) parts.push(text.slice(pos, seg.start));
    parts.push(seg.node);
    pos = seg.end;
  }
  if (pos < text.length) parts.push(text.slice(pos));
  return parts.length === 1 && typeof parts[0] === "string" ? parts[0] : <>{parts}</>;
}

function renderInlineCta(data: any, key: number) {
  const bg = data?.bgColor || "#f5f0eb";
  const btnColor = data?.buttonColor || "#6d84a8";
  const borderStyle = data?.borderColor ? { border: `2px solid ${data.borderColor}` } : {};
  return (
    <div key={key} style={{ background: bg, borderRadius: "14px", padding: "20px 24px", margin: "24px 0", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px", flexWrap: "wrap" as const, ...borderStyle }}>
      <div>
        <p style={{ fontWeight: 600, fontSize: "15px", marginBottom: "2px", color: "color-mix(in srgb, #000 75%, " + bg + ")" }}>{data?.title || "Wil je hierover praten?"}</p>
        <p style={{ fontSize: "13px", color: "color-mix(in srgb, #000 50%, " + bg + ")" }}>{data?.body || "Benji luistert — dag en nacht beschikbaar."}</p>
      </div>
      <a href="/" style={{ background: btnColor, color: "#fff", fontWeight: 600, fontSize: "13px", padding: "8px 16px", borderRadius: "9px", textDecoration: "none", whiteSpace: "nowrap" as const }}>
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
    // Extra witregel
    if (block.trim() === "__SPACER__") {
      return <div key={i} className="h-6" />;
    }
    // Benji teaser: [benji:type]
    const benjiMatch = block.trim().match(/^\[benji:([^\]]+)\]$/);
    if (benjiMatch) {
      if (benjiMatch[1] === "reflectie") return <BenjiTeaserReflectie key={i} />;
      if (benjiMatch[1] === "nacht") return <BenjiTeaserNacht key={i} />;
      if (benjiMatch[1] === "landing") return <BenjiTeaserLanding key={i} />;
      if (benjiMatch[1] === "herinnering") return <BenjiTeaserHerinnering key={i} />;
      if (benjiMatch[1] === "emotie") return <BenjiTeaserEmotie key={i} />;
      if (benjiMatch[1] === "checkin") return <BenjiTeaserCheckin key={i} />;
      if (benjiMatch[1] === "memories") return <BenjiTeaserMemories key={i} />;
    }
    // Inline CTA: [cta] of [cta:key]
    const ctaMatch = block.trim().match(/^\[cta(?::([^\]]+))?\]$/);
    if (ctaMatch) {
      const key = ctaMatch[1];
      const data = key ? (ctaMap?.get(key) ?? ctaData) : ctaData;
      return renderInlineCta(data, i);
    }
    // Afbeelding
    const imgMatch = block.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
    if (imgMatch) {
      return (
        // eslint-disable-next-line @next/next/no-img-element
        <img key={i} src={imgMatch[2]} alt={imgMatch[1]} className="w-full rounded-xl my-6" />
      );
    }
    // Kop
    if (block.startsWith("### ")) {
      return <h4 key={i} className="text-lg font-semibold text-stone-800 mt-5 mb-2">{block.slice(4)}</h4>;
    }
    if (block.startsWith("## ")) {
      const text = block.slice(3);
      return <h3 key={i} id={headingId(text)} className="text-xl font-semibold text-stone-800 mt-6 mb-2">{text}</h3>;
    }
    if (block.startsWith("# ")) {
      return <h2 key={i} className="text-2xl font-bold text-stone-800 mt-8 mb-3">{block.slice(2)}</h2>;
    }
    const lines = block.split("\n").filter(Boolean);
    // Blockquote
    if (lines.length > 0 && lines.every(l => l.startsWith("> "))) {
      return (
        <blockquote key={i} className="border-l-4 border-primary-400 pl-5 pr-4 py-3 my-5 space-y-1 bg-primary-50 rounded-r-xl">
          {lines.map((l, j) => (
            <p key={j} className="text-stone-600 italic leading-relaxed text-[17px]">{ri(l.slice(2))}</p>
          ))}
        </blockquote>
      );
    }
    // Opsomming met vinkjes ✓
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
    // Opsomming met puntjes - of *
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
    // Normale alinea
    return (
      <div key={i} className="space-y-3">
        {lines.map((line, j) => (
          <p key={j} className="text-stone-600 leading-relaxed text-[17px]">{ri(line)}</p>
        ))}
      </div>
    );
  });
}


export default async function BlogPostPage({ params }: Props) {
  const post = await fetchQuery(api.blogPosts.getBySlug, { slug: params.slug }).catch(() => null);
  if (!post) notFound();

  const [pillar, allCtas, blogAnchorData, pillarAnchorData] = await Promise.all([
    post.pillarSlug
      ? fetchQuery(api.pillars.getBySlug, { slug: post.pillarSlug }).catch(() => null)
      : Promise.resolve(null),
    fetchQuery(api.ctaBlocks.listAll, {}).catch(() => [] as any[]),
    fetchQuery(api.blogPosts.listAnchorData, {}).catch(() => [] as any[]),
    fetchQuery(api.pillars.listAnchorData, {}).catch(() => [] as any[]),
  ]);
  const anchorData = [...(blogAnchorData as any[]), ...(pillarAnchorData as any[])];
  const ctaMap = new Map((allCtas as any[]).map((c: any) => [c.key, c]));
  const ctaData = ctaMap.get(post.ctaKey || "blog_default") ?? ctaMap.get("blog_default") ?? null;

  // JSON-LD structured data voor Google (Article + FAQPage)
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.metaDescription || post.excerpt,
    url: `https://www.talktobenji.com/blog/${post.slug}`,
    datePublished: post.publishedAt ? new Date(post.publishedAt).toISOString() : undefined,
    dateModified: post.updatedAt ? new Date(post.updatedAt).toISOString() : undefined,
    image: post.coverImageUrl || undefined,
    inLanguage: "nl-NL",
    author: {
      "@type": "Person",
      name: "Ien",
      jobTitle: "Founder van Talk To Benji",
      url: "https://www.talktobenji.com",
    },
    publisher: {
      "@type": "Organization",
      name: "Talk To Benji",
      url: "https://www.talktobenji.com",
      logo: { "@type": "ImageObject", url: "https://www.talktobenji.com/images/benji-logo-2.png" },
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": `https://www.talktobenji.com/blog/${post.slug}` },
  };

  const faqSchema = post.faqItems?.length
    ? {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: post.faqItems.map((f: any) => ({
          "@type": "Question",
          name: f.question,
          acceptedAnswer: { "@type": "Answer", text: f.answer },
        })),
      }
    : null;

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://talktobenji.com" },
      { "@type": "ListItem", position: 2, name: "Blog", item: "https://talktobenji.com/blog" },
      ...(pillar ? [{ "@type": "ListItem", position: 3, name: pillar.title, item: `https://talktobenji.com/thema/${pillar.slug}` }] : []),
      { "@type": "ListItem", position: pillar ? 4 : 3, name: post.title, item: `https://talktobenji.com/blog/${post.slug}` },
    ],
  };

  return (
    <div className="min-h-screen bg-stone-50">
      <HeaderBar />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      {faqSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      )}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      <div className="max-w-2xl mx-auto px-4 py-12">
        {/* Breadcrumb */}
        <nav className="text-xs text-stone-400 mb-8 flex items-center gap-1.5 flex-wrap">
          <Link href="/" className="hover:text-primary-600 whitespace-nowrap">Home</Link>
          <span>›</span>
          <Link href="/blog" className="hover:text-primary-600 whitespace-nowrap">Blog</Link>
          {pillar && (
            <>
              <span>›</span>
              <Link href={`/thema/${pillar.slug}`} className="hover:text-primary-600 whitespace-nowrap">{pillar.title}</Link>
            </>
          )}
        </nav>

        {/* Header */}
        <article>
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            {post.publishedAt && (
              <p className="text-sm text-stone-400">
                {new Date(post.publishedAt).toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric" })}
              </p>
            )}
            <span className="text-stone-300 text-sm">·</span>
            <span className="text-xs text-stone-400">{readingTime(post.content)} min lezen</span>
            {post.updatedAt && post.publishedAt && post.updatedAt - post.publishedAt > 30 * 24 * 60 * 60 * 1000 && (
              <>
                <span className="text-stone-300 text-sm">·</span>
                <span className="text-xs text-stone-400">
                  Bijgewerkt {new Date(post.updatedAt).toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric" })}
                </span>
              </>
            )}
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
            <img
              src={post.coverImageUrl}
              alt={post.title}
              className="w-full rounded-2xl mb-8 object-cover max-h-80"
            />
          )}

          {/* Inhoudsopgave */}
          {(() => {
            const toc = extractTOC(post.content);
            if (toc.length < 3) return null;
            return (
              <div className="mb-8 p-4 bg-stone-100 rounded-xl border border-stone-200">
                <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-3">In dit artikel</p>
                <ol className="space-y-1.5 list-decimal list-inside">
                  {toc.map((h, i) => (
                    <li key={i}>
                      <a href={`#${h.id}`} className="text-sm text-primary-600 hover:underline">{h.text}</a>
                    </li>
                  ))}
                </ol>
              </div>
            );
          })()}

          {/* Inhoud */}
          <div className="space-y-5">
            {renderContent(post.content, ctaData, ctaMap, anchorData as AnchorEntry[], post.slug, post.pillarSlug ?? null)}
          </div>

          {/* Interne links */}
          {/* FAQ */}
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

          {/* Bronnen */}
          {post.sources && (
            <div className="mt-10 p-5 bg-stone-50 rounded-2xl border border-stone-200">
              <p className="text-xs font-semibold text-stone-400 uppercase tracking-wide mb-3">Bronnen</p>
              <ul className="space-y-1">
                {post.sources.split("\n").filter(Boolean).map((source, i) => (
                  <li key={i} className="text-sm italic text-stone-400 leading-relaxed">
                    {source.startsWith("http") ? (
                      <a href={source} target="_blank" rel="noopener noreferrer" className="hover:text-primary-600 underline underline-offset-2">
                        {source}
                      </a>
                    ) : source}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Lees ook */}
          {post.internalLinks && post.internalLinks.filter((l: any) => l.label && l.slug).length > 0 && (
            <div className="mt-10">
              <p className="text-sm font-semibold text-stone-500 uppercase tracking-wide mb-4">Lees ook</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {post.internalLinks.filter((l: any) => l.label && l.slug).map((link: any, i: number) => (
                  <Link key={i} href={`/blog/${link.slug}`}
                    className="group bg-white rounded-2xl border border-stone-200 p-5 hover:shadow-md transition-shadow">
                    <p className="font-semibold text-stone-800 leading-snug mb-3 group-hover:text-primary-600 transition-colors text-sm">
                      {link.label}
                    </p>
                    <span className="text-sm text-primary-600 border border-primary-200 px-3 py-1 rounded-lg inline-block">
                      Lees verder →
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          <CtaBlockB data={ctaData} />
        </article>
      </div>

      <SiteFooter variant="dark" />
    </div>
  );
}
