import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import type { Metadata } from "next";
import { LandingPageView } from "@/components/LandingPageView";
import BlokPaginaView from "@/components/BlokPaginaView";

type Props = { params: { slug: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  // Nieuw blok-systeem heeft voorrang.
  const blok = await fetchQuery(api.blokPaginas.getBySlug, { slug: params.slug }).catch(() => null);
  if (blok) {
    return {
      title: blok.pageTitle,
      description: blok.metaDescription || undefined,
      robots: { index: true, follow: true },
      alternates: { canonical: `https://www.talktobenji.com/lp/${blok.slug}` },
    };
  }
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
  // Nieuw blok-systeem heeft voorrang; valt anders terug op de oude LP.
  const blok = await fetchQuery(api.blokPaginas.getBySlug, { slug: params.slug }).catch(() => null);
  if (blok) {
    return (
      <BlokPaginaView
        blocks={blok.blocks}
        slug={blok.slug}
        accentKleur={blok.accentKleur}
        ehPopup={{
          aan: (blok as any).ehPopupAan,
          tekst: (blok as any).ehPopupTekst,
          knopTekst: (blok as any).ehPopupKnopTekst,
          knopUrl: (blok as any).ehPopupKnopUrl,
          knopKleur: (blok as any).ehPopupKnopKleur,
        }}
      />
    );
  }

  const page = await fetchQuery(api.landingPages.getBySlug, { slug: params.slug }).catch(() => null);
  return (
    <>
      {page?.heroTitle && <h1 className="sr-only">{page.heroTitle}</h1>}
      <LandingPageView slug={params.slug} />
    </>
  );
}
