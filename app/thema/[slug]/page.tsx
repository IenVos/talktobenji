import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { notFound } from "next/navigation";
import Link from "next/link";
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
    openGraph: {
      title: pillar.title,
      description: pillar.metaDescription || undefined,
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

function renderContent(content: string): React.ReactNode[] {
  const blocks = content.split(/\n\n+/);
  return blocks.map((block, i) => {
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
    if (lines.length > 0 && lines.every(l => l.startsWith("- "))) {
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
      <p key={i} className="text-stone-600 leading-relaxed text-[17px]">
        {lines.map((line, j) => <span key={j}>{j > 0 && <br />}{renderInline(line)}</span>)}
      </p>
    );
  });
}

export default async function PillarPage({ params }: Props) {
  const [pillar, articles] = await Promise.all([
    fetchQuery(api.pillars.getBySlug, { slug: params.slug }).catch(() => null),
    fetchQuery(api.pillars.getArticles, { pillarSlug: params.slug }).catch(() => []),
  ]);

  if (!pillar || !pillar.isLive) notFound();

  const pillarSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: pillar.title,
    description: pillar.metaDescription,
    url: `https://talktobenji.com/thema/${pillar.slug}`,
    hasPart: (articles as any[]).map((a) => ({
      "@type": "Article",
      headline: a.title,
      url: `https://talktobenji.com/blog/${a.slug}`,
      datePublished: a.publishedAt ? new Date(a.publishedAt).toISOString() : undefined,
    })),
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://talktobenji.com" },
      { "@type": "ListItem", position: 2, name: "Blog", item: "https://talktobenji.com/blog" },
      { "@type": "ListItem", position: 3, name: pillar.title, item: `https://talktobenji.com/thema/${pillar.slug}` },
    ],
  };

  return (
    <div className="min-h-screen bg-stone-50">
      <HeaderBar />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(pillarSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      <div className="max-w-3xl mx-auto px-4 py-12">
        <Link href="/blog" className="text-sm text-stone-400 hover:text-primary-600 mb-8 inline-block">
          ← Alle artikelen
        </Link>

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
        </div>

        {/* Pillar content (optioneel) */}
        {pillar.content && (
          <div className="mb-12 space-y-5">
            {renderContent(pillar.content)}
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

        {/* Bronnen */}
        {(pillar as any).sources && (
          <div className="mt-10 p-5 bg-stone-50 rounded-2xl border border-stone-200">
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

        {/* CTA */}
        <div className="mt-14 p-6 bg-white rounded-2xl border-2 border-primary-600 text-center">
          <p className="text-stone-800 font-semibold text-lg mb-2">Praat met Benji</p>
          <p className="text-stone-500 text-sm mb-5">Een luisterend oor, dag en nacht beschikbaar.</p>
          <Link
            href="/"
            className="inline-block bg-primary-600 text-white font-semibold px-6 py-3 rounded-xl hover:bg-primary-700 transition-colors"
          >
            Begin een gesprek
          </Link>
        </div>
      </div>
    </div>
  );
}
