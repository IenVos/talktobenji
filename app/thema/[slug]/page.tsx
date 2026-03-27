import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";

export const revalidate = 3600;

type Props = { params: { slug: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const pillar = await fetchQuery(api.pillars.getBySlug, { slug: params.slug }).catch(() => null);
  if (!pillar || !pillar.isLive) return { title: "Pagina niet gevonden" };
  return {
    title: `${pillar.title} — Talk To Benji`,
    description: pillar.metaDescription || undefined,
    openGraph: {
      title: pillar.title,
      description: pillar.metaDescription || undefined,
      type: "website",
    },
  };
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

  return (
    <div className="min-h-screen bg-stone-50">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(pillarSchema) }}
      />

      <div className="max-w-3xl mx-auto px-4 py-12">
        <Link href="/blog" className="text-sm text-stone-400 hover:text-primary-600 mb-8 inline-block">
          ← Alle artikelen
        </Link>

        {/* Header */}
        <div className="mb-10">
          <h1 className="text-3xl sm:text-4xl font-bold text-stone-800 mb-4 leading-tight">
            {pillar.title}
          </h1>
          {pillar.metaDescription && (
            <p className="text-stone-500 text-lg leading-relaxed">{pillar.metaDescription}</p>
          )}
        </div>

        {/* Pillar content (optioneel) */}
        {pillar.content && (
          <div className="prose prose-stone max-w-none mb-12 text-stone-600 leading-relaxed">
            {pillar.content.split(/\n\n+/).map((para: string, i: number) => {
              if (para.startsWith("# ")) {
                return <h2 key={i} className="text-2xl font-bold text-stone-800 mt-8 mb-3">{para.slice(2)}</h2>;
              }
              if (para.startsWith("## ")) {
                return <h3 key={i} className="text-xl font-semibold text-stone-800 mt-6 mb-2">{para.slice(3)}</h3>;
              }
              return <p key={i} className="text-stone-600 leading-relaxed text-[17px]">{para}</p>;
            })}
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
