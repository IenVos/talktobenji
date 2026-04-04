import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import Link from "next/link";
import type { Metadata } from "next";
import { HeaderBar } from "@/components/chat/HeaderBar";
import { SiteFooter } from "@/components/SiteFooter";

export const metadata: Metadata = {
  title: "Samen Omgaan met Verdriet en Pijn — Talk To Benji",
  description: "Een plek waar je steun, begrip en praktische tips vindt om sterker door moeilijke tijden te komen.",
};

export const revalidate = 60;

// Zachte achtergrondtinten — elke pillar krijgt een unieke kleur op volgorde van aanmaak
const TINTS        = ["#f0f7ff","#fff5f5","#fffbeb","#f0fdf4","#faf5ff","#f0fdfa","#fff7ed","#f5f3ff"];
const TINT_BORDERS = ["#93c5fd","#fda4af","#fcd34d","#86efac","#d8b4fe","#5eead4","#fdba74","#c4b5fd"];

export default async function BlogOverviewPage() {
  const [posts, pillarSlugs] = await Promise.all([
    fetchQuery(api.blogPosts.listPublished, {}).catch(() => [] as any[]),
    fetchQuery(api.pillars.listSlugs, {}).catch(() => [] as string[]),
  ]);
  const pillarColorMap  = new Map((pillarSlugs as string[]).map((slug, i) => [slug, TINTS[i % TINTS.length]]));
  const pillarBorderMap = new Map((pillarSlugs as string[]).map((slug, i) => [slug, TINT_BORDERS[i % TINT_BORDERS.length]]));

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col">
      <HeaderBar />
      <div className="max-w-6xl mx-auto px-4 py-12 flex-1">
        <div className="mb-10 text-center">
          <h1 className="text-3xl sm:text-4xl font-bold text-stone-800 mb-3">Samen Omgaan met Verdriet en Pijn</h1>
          <p className="text-stone-500 text-lg leading-relaxed max-w-xl mx-auto">
            Een plek waar je steun, begrip en praktische tips vindt om sterker door moeilijke tijden te komen.
          </p>
        </div>

        {posts.length === 0 ? (
          <p className="text-stone-400 text-center py-16">Binnenkort verschijnen hier artikelen.</p>
        ) : (
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post: any) => {
              const cardBg     = pillarColorMap.get(post.pillarSlug) ?? "#ffffff";
              const cardBorder = pillarBorderMap.get(post.pillarSlug) ?? "#d6d3d1";
              return (
              <li key={post._id}>
                <Link href={`/blog/${post.slug}`} className="group flex flex-col h-full rounded-2xl border border-stone-200 overflow-hidden hover:shadow-md transition-shadow" style={{ backgroundColor: cardBg }}>
                  {post.coverImageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={post.coverImageUrl}
                      alt={post.title}
                      className="w-full h-44 object-cover"
                    />
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
                    <span className="inline-block mt-4 text-sm font-medium text-stone-700 rounded-lg px-4 py-2 transition-opacity group-hover:opacity-80"
                      style={{ backgroundColor: cardBg, border: `1.5px solid ${cardBorder}` }}>
                      Lees verder →
                    </span>
                  </div>
                </Link>
              </li>
              );
            })}
          </ul>
        )}
      </div>
      <SiteFooter variant="dark" />
    </div>
  );
}
