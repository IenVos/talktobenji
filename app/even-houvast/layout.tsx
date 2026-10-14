import type { Metadata } from "next";

// Eigen titel voor Even Houvast (anders erft hij de root-standaardtitel).
export const metadata: Metadata = {
  title: "Even Houvast | Een gratis gids bij verlies en verdriet",
};

export default function EvenHouvastLayout({ children }: { children: React.ReactNode }) {
  return children;
}
