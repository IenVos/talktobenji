import Link from "next/link";
import Image from "next/image";

export const metadata = {
  title: "Gelukt! — Niet Alleen",
};

export default function BedanktPage() {
  return (
    <div style={{ minHeight: "100vh", background: "#fdf9f4", position: "relative" }}>
      <div style={{ position: "fixed", inset: 0, zIndex: 0 }}>
        <Image src="/images/achtergrond.png" alt="" fill className="object-cover" priority />
        <div style={{ position: "absolute", inset: 0, background: "rgba(253,249,244,0.88)" }} />
      </div>

      <div style={{ position: "relative", zIndex: 1 }}>
        <header className="flex items-center px-5 py-4">
          <Link href="/" className="text-base font-semibold" style={{ color: "#3d3530" }}>
            Niet Alleen
          </Link>
        </header>

        <section className="flex items-center justify-center px-5 pt-16 pb-20">
          <div className="w-full max-w-md text-center">
            <div className="rounded-2xl p-8 sm:p-10" style={{ background: "rgba(255,255,255,0.90)", boxShadow: "0 2px 24px rgba(0,0,0,0.09)" }}>
              <p className="text-3xl mb-4">🌿</p>
              <h1 className="text-2xl font-semibold mb-4 leading-snug" style={{ color: "#3d3530" }}>
                Welkom bij Niet Alleen.
              </h1>
              <p className="text-sm leading-relaxed mb-3" style={{ color: "#6b6460" }}>
                Je ontvangt zo een bevestiging per e-mail van Ien.
              </p>
              <p className="text-sm leading-relaxed" style={{ color: "#6b6460" }}>
                Je eerste dag begint morgenochtend. Fijn dat je er bent.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
