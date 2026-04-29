import type { Metadata } from "next";
import Link from "next/link";
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { CookieSettingsLink } from "@/components/chat/CookieSettingsLink";
import { HeaderBar } from "@/components/chat/HeaderBar";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Privacy - Talk To Benji",
  description: "Privacybeleid van Talk To Benji | hoe we met je gegevens omgaan",
};

type Section = { title: string; body: string };

function renderBody(text: string) {
  return text.split("\n\n").filter(Boolean).map((block, i) => {
    const lines = block.split("\n");
    if (lines.some((l) => l.startsWith("- "))) {
      const textLines = lines.filter((l) => !l.startsWith("- ") && l.trim());
      const bulletLines = lines.filter((l) => l.startsWith("- "));
      return (
        <div key={i} className="space-y-2">
          {textLines.map((l, j) => <p key={j}>{l}</p>)}
          <ul className="list-disc list-inside space-y-1 text-gray-700">
            {bulletLines.map((b, j) => <li key={j}>{b.slice(2)}</li>)}
          </ul>
        </div>
      );
    }
    return <p key={i}>{block.replace(/\n/g, " ")}</p>;
  });
}

export default async function PrivacyPage() {
  const saved = await fetchQuery(api.pageContent.getPublicPageContent, { pageKey: "privacy" }).catch(() => null);
  let sections: Section[] | null = null;
  if (saved?.sections) {
    try { sections = JSON.parse(saved.sections as string); } catch {}
  }

  return (
    <div className="min-h-screen bg-white">
      <HeaderBar />
      <main className="max-w-2xl mx-auto px-4 py-8 text-gray-700 text-sm leading-relaxed space-y-6">
        <h1 className="text-2xl font-semibold text-gray-900">Privacy</h1>

        {sections ? (
          <>
            <p>Talk To Benji neemt je privacy serieus. Hieronder leggen we uit wat we met je gegevens doen, en vooral: wat we er níét mee doen.</p>
            {sections.map((s, i) => (
              <section key={i} className="space-y-3">
                <h2 className="text-lg font-semibold text-gray-900">{s.title}</h2>
                {renderBody(s.body)}
                {s.title.toLowerCase().includes("cookie") && (
                  <p><CookieSettingsLink /></p>
                )}
              </section>
            ))}
          </>
        ) : (
          <>
            <p>
              Talk To Benji neemt je privacy serieus. Hieronder leggen we uit wat we met je gegevens doen, en vooral: wat we er níét mee doen. We verwerken je gegevens in overeenstemming met de Algemene Verordening Gegevensbescherming (AVG).
            </p>

            <section className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">Wie is verantwoordelijk voor je gegevens</h2>
              <p>
                Talk To Benji is een initiatief van <strong>[OFFICIËLE BEDRIJFSNAAM]</strong>, gevestigd aan [STRAAT EN HUISNUMMER], [POSTCODE EN PLAATSNAAM], ingeschreven bij de Kamer van Koophandel onder nummer [KVK-NUMMER]. Je kunt ons bereiken via{" "}
                <a href="mailto:contactmetien@talktobenji.com" className="text-primary-600 hover:text-primary-700 underline">
                  contactmetien@talktobenji.com
                </a>.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">Je gesprekken</h2>

              <div>
                <h3 className="font-medium text-gray-800 mb-1">Wat we opslaan</h3>
                <p>
                  Je gesprekken met Benji worden opgeslagen zodat je later kunt terugkomen en verder kunt praten. We slaan ook je e-mailadres op voor je account en (indien opgegeven) je naam.
                </p>
              </div>

              <div>
                <h3 className="font-medium text-gray-800 mb-1">Waarom we dat doen (rechtsgrond)</h3>
                <ul className="list-disc list-inside space-y-1 text-gray-700">
                  <li><strong>Gesprekken opslaan</strong>: uitvoering van de overeenkomst (je hebt een account aangemaakt om te kunnen praten)</li>
                  <li><strong>Verbetering van Benji</strong>: gerechtvaardigd belang — alleen met volledig geanonimiseerde data</li>
                  <li><strong>Nieuwsbrief of follow-upmail</strong>: jouw toestemming, die je altijd kunt intrekken</li>
                </ul>
              </div>

              <div>
                <h3 className="font-medium text-gray-800 mb-1">Wat we er níét mee doen</h3>
                <ul className="list-disc list-inside space-y-1 text-gray-700">
                  <li>We verkopen je gegevens niet</li>
                  <li>We delen ze niet met derden voor commerciële doeleinden</li>
                  <li>We gebruiken ze niet voor advertenties</li>
                  <li>Niemand leest je persoonlijke gesprekken mee</li>
                </ul>
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">Bijzondere persoonsgegevens — verdriet & verlies</h2>
              <p>
                De aard van onze dienstverlening brengt met zich mee dat je bij het gebruik van Benji mogelijk informatie deelt die betrekking heeft op je geestelijke gezondheid, rouw- en verliesverwerking. Dit zijn zogeheten <em>bijzondere persoonsgegevens</em> in de zin van de AVG.
              </p>
              <p>
                Door gebruik te maken van Benji en je verhaal te delen, geef je expliciete toestemming voor de verwerking van deze gegevens om je gesprekken op te slaan en de dienst aan jou te kunnen leveren. Je kunt deze toestemming op elk moment intrekken door je gesprekken te verwijderen of je account op te heffen. We gebruiken deze gegevens nooit voor andere doeleinden dan de directe dienstverlening aan jou.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">Benji en AI</h2>
              <p>
                Benji gebruikt AI om te reageren op wat je schrijft. Dit betekent:
              </p>
              <ul className="list-disc list-inside space-y-1 text-gray-700">
                <li>Je berichten worden verwerkt door een AI-model</li>
                <li>De AI heeft geen toegang tot eerdere gesprekken van andere gebruikers</li>
                <li>Elk gesprek staat op zichzelf</li>
                <li>Reacties van Benji zijn geen medisch of psychologisch advies</li>
              </ul>
              <p>
                We werken continu aan het verbeteren van Benji. Geanonimiseerde gesprekken — waaruit alle persoonlijke informatie is verwijderd — helpen ons daarbij.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">Partners en data buiten de EU</h2>
              <p>
                Om Benji te kunnen laten werken, maken we gebruik van de volgende dienstverleners (sub-verwerkers):
              </p>
              <ul className="list-disc list-inside space-y-1 text-gray-700">
                <li><strong>Anthropic</strong> — AI-technologie (VS)</li>
                <li><strong>Convex</strong> — dataopslag (VS)</li>
                <li><strong>Vercel</strong> — hosting (VS)</li>
                <li><strong>Stripe</strong> — betalingsverwerking (VS/EU)</li>
              </ul>
              <p>
                Hierdoor kan het voorkomen dat je (geanonimiseerde) gegevens worden verwerkt op servers buiten de Europese Unie, met name in de Verenigde Staten. Om te waarborgen dat je privacy daarbij altijd beschermd blijft, hebben we contractuele afspraken gemaakt via de door de Europese Commissie goedgekeurde modelcontractbepalingen (Standard Contractual Clauses, onderdeel van het EU-US Data Privacy Framework).
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">Hoe lang bewaren we je gegevens</h2>
              <p>
                We bewaren je gesprekken zolang je account actief is, zodat je ze zelf kunt terugvinden. Als je 24 maanden niet hebt ingelogd, verwijderen we je gegevens — tenzij je hebt aangegeven ze te willen bewaren.
              </p>
              <p>
                Wanneer je een gesprek verwijdert, heb je twee opties:
              </p>
              <ul className="list-disc list-inside space-y-1 text-gray-700">
                <li><strong>Volledig verwijderen</strong>: dan is het weg, ook voor verbetering van Benji</li>
                <li><strong>Anonimiseren</strong>: je gesprek wordt losgekoppeld van jou en kan (zonder enige persoonlijke details) worden gebruikt om Benji te verbeteren</li>
              </ul>
              <p>
                Betalingsgegevens bewaren we conform de wettelijke bewaarplicht van 7 jaar.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">Cookies</h2>
              <p>
                We gebruiken twee soorten cookies:
              </p>
              <ul className="list-disc list-inside space-y-1 text-gray-700">
                <li><strong>Noodzakelijke cookies</strong>: om je sessie te onthouden zodat je gesprek bewaard blijft</li>
                <li><strong>Analytische cookies</strong>: anonieme statistieken (zoals bezoekersaantallen) om de site te verbeteren — alleen met jouw toestemming</li>
              </ul>
              <p>
                We plaatsen geen advertentiecookies en volgen je niet op andere websites.
              </p>
              <p>
                <CookieSettingsLink />
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">Je rechten</h2>
              <p>
                Op grond van de AVG heb je de volgende rechten:
              </p>
              <ul className="list-disc list-inside space-y-1 text-gray-700">
                <li>Inzage in je gegevens</li>
                <li>Correctie van onjuiste gegevens</li>
                <li>Verwijdering van je gegevens ("recht op vergetelheid")</li>
                <li>Beperking van de verwerking</li>
                <li>Bezwaar tegen verwerking op grond van gerechtvaardigd belang</li>
                <li>Overdraagbaarheid van je gegevens</li>
                <li>Intrekking van toestemming (zonder dat dit gevolgen heeft voor eerdere verwerking)</li>
              </ul>
              <p>
                Je hebt ook het recht om een klacht in te dienen bij de toezichthoudende autoriteit: de{" "}
                <a href="https://www.autoriteitpersoonsgegevens.nl" target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:text-primary-700 underline">
                  Autoriteit Persoonsgegevens
                </a>.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">Contact</h2>
              <p>
                Vragen over je privacy of een verzoek indienen? Neem contact op via{" "}
                <a href="mailto:contactmetien@talktobenji.com" className="text-primary-600 hover:text-primary-700 underline">
                  contactmetien@talktobenji.com
                </a>. We reageren binnen 4 weken.
              </p>
            </section>
          </>
        )}

        <p className="text-xs text-gray-500 italic pt-4 border-t border-gray-200">
          Talk To Benji verwerkt gegevens volgens de AVG (Algemene Verordening Gegevensbescherming). We bewaren niet meer dan nodig en beschermen wat we bewaren.
        </p>

        <div className="flex flex-wrap gap-4 pt-4">
          <Link href="/benji" className="text-primary-600 hover:text-primary-700 font-medium">
            ← Terug naar Benji
          </Link>
          <Link href="/algemene-voorwaarden" className="text-primary-600 hover:text-primary-700 font-medium">
            Algemene voorwaarden
          </Link>
        </div>
      </main>
    </div>
  );
}
