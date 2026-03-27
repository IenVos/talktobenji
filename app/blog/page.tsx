import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blog — Talk To Benji",
  description: "Artikelen over rouw, verlies en omgaan met verdriet. Praktische inzichten voor wie zelf rouwt of iemand wil steunen.",
};

export const revalidate = 3600;

export default async function BlogOverviewPage() {
  const posts = await fetchQuery(api.blogPosts.listPublished, {}).catch(() => []);

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-stone-800 mb-3">Blog</h1>
          <p className="text-stone-500 text-lg leading-relaxed">
            Over rouw, verlies en omgaan met verdriet — voor wie zelf rouwt of iemand wil steunen.
          </p>
        </div>

        {posts.length === 0 ? (
          <p className="text-stone-400 text-center py-16">Binnenkort verschijnen hier artikelen.</p>
        ) : (
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post: any) => (
              <li key={post._id}>
                <Link href={`/blog/${post.slug}`} className="group flex flex-col h-full bg-white rounded-2xl border border-stone-200 overflow-hidden hover:shadow-md transition-shadow">
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
                      <p className="text-xs text-stone-400 mb-2">
                        {new Date(post.publishedAt).toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric" })}
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
      </div>
    </div>
  );
}
