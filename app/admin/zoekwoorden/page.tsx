"use client";

import { useAdminQuery } from "../AdminAuthContext";
import { api } from "@/convex/_generated/api";
import { ExternalLink, AlertTriangle } from "lucide-react";
import Link from "next/link";

export default function ZoekwoordenPage() {
  const posts = useAdminQuery(api.blogPosts.list, {}) as any[] | undefined;
  const pillars = useAdminQuery(api.pillars.list, {}) as any[] | undefined;

  if (!posts || !pillars) {
    return <div className="flex items-center justify-center h-40"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600" /></div>;
  }

  // Bouw keyword-map voor duplicate detectie
  const keywordMap = new Map<string, { type: "blog" | "pillar"; title: string; slug: string }[]>();

  for (const p of pillars) {
    const kw = (p.focusKeyword || "").toLowerCase().trim();
    if (kw) {
      if (!keywordMap.has(kw)) keywordMap.set(kw, []);
      keywordMap.get(kw)!.push({ type: "pillar", title: p.title, slug: p.slug });
    }
  }
  for (const p of posts) {
    const kw = (p.focusKeyword || "").toLowerCase().trim();
    if (kw) {
      if (!keywordMap.has(kw)) keywordMap.set(kw, []);
      keywordMap.get(kw)!.push({ type: "blog", title: p.title, slug: p.slug });
    }
  }

  const duplicates = new Set([...keywordMap.entries()].filter(([, v]) => v.length > 1).map(([k]) => k));

  // Groepeer blogs per pillar
  const pillarMap = new Map<string, any[]>();
  pillarMap.set("__geen__", []);
  for (const p of pillars) pillarMap.set(p.slug, []);
  for (const post of posts) {
    const key = post.pillarSlug || "__geen__";
    if (!pillarMap.has(key)) pillarMap.set(key, []);
    pillarMap.get(key)!.push(post);
  }

  const missingKw = [...posts, ...pillars].filter((p) => !p.focusKeyword?.trim()).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Zoekwoorden overzicht</h1>
        <p className="text-sm text-gray-500 mt-1">Alle pillar pagina's en blogart­ikelen met hun focuszoekwoord — spot duplicaten in één oogopslag</p>
      </div>

      {/* Waarschuwingen */}
      <div className="flex flex-wrap gap-3">
        {duplicates.size > 0 && (
          <div className="flex items-center gap-2 px-4 py-2.5 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
            <AlertTriangle size={15} />
            <strong>{duplicates.size}</strong> dubbel zoekwoord{duplicates.size > 1 ? "en" : ""} gevonden
          </div>
        )}
        {missingKw > 0 && (
          <div className="flex items-center gap-2 px-4 py-2.5 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700">
            <AlertTriangle size={15} />
            <strong>{missingKw}</strong> pagina{missingKw > 1 ? "'s" : ""} zonder focuszoekwoord
          </div>
        )}
        {duplicates.size === 0 && missingKw === 0 && (
          <div className="flex items-center gap-2 px-4 py-2.5 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700">
            ✓ Geen duplicaten gevonden
          </div>
        )}
      </div>

      {/* Per pillar */}
      {pillars.map((pillar) => {
        const blogs = pillarMap.get(pillar.slug) ?? [];
        const pillarKwDuplicate = pillar.focusKeyword && duplicates.has(pillar.focusKeyword.toLowerCase().trim());

        return (
          <div key={pillar._id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {/* Pillar header */}
            <div className="px-5 py-4 bg-primary-50 border-b border-primary-100 flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-xs font-semibold text-primary-700 uppercase tracking-wide">Pillar</span>
                <span className="font-semibold text-gray-900">{pillar.title}</span>
                <a href={`/thema/${pillar.slug}`} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-primary-600">
                  <ExternalLink size={13} />
                </a>
              </div>
              <div className="flex items-center gap-2">
                {pillar.focusKeyword ? (
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${pillarKwDuplicate ? "bg-red-100 text-red-700" : "bg-primary-100 text-primary-700"}`}>
                    {pillarKwDuplicate && "⚠ "}{pillar.focusKeyword}
                  </span>
                ) : (
                  <span className="text-xs px-2.5 py-1 rounded-full bg-amber-50 text-amber-600">geen zoekwoord</span>
                )}
                <Link href={`/admin/pillars`} className="text-xs text-gray-400 hover:text-primary-600">bewerken</Link>
              </div>
            </div>

            {/* Blogs */}
            {blogs.length > 0 ? (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left px-5 py-2 text-xs font-medium text-gray-500 w-2/5">Artikel</th>
                    <th className="text-left px-5 py-2 text-xs font-medium text-gray-500">Tags</th>
                    <th className="text-left px-5 py-2 text-xs font-medium text-gray-500">Focuszoekwoord</th>
                    <th className="px-5 py-2 text-xs font-medium text-gray-500 text-right">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {blogs.map((post: any) => {
                    const kwDuplicate = post.focusKeyword && duplicates.has(post.focusKeyword.toLowerCase().trim());
                    return (
                      <tr key={post._id} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2">
                            <span className="text-gray-800">{post.title}</span>
                            <a href={`/blog/${post.slug}`} target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-primary-600 flex-shrink-0">
                              <ExternalLink size={12} />
                            </a>
                          </div>
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex flex-wrap gap-1">
                            {post.tags?.length > 0
                              ? post.tags.map((tag: string) => (
                                  <span key={tag} className="text-[10px] px-1.5 py-0.5 bg-primary-50 text-primary-600 rounded-full">{tag}</span>
                                ))
                              : <span className="text-xs text-gray-300">—</span>
                            }
                          </div>
                        </td>
                        <td className="px-5 py-3">
                          {post.focusKeyword ? (
                            <span className={`text-xs px-2 py-0.5 rounded-full ${kwDuplicate ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-600"}`}>
                              {kwDuplicate && "⚠ "}{post.focusKeyword}
                            </span>
                          ) : (
                            <span className="text-xs text-amber-500">— ontbreekt</span>
                          )}
                        </td>
                        <td className="px-5 py-3 text-right">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${post.isLive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                            {post.isLive ? "live" : "concept"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <p className="px-5 py-4 text-sm text-gray-400 italic">Nog geen artikelen in deze pillar</p>
            )}
          </div>
        );
      })}

      {/* Artikelen zonder pillar */}
      {(pillarMap.get("__geen__") ?? []).length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 bg-gray-50 border-b border-gray-100">
            <span className="text-sm font-semibold text-gray-500">Zonder pillar</span>
          </div>
          <table className="w-full text-sm">
            <tbody>
              {(pillarMap.get("__geen__") ?? []).map((post: any) => {
                const kwDuplicate = post.focusKeyword && duplicates.has(post.focusKeyword.toLowerCase().trim());
                return (
                  <tr key={post._id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-5 py-3 w-2/5">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-800">{post.title}</span>
                        <a href={`/blog/${post.slug}`} target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-primary-600">
                          <ExternalLink size={12} />
                        </a>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex flex-wrap gap-1">
                        {post.tags?.length > 0
                          ? post.tags.map((tag: string) => (
                              <span key={tag} className="text-[10px] px-1.5 py-0.5 bg-primary-50 text-primary-600 rounded-full">{tag}</span>
                            ))
                          : <span className="text-xs text-gray-300">—</span>
                        }
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      {post.focusKeyword ? (
                        <span className={`text-xs px-2 py-0.5 rounded-full ${kwDuplicate ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-600"}`}>
                          {kwDuplicate && "⚠ "}{post.focusKeyword}
                        </span>
                      ) : (
                        <span className="text-xs text-amber-500">— ontbreekt</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${post.isLive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                        {post.isLive ? "live" : "concept"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
