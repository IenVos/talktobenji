import type { Metadata } from "next";

// Eigen titel voor de Niet Alleen B-variant (anders erft hij de root-standaardtitel).
export const metadata: Metadata = {
  title: "Niet Alleen | Acht weken lang, om de dag een moment voor jou",
};

export default function NietAlleenBLayout({ children }: { children: React.ReactNode }) {
  return children;
}
