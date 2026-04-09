import Link from "next/link";

export const metadata = {
  title: "Privacybeleid",
};

export default function PrivacyPage() {
  return (
    <div style={{ minHeight: "100vh", background: "#fdf9f4" }}>
      <header className="flex flex-col items-center pt-8 pb-4">
        <Link href="/">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/niet-alleen-logo.png" alt="Niet Alleen" width={80} height={80} />
        </Link>
      </header>

      <div className="max-w-2xl mx-auto px-5 py-8 space-y-6" style={{ color: "#3d3530" }}>
        <h1 className="text-2xl font-semibold">Privacybeleid</h1>

        <p className="text-sm leading-relaxed" style={{ color: "#6b6460" }}>
          Niet Alleen is een programma dat zorgvuldig omgaat met je gegevens.
        </p>

        <div className="space-y-4 text-sm leading-relaxed" style={{ color: "#6b6460" }}>
          <div>
            <h2 className="font-semibold mb-1" style={{ color: "#3d3530" }}>Welke gegevens bewaren we?</h2>
            <p>Je naam en e-mailadres. We delen dit nooit met derden.</p>
          </div>
          <div>
            <h2 className="font-semibold mb-1" style={{ color: "#3d3530" }}>Waarvoor gebruiken we je e-mailadres?</h2>
            <p>Alleen om je de dagelijkse berichten te sturen die bij het programma horen, en om te bevestigen dat je aankoop gelukt is.</p>
          </div>
          <div>
            <h2 className="font-semibold mb-1" style={{ color: "#3d3530" }}>Betalingen</h2>
            <p>Betalingen verlopen via Stripe. Wij zien alleen of de betaling gelukt is, niet je kaartgegevens.</p>
          </div>
          <div>
            <h2 className="font-semibold mb-1" style={{ color: "#3d3530" }}>Contact</h2>
            <p>Deelnemers kunnen altijd contact opnemen door te reageren op de dagelijkse mail die ze ontvangen. Wij lezen en beantwoorden elke reactie.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
