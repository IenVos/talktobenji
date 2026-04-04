import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { HeaderBar } from "@/components/chat/HeaderBar";
import { SiteFooter } from "@/components/SiteFooter";

export const revalidate = 60;

type Props = { params: { slug: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const pillar = await fetchQuery(api.pillars.getBySlug, { slug: params.slug }).catch(() => null);
  if (!pillar || !pillar.isLive) return { title: "Pagina niet gevonden" };
  return {
    title: `Alle artikelen over ${pillar.title} — Talk To Benji`,
    description: `Overzicht van alle artikelen over ${pillar.title}. ${pillar.metaDescription || ""}`.trim(),
    alternates: {
      canonical: `https://www.talktobenji.com/thema/${pillar.slug}/artikelen`,
    },
  };
}

export default async function PillarArtikelenPage({ params }: Props) {
  const [pillar, articles] = await Promise.all([
    fetchQuery(api.pillars.getBySlug, { slug: params.slug }).catch(() => null),
    fetchQuery(api.pillars.getAllArticles, { pillarSlug: params.slug }).catch(() => []),
  ]);

  if (!pillar || !(pillar as any).isLive) notFound();

  const TINTS = ["#f0f7ff", "#fff5f5", "#fffbeb", "#f0fdf4", "#faf5ff", "#f0fdfa", "#fff7ed", "#f5f3ff"];
  const pillarSlugs = await fetchQuery(api.pillars.listSlugs, {}).catch(() => [] as string[]);
  const pillarIdx = (pillarSlugs as string[]).indexOf(params.slug);
  const tint = TINTS[pillarIdx % TINTS.length] ?? "#ffffff";

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col">
      <HeaderBar />
      <div className="max-w-6xl mx-auto px-4 py-12 flex-1 w-full">

        {/* Breadcrumb */}
        <nav className="text-xs text-stone-400 mb-8 flex items-center gap-1.5 flex-wrap">
          <Link href="/" className="hover:text-primary-600">Home</Link>
          <span>›</span>
          <Link href={`/thema/${pillar.slug}`} className="hover:text-primary-600">{(pillar as any).title}</Link>
          <span>›</span>
          <span className="text-stone-500">Alle artikelen</span>
        </nav>

        {/* Header */}
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-stone-800 mb-2">
            Alle artikelen over {(pillar as any).title}
          </h1>
          <p className="text-stone-500">
            {(articles as any[]).length} artikel{(articles as any[]).length !== 1 ? "en" : ""}
          </p>
        </div>

        {/* Grid */}
        {(articles as any[]).length === 0 ? (
          <p className="text-stone-400 text-center py-16">Nog geen artikelen gepubliceerd.</p>
        ) : (
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {(articles as any[]).map((post) => (
              <li key={post._id}>
                <Link
                  href={`/blog/${post.slug}`}
                  className="group flex flex-col h-full rounded-2xl border border-stone-200 overflow-hidden hover:shadow-md transition-shadow"
                  style={{ backgroundColor: tint }}
                >
                  {post.coverImageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={post.coverImageUrl} alt={post.title} className="w-full h-44 object-cover" />
                  )}
                  <div className="p-5 flex flex-col flex-1">
                    {post.publishedAt && (
                      <p className="text-xs text-stone-400 mb-2 flex items-center gap-1.5">
                        {new Date(post.publishedAt).toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric" })}
                        {post.content && (
                          <>
                            <span>·</span>
                            <span>{Math.max(1, Math.ceil(post.content.trim().split(/\s+/).length / 200))} min</span>
                          </>
                        )}
                      </p>
                    )}
                    <h2 className="text-base font-bold text-stone-800 mb-2 group-hover:text-primary-700 transition-colors leading-snug">
                      {post.title}
                    </h2>
                    {post.excerpt && (
                      <p className="text-stone-500 text-sm leading-relaxed line-clamp-3 flex-1">{post.excerpt}</p>
                    )}
                    <span className="inline-block mt-4 text-sm font-medium text-primary-600 border border-primary-600 rounded-lg px-4 py-2 group-hover:bg-primary-50 transition-colors">
                      Lees verder →
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}

        {/* Terug naar pillar */}
        <div className="mt-12 pt-8 border-t border-stone-200">
          <Link href={`/thema/${pillar.slug}`} className="text-sm text-primary-600 hover:text-primary-800 transition-colors">
            ← Terug naar {(pillar as any).title}
          </Link>
        </div>
      </div>
      <SiteFooter variant="dark" />
    </div>
  );
}
