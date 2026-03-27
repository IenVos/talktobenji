import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { HeaderBar } from "@/components/chat/HeaderBar";

export const revalidate = 3600;

type Props = { params: { slug: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = await fetchQuery(api.blogPosts.getBySlug, { slug: params.slug }).catch(() => null);
  if (!post) return { title: "Artikel niet gevonden" };
  return {
    title: post.seoTitle ? `${post.seoTitle} — Talk To Benji` : `${post.title} — Talk To Benji`,
    description: post.metaDescription || post.excerpt || undefined,
    openGraph: {
      title: post.title,
      description: post.metaDescription || post.excerpt || undefined,
      images: post.coverImageUrl ? [{ url: post.coverImageUrl }] : undefined,
      type: "article",
      publishedTime: post.publishedAt ? new Date(post.publishedAt).toISOString() : undefined,
    },
  };
}

function renderContent(content: string) {
  const blocks = content.split(/\n\n+/);
  return blocks.map((block, i) => {
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
      return <h3 key={i} className="text-xl font-semibold text-stone-800 mt-6 mb-2">{block.slice(3)}</h3>;
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
            <p key={j} className="text-stone-600 italic leading-relaxed text-[17px]">{renderInline(l.slice(2))}</p>
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
              <span className="text-stone-600 leading-relaxed text-[17px]">{renderInline(l.slice(2))}</span>
            </li>
          ))}
        </ul>
      );
    }
    // Opsomming met puntjes -
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
    // Normale alinea
    return (
      <p key={i} className="text-stone-600 leading-relaxed text-[17px]">
        {lines.map((line, j) => (
          <span key={j}>
            {j > 0 && <br />}
            {renderInline(line)}
          </span>
        ))}
      </p>
    );
  });
}

function renderInline(text: string): React.ReactNode {
  // Verwerk **vet** en [link](url)
  const parts: React.ReactNode[] = [];
  const regex = /(\*\*(.+?)\*\*|\[([^\]]+)\]\((https?:\/\/[^)]+)\))/g;
  let last = 0;
  let m;
  while ((m = regex.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    if (m[0].startsWith("**")) {
      parts.push(<strong key={m.index} className="font-semibold text-stone-800">{m[2]}</strong>);
    } else {
      parts.push(<a key={m.index} href={m[4]} className="text-primary-600 underline underline-offset-2">{m[3]}</a>);
    }
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

export default async function BlogPostPage({ params }: Props) {
  const post = await fetchQuery(api.blogPosts.getBySlug, { slug: params.slug }).catch(() => null);
  if (!post) notFound();

  const pillar = post.pillarSlug
    ? await fetchQuery(api.pillars.getBySlug, { slug: post.pillarSlug }).catch(() => null)
    : null;

  // JSON-LD structured data voor Google (Article + FAQPage)
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.metaDescription || post.excerpt,
    datePublished: post.publishedAt ? new Date(post.publishedAt).toISOString() : undefined,
    image: post.coverImageUrl || undefined,
    author: {
      "@type": "Person",
      name: "Ien",
      jobTitle: "Founder van Talk To Benji",
      url: "https://talktobenji.com",
    },
    publisher: { "@type": "Organization", name: "Talk To Benji", url: "https://talktobenji.com" },
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

      <div className="max-w-2xl mx-auto px-4 py-12">
        {/* Terug */}
        <Link href="/blog" className="text-sm text-stone-400 hover:text-primary-600 mb-8 inline-block">
          ← Alle artikelen
        </Link>

        {/* Header */}
        <article>
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            {post.publishedAt && (
              <p className="text-sm text-stone-400">
                {new Date(post.publishedAt).toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric" })}
              </p>
            )}
            {pillar && (
              <>
                {post.publishedAt && <span className="text-stone-300 text-sm">·</span>}
                <Link
                  href={`/thema/${pillar.slug}`}
                  className="text-xs text-stone-400 hover:text-primary-600 transition-colors"
                >
                  {pillar.title}
                </Link>
              </>
            )}
          </div>
          <h1 className="text-3xl font-bold text-stone-800 mb-6 leading-tight">{post.title}</h1>

          {post.coverImageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={post.coverImageUrl}
              alt={post.title}
              className="w-full rounded-2xl mb-8 object-cover max-h-80"
            />
          )}

          {/* Inhoud */}
          <div className="space-y-5">
            {renderContent(post.content)}
          </div>

          {/* Interne links */}
          {post.internalLinks && post.internalLinks.filter((l: any) => l.label && l.slug).length > 0 && (
            <div className="mt-10 p-5 bg-primary-50 rounded-2xl border border-primary-100">
              <p className="text-sm font-semibold text-primary-800 mb-3">Lees ook</p>
              <ul className="space-y-2">
                {post.internalLinks.filter((l: any) => l.label && l.slug).map((link: any, i: number) => (
                  <li key={i}>
                    <Link href={`/blog/${link.slug}`} className="text-primary-600 hover:underline text-sm">
                      → {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* FAQ */}
          {post.faqItems && post.faqItems.filter((f: any) => f.question && f.answer).length > 0 && (
            <div className="mt-10">
              <h2 className="text-xl font-bold text-stone-800 mb-5">Veelgestelde vragen</h2>
              <div className="space-y-4">
                {post.faqItems.filter((f: any) => f.question && f.answer).map((faq: any, i: number) => (
                  <details key={i} className="group bg-white rounded-xl border border-stone-200 p-5">
                    <summary className="font-semibold text-stone-800 cursor-pointer list-none flex justify-between items-center">
                      {faq.question}
                      <span className="text-stone-400 group-open:rotate-180 transition-transform">↓</span>
                    </summary>
                    <p className="mt-3 text-stone-600 leading-relaxed text-sm">{faq.answer}</p>
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

          {/* CTA */}
          <div className="mt-12 p-6 bg-white rounded-2xl border-2 border-primary-600 text-center">
            <p className="text-stone-800 font-semibold text-lg mb-2">Praat met Benji</p>
            <p className="text-stone-500 text-sm mb-5">Een luisterend oor, dag en nacht beschikbaar.</p>
            <Link
              href="/"
              className="inline-block bg-primary-600 text-white font-semibold px-6 py-3 rounded-xl hover:bg-primary-700 transition-colors"
            >
              Begin een gesprek
            </Link>
          </div>
        </article>
      </div>
    </div>
  );
}
