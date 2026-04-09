import Link from "next/link";

export const metadata = {
  title: "Privacybeleid — Niet Alleen",
};

export default function PrivacyPage() {
  return (
    <div style={{ minHeight: "100vh", background: "#fdf9f4" }}>
      <header className="flex items-center px-5 py-4" style={{ borderBottom: "1px solid rgba(0,0,0,0.07)" }}>
        <Link href="/" className="text-base font-semibold" style={{ color: "#3d3530" }}>
          Niet Alleen
        </Link>
      </header>

      <div className="max-w-2xl mx-auto px-5 py-12 space-y-6" style={{ color: "#3d3530" }}>
        <h1 className="text-2xl font-semibold">Privacybeleid</h1>

        <p className="text-sm leading-relaxed" style={{ color: "#6b6460" }}>
          Niet Alleen is een programma van Ien Vos, onderdeel van Talk To Benji. We gaan zorgvuldig om met je gegevens.
        </p>

        <div className="space-y-4 text-sm leading-relaxed" style={{ color: "#6b6460" }}>
          <div>
            <h2 className="font-semibold mb-1" style={{ color: "#3d3530" }}>Welke gegevens bewaren we?</h2>
            <p>Je naam, e-mailadres en wat je deelt binnen het programma. We delen dit nooit met derden.</p>
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
            <p>Vragen over je gegevens? Mail naar <a href="mailto:hallo@niet-alleen.nl" style={{ color: "#6d84a8" }}>hallo@niet-alleen.nl</a></p>
          </div>
        </div>
      </div>
    </div>
  );
}
