import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { notFound } from "next/navigation";
import Link from "next/link";
import { CtaBlockA } from "@/components/blog/CtaBlock";
import { BenjiTeaserReflectie, BenjiTeaserNacht, BenjiTeaserLanding, BenjiTeaserHerinnering, BenjiTeaserEmotie, BenjiTeaserCheckin, BenjiTeaserMemories } from "@/components/blog/BenjiTeaser";
import { SiteFooter } from "@/components/SiteFooter";
import type { Metadata } from "next";
import { HeaderBar } from "@/components/chat/HeaderBar";

export const revalidate = 3600;

type Props = { params: { slug: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const pillar = await fetchQuery(api.pillars.getBySlug, { slug: params.slug }).catch(() => null);
  if (!pillar || !pillar.isLive) return { title: "Pagina niet gevonden" };
  return {
    title: pillar.seoTitle ? `${pillar.seoTitle} — Talk To Benji` : `${pillar.title} — Talk To Benji`,
    description: pillar.metaDescription || undefined,
    alternates: {
      canonical: `https://www.talktobenji.com/thema/${pillar.slug}`,
    },
    openGraph: {
      title: pillar.title,
      description: pillar.metaDescription || undefined,
      url: `https://www.talktobenji.com/thema/${pillar.slug}`,
      siteName: "Talk To Benji",
      type: "website",
    },
  };
}

function renderInline(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  const regex = /(\*\*(.+?)\*\*|\*(.+?)\*|\[([^\]]+)\]\((https?:\/\/[^)]+|\/[^)]*)\))/g;
  let last = 0, m;
  while ((m = regex.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    if (m[0].startsWith("**")) parts.push(<strong key={m.index} className="font-semibold text-stone-800">{m[2]}</strong>);
    else if (m[0].startsWith("*")) parts.push(<em key={m.index}>{m[3]}</em>);
    else parts.push(<a key={m.index} href={m[5]} className="text-primary-600 underline underline-offset-2">{m[4]}</a>);
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
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

function renderContent(content: string, ctaData?: any, ctaMap?: Map<string, any>): React.ReactNode[] {
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
    if (block.startsWith("### ")) return <h4 key={i} className="text-lg font-semibold text-stone-800 mt-5 mb-2">{block.slice(4)}</h4>;
    if (block.startsWith("## ")) return <h3 key={i} className="text-xl font-semibold text-stone-800 mt-6 mb-2">{block.slice(3)}</h3>;
    if (block.startsWith("# ")) return <h2 key={i} className="text-2xl font-bold text-stone-800 mt-8 mb-3">{block.slice(2)}</h2>;
    const lines = block.split("\n").filter(Boolean);
    if (lines.length > 0 && lines.every(l => l.startsWith("> "))) {
      return (
        <blockquote key={i} className="border-l-4 border-primary-400 pl-5 pr-4 py-3 my-5 space-y-1 bg-primary-50 rounded-r-xl">
          {lines.map((l, j) => <p key={j} className="text-stone-600 italic leading-relaxed text-[17px]">{renderInline(l.slice(2))}</p>)}
        </blockquote>
      );
    }
    if (lines.length > 0 && lines.every(l => l.startsWith("✓ "))) {
      return (
        <ul key={i} className="my-4 space-y-2">
          {lines.map((l, j) => (
            <li key={j} className="flex items-start gap-2.5">
              <span className="text-primary-600 font-bold mt-0.5 flex-shrink-0">✓</span>
              <span className="text-stone-600 leading-relaxed text-[17px]">{renderInline(l.slice(2))}</span>
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
              <span className="text-stone-600 leading-relaxed text-[17px]">{renderInline(l.slice(2))}</span>
            </li>
          ))}
        </ul>
      );
    }
    return (
      <div key={i} className="space-y-3">
        {lines.map((line, j) => (
          <p key={j} className="text-stone-600 leading-relaxed text-[17px]">{renderInline(line)}</p>
        ))}
      </div>
    );
  });
}

export default async function PillarPage({ params }: Props) {
  const [pillar, articles] = await Promise.all([
    fetchQuery(api.pillars.getBySlug, { slug: params.slug }).catch(() => null),
    fetchQuery(api.pillars.getArticles, { pillarSlug: params.slug }).catch(() => []),
  ]);

  if (!pillar || !pillar.isLive) notFound();

  const allCtas = await fetchQuery(api.ctaBlocks.listAll, {}).catch(() => [] as any[]);
  const ctaMap = new Map((allCtas as any[]).map((c: any) => [c.key, c]));
  const ctaData = ctaMap.get((pillar as any).ctaKey || "pillar_default") ?? ctaMap.get("pillar_default") ?? null;

  const pillarSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: pillar.title,
    description: pillar.metaDescription,
    url: `https://www.talktobenji.com/thema/${pillar.slug}`,
    inLanguage: "nl-NL",
    dateModified: new Date(pillar.updatedAt).toISOString(),
    publisher: {
      "@type": "Organization",
      name: "Talk To Benji",
      url: "https://www.talktobenji.com",
      logo: { "@type": "ImageObject", url: "https://www.talktobenji.com/images/benji-logo-2.png" },
    },
    hasPart: (articles as any[]).map((a) => ({
      "@type": "Article",
      headline: a.title,
      url: `https://www.talktobenji.com/blog/${a.slug}`,
      datePublished: a.publishedAt ? new Date(a.publishedAt).toISOString() : undefined,
    })),
  };

  const faqSchema = (pillar as any).faqItems?.length
    ? {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: (pillar as any).faqItems.map((f: any) => ({
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
      { "@type": "ListItem", position: 1, name: "Home", item: "https://www.talktobenji.com" },
      { "@type": "ListItem", position: 2, name: "Blog", item: "https://www.talktobenji.com/blog" },
      { "@type": "ListItem", position: 3, name: pillar.title, item: `https://www.talktobenji.com/thema/${pillar.slug}` },
    ],
  };

  return (
    <div className="min-h-screen bg-stone-50">
      <HeaderBar />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(pillarSchema) }}
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

      <div className="max-w-3xl mx-auto px-4 py-12">
        <nav className="text-xs text-stone-400 mb-8 flex items-center gap-1.5">
          <Link href="/" className="hover:text-primary-600">Home</Link>
          <span>›</span>
          <Link href="/blog" className="hover:text-primary-600">Blog</Link>
          <span>›</span>
          <span className="text-stone-500">{pillar.title}</span>
        </nav>

        {/* Header */}
        <div className="mb-10">
          {(pillar as any).coverImageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={(pillar as any).coverImageUrl}
              alt={pillar.title}
              className="w-full rounded-2xl mb-6 object-cover max-h-72"
            />
          )}
          <h1 className="text-3xl sm:text-4xl font-bold text-stone-800 mb-4 leading-tight">
            {pillar.title}
          </h1>
          {pillar.metaDescription && (
            <p className="text-stone-500 text-lg leading-relaxed">{pillar.metaDescription}</p>
          )}

          {(pillar as any).excerpt && (
            <div className="mt-6 mb-2 p-4 bg-primary-50 border-l-4 border-primary-400 rounded-r-xl">
              <p className="text-xs font-semibold text-primary-700 uppercase tracking-wide mb-2">In het kort</p>
              <div className="space-y-2">
                {(pillar as any).excerpt.split("\n").filter(Boolean).map((line: string, i: number) => (
                  <p key={i} className="text-stone-600 leading-relaxed text-[15px]">{line}</p>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Pillar content (optioneel) */}
        {pillar.content && (
          <div className="mb-12 space-y-5">
            {renderContent(pillar.content, ctaData, ctaMap)}
          </div>
        )}

        {/* Interne links */}
        {(pillar as any).internalLinks && (pillar as any).internalLinks.filter((l: any) => l.label && l.slug).length > 0 && (
          <div className="mt-2 mb-10 p-5 bg-primary-50 rounded-2xl border border-primary-100">
            <p className="text-sm font-semibold text-primary-800 mb-3">Lees ook</p>
            <ul className="space-y-2">
              {(pillar as any).internalLinks.filter((l: any) => l.label && l.slug).map((link: any, i: number) => (
                <li key={i}>
                  <Link href={`/blog/${link.slug}`} className="text-primary-600 hover:underline text-sm">
                    → {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Bronnen */}
        {(pillar as any).sources && (
          <div className="mt-2 mb-12 p-5 bg-stone-50 rounded-2xl border border-stone-200">
            <p className="text-xs font-semibold text-stone-400 uppercase tracking-wide mb-3">Bronnen</p>
            <ul className="space-y-1">
              {(pillar as any).sources.split("\n").filter(Boolean).map((source: string, i: number) => (
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

        {/* Artikelen */}
        {(articles as any[]).length > 0 && (
          <div>
            <h2 className="text-xl font-bold text-stone-800 mb-6">
              Artikelen over {pillar.title}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {(articles as any[]).map((post) => (
                <Link
                  key={post._id}
                  href={`/blog/${post.slug}`}
                  className="group bg-white rounded-2xl border border-stone-200 overflow-hidden hover:shadow-md transition-shadow"
                >
                  {post.coverImageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={post.coverImageUrl}
                      alt={post.title}
                      className="w-full h-40 object-cover"
                    />
                  )}
                  <div className="p-5">
                    {post.publishedAt && (
                      <p className="text-xs text-stone-400 mb-2">
                        {new Date(post.publishedAt).toLocaleDateString("nl-NL", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </p>
                    )}
                    <h3 className="font-semibold text-stone-800 leading-snug mb-2 group-hover:text-primary-600 transition-colors">
                      {post.title}
                    </h3>
                    {post.excerpt && (
                      <p className="text-sm text-stone-500 line-clamp-2">{post.excerpt}</p>
                    )}
                    <span className="mt-3 inline-block text-sm text-primary-600 border border-primary-200 px-3 py-1 rounded-lg">
                      Lees verder →
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {(articles as any[]).length === 0 && (
          <p className="text-stone-400 text-sm">Er zijn nog geen artikelen gepubliceerd onder dit thema.</p>
        )}

        {/* Auteur */}
        <div className="mt-12 p-5 bg-white rounded-2xl border border-stone-200 flex items-center gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/ien-founder.png"
            alt="Ien"
            className="w-16 h-16 rounded-full object-cover flex-shrink-0"
          />
          <div>
            <p className="font-semibold text-stone-800 text-sm">Ien</p>
            <p className="text-xs text-primary-600 mb-1">Founder van Talk To Benji</p>
            <p className="text-sm text-stone-500 leading-relaxed">
              Ien richtte Talk To Benji op na haar eigen ervaringen met verlies en rouw. Ze gelooft dat iedereen recht heeft op een luisterend oor — ook midden in de nacht.
            </p>
          </div>
        </div>

        <CtaBlockA data={ctaData} />
      </div>
      <SiteFooter variant="dark" />
    </div>
  );
}
