import type { Metadata } from "next";
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";

type Props = { params: { slug: string } };

// Eigen titel per checkout, op basis van de productnaam uit Convex.
// Zonder dit erft elke betaalpagina de root-standaardtitel (dubbele <title>).
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const product = await fetchQuery(api.checkoutProducts.getBySlug, {
    slug: params.slug,
  }).catch(() => null);
  const naam = product?.name?.trim();
  return {
    title: naam
      ? `${naam} bestellen | Talk To Benji`
      : "Bestellen | Talk To Benji",
  };
}

export default function BetalenLayout({ children }: { children: React.ReactNode }) {
  return children;
}
