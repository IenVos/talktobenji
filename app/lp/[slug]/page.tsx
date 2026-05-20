import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import type { Metadata } from "next";
import { LandingPageView } from "@/components/LandingPageView";

type Props = { params: { slug: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const page = await fetchQuery(api.landingPages.getBySlug, { slug: params.slug }).catch(() => null);
  if (!page) return { robots: { index: false, follow: false } };
  return {
    title: page.pageTitle,
    description: (page as any).metaDescription || undefined,
    robots: { index: !(page as any).noindex, follow: true },
    alternates: { canonical: `https://www.talktobenji.com/lp/${page.slug}` },
  };
}

export default async function LandingPage({ params }: Props) {
  const page = await fetchQuery(api.landingPages.getBySlug, { slug: params.slug }).catch(() => null);

  return (
    <>
      {page?.heroTitle && (
        <h1 className="sr-only">{page.heroTitle}</h1>
      )}
      <LandingPageView slug={params.slug} />
    </>
  );
}
