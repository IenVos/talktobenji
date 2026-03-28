import { MetadataRoute } from "next";
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = "https://www.talktobenji.com";

  const [posts, pillars] = await Promise.all([
    fetchQuery(api.blogPosts.listPublished, {}).catch(() => [] as any[]),
    fetchQuery(api.pillars.listPublic, {}).catch(() => [] as any[]),
  ]);

  const staticPages: MetadataRoute.Sitemap = [
    { url: base, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: `${base}/prijzen`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.9 },
    { url: `${base}/waarom-benji`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/blog`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/faq`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/privacy`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
    { url: `${base}/algemene-voorwaarden`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
  ];

  const pillarPages: MetadataRoute.Sitemap = (pillars as any[]).map((p) => ({
    url: `${base}/thema/${p.slug}`,
    lastModified: new Date(p.updatedAt),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  const blogPages: MetadataRoute.Sitemap = (posts as any[]).map((p) => ({
    url: `${base}/blog/${p.slug}`,
    lastModified: new Date(p.updatedAt),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  return [...staticPages, ...pillarPages, ...blogPages];
}
