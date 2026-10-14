import type { Metadata } from "next";

// Eigen titel voor de contactpagina (anders erft hij de root-standaardtitel).
export const metadata: Metadata = {
  title: "Contact | Talk To Benji",
  description:
    "Vragen over Talk To Benji of hulp nodig? Neem contact met ons op, we denken graag met je mee.",
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}
