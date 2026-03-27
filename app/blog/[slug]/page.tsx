import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";

export const revalidate = 3600;

type Props = { params: { slug: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = await fetchQuery(api.blogPosts.getBySlug, { slug: params.slug }).catch(() => null);
  if (!post) return { title: "Artikel niet gevonden" };
  return {
    title: `${post.title} — Talk To Benji`,
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
  const paragraphs = content.split(/\n\n+/);
  return paragraphs.map((para, i) => {
    // Afbeelding
    const imgMatch = para.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
    if (imgMatch) {
      return (
        // eslint-disable-next-line @next/next/no-img-element
        <img key={i} src={imgMatch[2]} alt={imgMatch[1]} className="w-full rounded-xl my-6" />
      );
    }
    // Kop
    if (para.startsWith("# ")) {
      return <h2 key={i} className="text-2xl font-bold text-stone-800 mt-8 mb-3">{para.slice(2)}</h2>;
    }
    if (para.startsWith("## ")) {
      return <h3 key={i} className="text-xl font-semibold text-stone-800 mt-6 mb-2">{para.slice(3)}</h3>;
    }
    // Normale alinea met inline opmaak
    const lines = para.split("\n");
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

  // JSON-LD structured data voor Google (Article + FAQPage)
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.metaDescription || post.excerpt,
    datePublished: post.publishedAt ? new Date(post.publishedAt).toISOString() : undefined,
    image: post.coverImageUrl || undefined,
    author: { "@type": "Organization", name: "Talk To Benji" },
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
          {post.publishedAt && (
            <p className="text-sm text-stone-400 mb-3">
              {new Date(post.publishedAt).toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric" })}
            </p>
          )}
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

          {/* CTA */}
          <div className="mt-12 p-6 bg-primary-900 rounded-2xl text-center">
            <p className="text-white font-semibold text-lg mb-2">Praat met Benji</p>
            <p className="text-gray-300 text-sm mb-5">Een luisterend oor, dag en nacht beschikbaar.</p>
            <Link
              href="/"
              className="inline-block bg-white text-primary-900 font-semibold px-6 py-3 rounded-xl hover:bg-primary-50 transition-colors"
            >
              Begin een gesprek
            </Link>
          </div>
        </article>
      </div>
    </div>
  );
}
