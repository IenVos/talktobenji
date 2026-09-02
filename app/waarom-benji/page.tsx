import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import PillarView, { type AnchorEntry } from "@/components/pillar/PillarView";

export const revalidate = 60;

const SLUG = "waarom-benji";
const CANONICAL = "https://www.talktobenji.com/waarom-benji";

export async function generateMetadata(): Promise<Metadata> {
  const pillar = await fetchQuery(api.pillars.getBySlug, { slug: SLUG }).catch(() => null);
  if (!pillar || !pillar.isLive) return { title: "Waarom Benji" };
  return {
    title: pillar.seoTitle || pillar.title,
    description: pillar.metaDescription || undefined,
    alternates: { canonical: CANONICAL },
    openGraph: {
      title: pillar.title,
      description: pillar.metaDescription || undefined,
      url: CANONICAL,
      siteName: "Talk To Benji",
      type: "website",
    },
  };
}

// Waarom Benji is een merk/oplossing-pillar. Hij leeft in de pillars-tabel (admin-bewerkbaar,
// auto-linking), maar rendert op zijn eigen merk-URL /waarom-benji i.p.v. /thema/waarom-benji.
export default async function WaaromBenjiPage() {
  const [pillar, articles] = await Promise.all([
    fetchQuery(api.pillars.getBySlug, { slug: SLUG }).catch(() => null),
    fetchQuery(api.pillars.getArticles, { pillarSlug: SLUG }).catch(() => []),
  ]);

  if (!pillar || !pillar.isLive) notFound();

  const [allCtas, blogAnchorData, pillarAnchorData] = await Promise.all([
    fetchQuery(api.ctaBlocks.listAll, {}).catch(() => [] as any[]),
    fetchQuery(api.blogPosts.listAnchorData, {}).catch(() => [] as any[]),
    fetchQuery(api.pillars.listAnchorData, {}).catch(() => [] as any[]),
  ]);
  const anchorData = [...(blogAnchorData as any[]), ...(pillarAnchorData as any[])] as AnchorEntry[];
  const ctaMap = new Map((allCtas as any[]).map((c: any) => [c.key, c]));
  const ctaData = ctaMap.get((pillar as any).ctaKey || "pillar_default") ?? ctaMap.get("pillar_default") ?? null;

  return (
    <PillarView
      pillar={pillar}
      articles={articles as any[]}
      ctaData={ctaData}
      ctaMap={ctaMap}
      anchorData={anchorData}
      canonicalUrl={CANONICAL}
      showBottomCta={(pillar as any).ctaKey !== "none"}
    />
  );
}
