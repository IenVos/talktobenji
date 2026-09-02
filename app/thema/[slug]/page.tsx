import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import PillarView, { type AnchorEntry } from "@/components/pillar/PillarView";

export const revalidate = 60;

type Props = { params: { slug: string } };

// "waarom-benji" is een pillar, maar leeft op zijn eigen merk-URL /waarom-benji.
// Hier vangen we de thema-variant af zodat er geen dubbele URL ontstaat.
const EIGEN_URL_SLUGS: Record<string, string> = {
  "waarom-benji": "/waarom-benji",
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  if (EIGEN_URL_SLUGS[params.slug]) return { title: "Pagina niet gevonden" };
  const pillar = await fetchQuery(api.pillars.getBySlug, { slug: params.slug }).catch(() => null);
  if (!pillar || !pillar.isLive) return { title: "Pagina niet gevonden" };
  return {
    title: pillar.seoTitle || pillar.title,
    description: pillar.metaDescription || undefined,
    alternates: {
      canonical: `https://www.talktobenji.com/thema/${pillar.slug}`,
    },
    openGraph: {
      title: pillar.title,
      description: pillar.metaDescription || undefined,
      url: `https://www.talktobenji.com/thema/${pillar.slug}`,
      siteName: "Talk To Benji",
      type: "website",
    },
  };
}

export default async function PillarPage({ params }: Props) {
  const eigenUrl = EIGEN_URL_SLUGS[params.slug];
  if (eigenUrl) redirect(eigenUrl);

  const [pillar, articles] = await Promise.all([
    fetchQuery(api.pillars.getBySlug, { slug: params.slug }).catch(() => null),
    fetchQuery(api.pillars.getArticles, { pillarSlug: params.slug }).catch(() => []),
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
      canonicalUrl={`https://www.talktobenji.com/thema/${pillar.slug}`}
    />
  );
}
