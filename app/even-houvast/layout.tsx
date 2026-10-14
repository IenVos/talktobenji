import type { Metadata } from "next";

// Eigen titel voor Even Houvast (anders erft hij de root-standaardtitel).
export const metadata: Metadata = {
  title: "Even Houvast | Een gratis gids bij verlies en verdriet",
  description:
    "Even Houvast is een gratis gids die je zachtjes door de eerste tijd na een verlies helpt. Vijf momenten om bij stil te staan, in je eigen tempo.",
};

export default function EvenHouvastLayout({ children }: { children: React.ReactNode }) {
  return children;
}
