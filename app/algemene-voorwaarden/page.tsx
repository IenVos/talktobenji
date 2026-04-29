import type { Metadata } from "next";
import Link from "next/link";
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { HeaderBar } from "@/components/chat/HeaderBar";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Algemene voorwaarden - Talk To Benji",
  description: "Algemene voorwaarden van Talk To Benji",
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

export default async function AlgemeneVoorwaardenPage() {
  const saved = await fetchQuery(api.pageContent.getPublicPageContent, { pageKey: "av" }).catch(() => null);
  let sections: Section[] | null = null;
  if (saved?.sections) {
    try { sections = JSON.parse(saved.sections as string); } catch {}
  }

  return (
    <div className="min-h-screen bg-white">
      <HeaderBar />
      <main className="max-w-2xl mx-auto px-4 py-8 text-gray-700 text-sm leading-relaxed space-y-6">
        <h1 className="text-2xl font-semibold text-gray-900">Algemene voorwaarden</h1>

        {sections ? (
          <>
            <p>Door Talk To Benji te gebruiken ga je akkoord met deze voorwaarden.</p>
            {sections.map((s, i) => (
              <section key={i} className="space-y-3">
                <h2 className="text-lg font-semibold text-gray-900">{s.title}</h2>
                {renderBody(s.body)}
              </section>
            ))}
          </>
        ) : (
          <>
            <p>
              Door Talk To Benji te gebruiken ga je akkoord met deze voorwaarden. Talk To Benji is een initiatief van <strong>LAAV</strong>, gevestigd te Hässleholm, Zweden, organisatienummer 671123-0422, btw-nummer SE671123042201.
            </p>

            <section className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">Wat Benji is</h2>
              <p>
                Benji is een AI-ondersteunde gesprekspartner die een luisterend oor biedt voor mensen die te maken hebben met verlies of verdriet. Benji is er om te luisteren, niet om te oordelen.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">Wat Benji niet is — medische disclaimer</h2>
              <p>
                Benji is <strong>geen vervanging</strong> voor:
              </p>
              <ul className="list-disc list-inside space-y-1 text-gray-700">
                <li>Professionele hulpverlening, psychotherapie of psychiatrie</li>
                <li>Medisch of psychologisch advies</li>
                <li>Contact met vrienden, familie of naasten</li>
                <li>Crisisinterventie of spoedhulp</li>
              </ul>
              <p>
                De inhoud van gesprekken met Benji is uitsluitend bedoeld als emotionele ondersteuning en mag niet worden beschouwd als medisch, psychologisch of therapeutisch advies. Bij ernstige psychische klachten of crisis raden we je sterk aan contact op te nemen met een professional.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">Professionele hulp en crisis</h2>
              <p>
                Benji herkent signalen waarbij professionele hulp nodig kan zijn en verwijst je dan door. Bij crisis kun je direct terecht bij:
              </p>
              <ul className="list-disc list-inside space-y-1 text-gray-700">
                <li>
                  <strong>113 Zelfmoordpreventie</strong> — bel 113 of 0800-0113 (gratis, 24/7), of chat via{" "}
                  <a href="https://www.113.nl" target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:text-primary-700 underline">113.nl</a>
                </li>
                <li><strong>Huisarts of POH-GGZ</strong> — voor professionele begeleiding</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">Leeftijd</h2>
              <p>
                Talk To Benji is uitsluitend bestemd voor personen van 18 jaar of ouder. Door je te registreren verklaar je minimaal 18 jaar oud te zijn.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">Abonnement en betaling</h2>
              <p>
                Talk To Benji biedt toegang via een eenmalige betaling of abonnement. Na je aankoop:
              </p>
              <ul className="list-disc list-inside space-y-1 text-gray-700">
                <li>Ontvang je direct toegang tot de dienst</li>
                <li>Wordt de betaling verwerkt via Stripe</li>
              </ul>
              <p>
                Prijswijzigingen worden minimaal 30 dagen van tevoren aangekondigd via e-mail.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">Herroepingsrecht</h2>
              <p>
                Als consument heb je in principe het recht om een aankoop binnen 14 dagen zonder opgave van reden te herroepen. Voor digitale diensten die direct na aankoop worden geleverd, vervalt dit herroepingsrecht zodra de dienst is gestart — mits je daar bij de aankoop uitdrukkelijk mee hebt ingestemd en hebt bevestigd dat je daarmee het herroepingsrecht verliest.
              </p>
              <p>
                Door je aankoop af te ronden en de dienst direct te gebruiken, geef je die toestemming. Heb je de dienst nog niet gebruikt en wil je van je aankoop af? Neem dan binnen 14 dagen na aankoop contact op via{" "}
                <a href="mailto:contactmetien@talktobenji.com" className="text-primary-600 hover:text-primary-700 underline">
                  contactmetien@talktobenji.com
                </a>.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">Je gesprekken en privacy</h2>
              <p>
                Je gesprekken worden opgeslagen zodat je later verder kunt praten. We gebruiken uitsluitend volledig geanonimiseerde data om Benji te verbeteren. Lees ons{" "}
                <Link href="/privacy" className="text-primary-600 hover:text-primary-700 underline">
                  privacybeleid
                </Link>
                {" "}voor alle details over hoe we met je gegevens omgaan.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">Aansprakelijkheid</h2>
              <p>
                We doen ons best om Benji zo behulpzaam mogelijk te maken, maar:
              </p>
              <ul className="list-disc list-inside space-y-1 text-gray-700">
                <li>Benji kan fouten maken of iets verkeerd begrijpen</li>
                <li>Benji is niet altijd beschikbaar (bij technische storingen)</li>
                <li>Reacties van Benji zijn geen professioneel, medisch of therapeutisch advies</li>
              </ul>
              <p>
                De aansprakelijkheid van Talk To Benji is te allen tijde beperkt tot het bedrag dat je voor de dienst hebt betaald. Talk To Benji is niet aansprakelijk voor indirecte schade, gevolgschade of emotionele schade die voortvloeit uit het gebruik van de dienst.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">Gebruik</h2>
              <p>
                Je mag Benji gebruiken voor persoonlijke ondersteuning bij verdriet en verlies. Je mag Benji niet gebruiken om:
              </p>
              <ul className="list-disc list-inside space-y-1 text-gray-700">
                <li>Anderen te schaden of te intimideren</li>
                <li>De dienst te misbruiken of te verstoren</li>
                <li>Illegale activiteiten te ondersteunen</li>
                <li>Inhoud te genereren die schadelijk, discriminerend of onrechtmatig is</li>
              </ul>
              <p>
                Bij misbruik behouden wij het recht je toegang te beëindigen zonder restitutie.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">Wijzigingen</h2>
              <p>
                We kunnen deze voorwaarden aanpassen. Bij materiële wijzigingen informeren we je minimaal 30 dagen van tevoren per e-mail. Door de dienst na die datum te blijven gebruiken, accepteer je de nieuwe voorwaarden.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">Toepasselijk recht en geschillen</h2>
              <p>
                Op deze voorwaarden is Zweeds recht van toepassing. Geschillen worden bij voorkeur in onderling overleg opgelost. Lukt dat niet, dan is de bevoegde rechtbank in Hässleholm, Zweden bevoegd. Als consument kun je ook gebruik maken van het Europese ODR-platform voor online geschillenbeslechting:{" "}
                <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:text-primary-700 underline">
                  ec.europa.eu/consumers/odr
                </a>.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">Contact</h2>
              <p>
                Vragen over deze voorwaarden? Neem contact op via{" "}
                <a href="mailto:contactmetien@talktobenji.com" className="text-primary-600 hover:text-primary-700 underline">
                  contactmetien@talktobenji.com
                </a>
                .
              </p>
            </section>
          </>
        )}

        <p className="text-xs text-gray-500 italic pt-4 border-t border-gray-200">
          Versie: 29 april 2026. Talk To Benji is een initiatief om mensen te ondersteunen in moeilijke tijden. We geloven dat iedereen een luisterend oor verdient.
        </p>

        <div className="flex flex-wrap gap-4 pt-4">
          <Link href="/benji" className="text-primary-600 hover:text-primary-700 font-medium">
            ← Terug naar Benji
          </Link>
          <Link href="/privacy" className="text-primary-600 hover:text-primary-700 font-medium">
            Privacy
          </Link>
        </div>
      </main>
    </div>
  );
}
