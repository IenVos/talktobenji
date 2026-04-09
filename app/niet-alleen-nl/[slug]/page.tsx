import { NietAlleenView } from "@/components/NietAlleenView";

export default function NietAlleenDynamicPage({ params }: { params: { slug: string } }) {
  return <NietAlleenView slug={`niet-alleen-${params.slug}`} />;
}
