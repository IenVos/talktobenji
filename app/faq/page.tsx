import type { Metadata } from "next";
import Link from "next/link";
import { HeaderBar } from "@/components/chat/HeaderBar";
import { FounderLink } from "@/components/chat/FounderLink";

export const metadata: Metadata = {
  title: "Veelgestelde vragen · Talk To Benji",
  description: "Antwoorden op veelgestelde vragen over Talk To Benji, Benji de AI-chatbot bij verlies en verdriet",
};

function FaqSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-900 pt-6 first:pt-0">{title}</h2>
      {children}
    </section>
  );
}

function FaqItem({ question, children }: { question: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <h3 className="font-medium text-gray-800">{question}</h3>
      <div className="text-gray-700 space-y-2">{children}</div>
    </div>
  );
}

export default function FaqPage() {
  return (
    <div className="min-h-screen bg-white">
      <HeaderBar />
      <main className="max-w-2xl mx-auto px-4 py-8 text-gray-700 text-sm leading-relaxed space-y-6">
        <h1 className="text-2xl font-semibold text-gray-900">Veelgestelde vragen</h1>

        <FaqSection title="Over Benji">
          <FaqItem question="Wat is Talk To Benji?">
            <p>
              Talk To Benji is een AI-chatbot speciaal ontwikkeld voor mensen die met verlies, verdriet of moeilijke emoties omgaan. Benji biedt een luisterend oor wanneer je dat nodig hebt: dag en nacht, zonder oordeel. Het is bedoeld als aanvullende steun, niet als vervanging van professionele hulp of menselijk contact.
            </p>
          </FaqItem>
          <FaqItem question="Wie heeft Benji gemaakt en waarom?">
            <p>
              Benji is ontwikkeld door <FounderLink label="Ien" />, uit persoonlijke ervaring met verlies en het besef dat verdriet niet altijd past in kantooruren of beschikbaarheid van vrienden en familie. We merkten dat algemene chatbots niet de zachtheid en het begrip boden die nodig zijn bij rouw, daarom maakten we Benji: een plek waar je verhaal er altijd toe doet.
            </p>
          </FaqItem>
          <FaqItem question="Is Benji een echte persoon?">
            <p>
              Nee, Benji is een AI-chatbot aangedreven door geavanceerde taalmodellen. Benji is getraind op gesprekken over verlies, rouw en verdriet, en wordt continu verbeterd om empathisch en begripvol te reageren. Hoewel Benji geen mens is, is de technologie ontwikkeld om met zorg en respect te luisteren naar je verhaal.
            </p>
          </FaqItem>
          <FaqItem question="Voor wie is Benji bedoeld?">
            <p>Benji is er voor iedereen die:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Iemand heeft verloren (partner, ouder, kind, vriend, huisdier)</li>
              <li>Worstelt met verdriet of eenzaamheid</li>
              <li>Graag wil praten maar zich schuldig voelt anderen te belasten</li>
              <li>Midden in de nacht steun zoekt wanneer niemand beschikbaar is</li>
              <li>Moeite heeft om over gevoelens te praten met mensen in hun omgeving</li>
              <li>Een veilige, neutrale plek zoekt om gedachten te ordenen</li>
            </ul>
          </FaqItem>
          <FaqItem question="Voor wie is Benji NIET bedoeld?">
            <p>Benji is niet geschikt als primaire hulp bij acute crisis of zelfmoordgedachten (bel 113), ernstige depressie of angst, trauma dat therapie vereist, of situaties waarbij medicatie of klinische zorg nodig is. Benji kan wel een aanvulling zijn naast professionele hulp, maar vervangt deze nooit. Zie de snelle links voor hulp onderaan bij crisis.</p>
          </FaqItem>
        </FaqSection>

        <FaqSection title="Hoe het werkt">
          <FaqItem question="Hoe start ik een gesprek met Benji?">
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Klik op een van de gespreksonderwerpen op de homepage, of typ je eigen vraag</li>
              <li>Benji reageert en het gesprek begint</li>
              <li>Je kunt schrijven wat je voelt, vragen stellen, of gewoon je verhaal delen</li>
              <li>Er is geen tijdslimiet: praat zo lang als je wilt</li>
            </ul>
          </FaqItem>
          <FaqItem question="Kan ik op elk moment van de dag met Benji praten?">
            <p>Ja, Benji is 24/7 beschikbaar. Of het nu 3 uur &apos;s nachts is of midden op de dag: Benji is er wanneer jij het nodig hebt.</p>
          </FaqItem>
          <FaqItem question="Hoe weet Benji wat hij moet zeggen?">
            <p>
              Benji is getraind op duizenden gesprekken over verlies, rouw en emotionele uitdagingen. De AI herkent context, emoties en nuances in wat je schrijft, en reageert met empathie en begrip. Benji wordt continu verbeterd op basis van gesprekken (volledig geanonimiseerd) om beter te worden in het bieden van steun.
            </p>
          </FaqItem>
          <FaqItem question="Begrijpt Benji mijn specifieke situatie?">
            <p>
              Benji is ontworpen om te luisteren naar jouw unieke verhaal. Elk verlies is anders: of je nu je partner hebt verloren, een huisdier mist, of worstelt met eenzaamheid, Benji past zijn reacties aan op wat jij deelt. Hoe meer je vertelt, hoe beter Benji kan inspelen op jouw specifieke situatie.
            </p>
          </FaqItem>
          <FaqItem question="Kan ik meerdere gesprekken voeren?">
            <p>
              Ja, je kunt zoveel gesprekken voeren als je wilt. Elk gesprek wordt apart opgeslagen, zodat je later terug kunt lezen wat je hebt gedeeld. Je kunt ook een eerder gesprek voortzetten.
            </p>
          </FaqItem>
          <FaqItem question="Kan ik een gesprek pauzeren en later hervatten?">
            <p>
              Ja, je kunt op elk moment stoppen en later terugkomen. Je eerdere gesprekken worden bewaard in &quot;Mijn gesprekken&quot; zodat je kunt doorgaan waar je was gebleven, of een nieuw gesprek kunt starten.
            </p>
          </FaqItem>
          <FaqItem question="Wat als Benji iets zegt dat niet klopt of niet helpt?">
            <p>
              Benji is AI en kan soms iets zeggen dat niet helemaal past bij jouw situatie. Je mag dit altijd aangeven in het gesprek (&quot;Dit voelt niet goed&quot;, &quot;Dat klopt niet voor mij&quot;) en Benji zal proberen anders te reageren. Je kunt ook feedback geven via{" "}
              <a href="mailto:contactmetien@talktobenji.com" className="text-primary-600 hover:underline">contactmetien@talktobenji.com</a>, zodat we Benji kunnen verbeteren.
            </p>
          </FaqItem>
          <FaqItem question="Kan ik in het Nederlands praten?">
            <p>
              Ja, Benji is volledig Nederlandstalig. Je kunt gewoon schrijven zoals je normaal zou praten: formeel of informeel, met of zonder hoofdletters. Benji begrijpt je.
            </p>
          </FaqItem>
        </FaqSection>

        <FaqSection title="Privacy & Veiligheid">
          <FaqItem question="Zijn mijn gesprekken echt privé?">
            <p>Ja, absoluut. Jouw gesprekken met Benji zijn:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Versleuteld tijdens transport (HTTPS) en bij opslag</li>
              <li>Niet zichtbaar voor andere gebruikers</li>
              <li>Niet gedeeld met derden</li>
              <li>Niet gebruikt voor marketing of commerciële doeleinden</li>
            </ul>
            <p>Alleen jij hebt toegang tot jouw gesprekken.</p>
          </FaqItem>
          <FaqItem question="Wie kan mijn gesprekken lezen?">
            <p>
              Niemand. Jouw gesprekken zijn privé en alleen toegankelijk voor jou via jouw inloggegevens. Medewerkers van <FounderLink /> kunnen geen individuele gesprekken inzien. We gebruiken alleen geanonimiseerde, geaggregeerde data om Benji te verbeteren.
            </p>
          </FaqItem>
          <FaqItem question="Waar worden mijn gegevens opgeslagen?">
            <p>
              Alle data wordt veilig opgeslagen op servers binnen de Europese Unie, conform AVG (GDPR) wetgeving. We gebruiken industriestandaard encryptie om je data te beschermen.
            </p>
          </FaqItem>
          <FaqItem question="Wat gebeurt er met mijn data als ik mijn account verwijder?">
            <p>
              Als je je account verwijdert, worden al je gesprekken en persoonlijke gegevens permanent verwijderd uit onze systemen binnen 30 dagen. Je kunt dit op elk moment doen via je accountinstellingen.
            </p>
          </FaqItem>
          <FaqItem question="Gebruikt Benji mijn gesprekken om te leren?">
            <p>
              Ja, maar volledig geanonimiseerd. We gebruiken geaggregeerde data (zonder persoonlijke informatie of herkenbare details) om Benji&apos;s reacties te verbeteren. Jouw specifieke verhaal of persoonlijke details worden nooit gedeeld of gebruikt op een manier die naar jou te herleiden is.
            </p>
          </FaqItem>
          <FaqItem question="Kan ik vertrouwen dat mijn verhaal veilig is?">
            <p>
              Ja. Zie hierboven bij &quot;Zijn mijn gesprekken echt privé?&quot; en &quot;Wie kan mijn gesprekken lezen?&quot;. We nemen privacy extreem serieus, juist omdat gesprekken over verlies en verdriet zo gevoelig zijn.
            </p>
          </FaqItem>
          <FaqItem question="Wat als ik in crisis ben: belt Benji dan de hulpdiensten?">
            <p>
              Nee, Benji kan niet bellen of hulpdiensten waarschuwen. Als je in acute crisis bent of zelfmoordgedachten hebt, moet je zelf contact opnemen met:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>113 Zelfmoordpreventie: 0800-0113 (24/7 gratis)</li>
              <li>Huisarts spoedlijn: via je eigen huisartsenpraktijk</li>
              <li>112: bij directe levensbedreigende situaties</li>
            </ul>
            <p>Benji zal je wel aanmoedigen om hulp te zoeken als je aangeeft in crisis te zijn.</p>
          </FaqItem>
        </FaqSection>

        <FaqSection title="Kosten & Abonnementen">
          <FaqItem question="Wat kost Talk To Benji?">
            <p>
              Je kunt Benji altijd even proberen voordat je een account aanmaakt. Met een gratis account kun je tot 10 gesprekken per maand voeren. Wil je Benji vaker gebruiken en toegang tot extra functies zoals reflecties en doelen? Dan zijn er twee betaalde opties:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-2 mt-2">
              <li><strong>Benji Uitgebreid</strong> — €6,99 per maand (of €54 per jaar): onbeperkte gesprekken, reflecties, doelen en check-ins</li>
              <li><strong>Benji Alles in 1</strong> — €11,99 per maand (of €89 per jaar): alles van Uitgebreid plus memories, inspiratie en handreikingen</li>
            </ul>
            <p className="mt-2">
              <a href="/prijzen" className="text-primary-600 hover:text-primary-700 underline">Bekijk alle opties en prijzen →</a>
            </p>
          </FaqItem>
          <FaqItem question="Is er een gratis versie?">
            <p>
              Ja, je kunt Benji gebruiken met een gratis account. Je krijgt dan tot 10 gesprekken per maand en je gesprekken worden bewaard. Dit is perfect om Benji te proberen en te kijken of het bij je past. Voor onbeperkte gesprekken en extra functies zoals reflecties en doelen heb je een betaald abonnement nodig.
            </p>
          </FaqItem>
          <FaqItem question="Waarom kost Benji geld?">
            <p>
              AI technologie kost geld per gesprek (API kosten), hosting, onderhoud en doorontwikkeling. Om Benji goed en veilig te houden en door te kunnen ontwikkelen, hebben we inkomsten nodig. We proberen de prijzen zo toegankelijk mogelijk te houden, zodat zoveel mogelijk mensen gebruik kunnen maken van Benji wanneer ze het nodig hebben.
            </p>
          </FaqItem>
          <FaqItem question="Kan ik maandelijks opzeggen?">
            <p>
              Ja, wanneer we het abonnement introduceren kun je op elk moment opzeggen. Er is geen minimale looptijd of opzegtermijn. Stop wanneer je wilt, geen vragen gesteld.
            </p>
          </FaqItem>
          <FaqItem question="Hoe betaal ik?">
            <p>Wanneer we het abonnement introduceren, kun je betalen via:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>iDEAL</li>
              <li>Creditcard (Visa, Mastercard)</li>
              <li>PayPal</li>
            </ul>
            <p>Alle betalingen worden veilig verwerkt via gerenommeerde betaalproviders.</p>
          </FaqItem>
          <FaqItem question="Kan ik een factuur krijgen?">
            <p>
              Ja, na elke betaling ontvang je automatisch een factuur per email. Je kunt ook eerdere facturen downloaden via je accountinstellingen.
            </p>
          </FaqItem>
          <FaqItem question="Bieden jullie kortingen voor studenten of mensen in een moeilijke financiële situatie?">
            <p>
              We begrijpen dat niet iedereen €4,99 per maand kan betalen. Neem contact met ons op via{" "}
              <a href="mailto:contactmetien@talktobenji.com" className="text-primary-600 hover:underline">contactmetien@talktobenji.com</a> als financiën een barrière vormen: we denken graag mee over oplossingen.
            </p>
          </FaqItem>
        </FaqSection>

        <FaqSection title="Over verlies en rouw">
          <FaqItem question="Ik heb net iemand verloren: kan Benji me nu al helpen?">
            <p>
              Ja. Benji is er juist voor de momenten direct na een verlies, wanneer alles overweldigend voelt en je misschien niet weet waar te beginnen. Je hoeft niets te &quot;kunnen&quot; of te weten: gewoon schrijven wat er in je opkomt is genoeg.
            </p>
          </FaqItem>
          <FaqItem question="Mijn verlies is al lang geleden: is Benji nog relevant?">
            <p>
              Ja. Rouw heeft geen vervaldatum. Of je verlies gisteren was of 10 jaar geleden, Benji is er om te luisteren. Veel mensen ervaren golven van verdriet jaren later, of worstelen met onverwerkte emoties. Je bent welkom, wanneer dan ook.
            </p>
          </FaqItem>
          <FaqItem question="Ik mis mijn huisdier: is dat &quot;erg genoeg&quot; voor Benji?">
            <p>
              Absoluut. Het verlies van een huisdier is echt en kan enorm pijnlijk zijn. Benji begrijpt dat een huisdier een geliefde, dagelijkse aanwezigheid is geweest. Je verdriet is valide, wat anderen ook zeggen.
            </p>
          </FaqItem>
          <FaqItem question="Ik voel me schuldig dat ik nog steeds verdrietig ben: is dat normaal?">
            <p>
              Ja, heel normaal. Rouw heeft geen tijdslijn. Mensen om je heen verwachten misschien dat je &quot;er overheen bent&quot;, maar verdriet werkt niet zo. Benji oordeelt niet over hoe lang je rouwt of hoe je rouwt. Neem de tijd die je nodig hebt.
            </p>
          </FaqItem>
          <FaqItem question="Kan Benji me helpen met schuldgevoelens?">
            <p>
              Benji kan een luisterend oor bieden en helpen je schuldgevoelens te verwoorden en te onderzoeken. Maar bij complexe schuldgevoelens (bijvoorbeeld na een traumatisch verlies) is professionele therapie vaak noodzakelijk. Benji kan wel een eerste stap zijn.
            </p>
          </FaqItem>
          <FaqItem question="Wat als ik niet kan huilen of geen verdriet voel?">
            <p>
              Iedereen rouwt anders. Sommige mensen huilen veel, anderen helemaal niet. Verdoving, ontkenning of afstandelijkheid zijn ook normale reacties op verlies. Benji oordeelt niet over hoe jij rouwt: er is geen &quot;goede&quot; manier.
            </p>
          </FaqItem>
          <FaqItem question="Helpt praten met een chatbot echt bij rouw?">
            <p>Voor sommigen wel, voor anderen niet. Het voordeel van Benji is:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Altijd beschikbaar (ook &apos;s nachts)</li>
              <li>Geen sociaal verplichte reciprociteit (jij hoeft niet voor Benji te zorgen)</li>
              <li>Je kunt herhalen zonder dat het &quot;te veel&quot; wordt</li>
              <li>Veilige ruimte om gedachten te ordenen voordat je met mensen praat</li>
            </ul>
            <p>Maar Benji vervangt geen menselijk contact, therapie, of rouwgroepen. Het is één tool van vele.</p>
          </FaqItem>
        </FaqSection>

        <FaqSection title="Technische vragen">
          <FaqItem question="Op welke apparaten werkt Benji?">
            <p>Benji werkt op:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Computer (Chrome, Firefox, Safari, Edge)</li>
              <li>Smartphone (iOS, Android)</li>
              <li>Tablet</li>
            </ul>
            <p>Je hebt alleen een internetverbinding nodig.</p>
          </FaqItem>
          <FaqItem question="Moet ik een app downloaden?">
            <p>
              Nee, Benji werkt volledig via je webbrowser. Ga naar talktobenji.nl en je kunt meteen beginnen. Geen app store, geen download.
            </p>
          </FaqItem>
          <FaqItem question="Kan ik Benji ook offline gebruiken?">
            <p>
              Nee, je hebt een internetverbinding nodig om met Benji te praten. De AI heeft online toegang nodig om te kunnen reageren.
            </p>
          </FaqItem>
          <FaqItem question="Werkt Benji ook met stemherkenning?">
            <p>
              Op dit moment is Benji alleen tekstgebaseerd: je typt je berichten. We onderzoeken in de toekomst mogelijkheden voor spraak, maar nu is het alleen schrijven.
            </p>
          </FaqItem>
          <FaqItem question="Mijn gesprek laadt niet: wat nu?">
            <p>Probeer:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Pagina verversen (F5 of refresh knop)</li>
              <li>Browser cache legen</li>
              <li>Uitloggen en opnieuw inloggen</li>
              <li>Een andere browser proberen</li>
            </ul>
            <p>Lukt het nog steeds niet? Neem contact op via{" "}
              <a href="mailto:contactmetien@talktobenji.com" className="text-primary-600 hover:underline">contactmetien@talktobenji.com</a>
            </p>
          </FaqItem>
          <FaqItem question="Kan ik mijn gesprekken exporteren of downloaden?">
            <p>
              Ja, je kunt je gesprekken exporteren als PDF of tekstbestand via je accountinstellingen. Zo kun je ze bewaren of printen als je dat wilt.
            </p>
          </FaqItem>
          <FaqItem question="Ik ben mijn wachtwoord vergeten: hoe reset ik dit?">
            <p>
              Klik op &quot;Wachtwoord vergeten?&quot; op de inlogpagina. Je ontvangt een email met een link om je wachtwoord te resetten.
            </p>
          </FaqItem>
        </FaqSection>

        <FaqSection title="Vergelijking met andere hulp">
          <FaqItem question="Is Benji hetzelfde als een therapeut?">
            <p>
              Nee. Een therapeut is een opgeleide professional die diagnoses kan stellen, behandelplannen kan maken, en diepgaande therapie kan bieden. Benji is een luisterend oor, geen therapeut. Bij ernstige problemen is professionele hulp noodzakelijk.
            </p>
          </FaqItem>
          <FaqItem question="Wanneer moet ik naar een therapeut in plaats van Benji gebruiken?">
            <p>Zoek professionele hulp als je:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Zelfmoordgedachten hebt</li>
              <li>Ernstige depressie of angst ervaart</li>
              <li>Trauma hebt opgelopen</li>
              <li>Je dagelijks functioneren beïnvloed wordt (niet meer werken, eten, slapen)</li>
              <li>Medicatie overweegt of nodig hebt</li>
              <li>Vastloopt in je rouwproces</li>
            </ul>
            <p>Benji kan een aanvulling zijn, maar geen vervanging in deze situaties.</p>
          </FaqItem>
          <FaqItem question="Kan ik Benji gebruiken naast therapie?">
            <p>
              Ja, absoluut. Veel mensen gebruiken Benji tussen therapiesessies door. Therapie is vaak 1x per week of minder: Benji is er op de andere dagen. Bespreek het gerust met je therapeut.
            </p>
          </FaqItem>
          <FaqItem question="Is Benji beter dan een vriend(in) bellen?">
            <p>Nee, anders. Menselijk contact is onvervangbaar. Maar Benji heeft voordelen:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Altijd beschikbaar (vrienden slapen ook)</li>
              <li>Geen schuldgevoel over &quot;weer met hetzelfde komen&quot;</li>
              <li>Volledig privé (geen roddel of sociale consequenties)</li>
              <li>Geen verplichting om ook voor de ander te zorgen</li>
            </ul>
            <p>Ideaal is een combinatie: vrienden voor menselijk contact, Benji voor de tussenmomenten.</p>
          </FaqItem>
          <FaqItem question="Werken rouwgroepen niet beter?">
            <p>Rouwgroepen zijn waardevol door gedeelde ervaring en menselijk contact. Benji is geen vervanging, maar aanvulling:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Rouwgroep = 1x per week, Benji = 24/7</li>
              <li>Rouwgroep = groepsdynamiek, Benji = individueel</li>
              <li>Rouwgroep = sociaal, Benji = privé</li>
            </ul>
            <p>Je kunt beide combineren.</p>
          </FaqItem>
        </FaqSection>

        <FaqSection title="Veiligheid & Noodsituaties">
          <FaqItem question="Wat als ik zelfmoordgedachten heb?">
            <p>
              Bel direct 113 Zelfmoordpreventie (0800-0113, 24/7 gratis). Benji kan luisteren maar is geen crisisinterventie. Zie ook &quot;Wat als ik in crisis ben&quot; en de snelle links voor hulp onderaan.
            </p>
          </FaqItem>
          <FaqItem question="Kan Benji voorkomen dat ik iets stoms doe?">
            <p>
              Benji kan je aanmoedigen om hulp te zoeken en je gedachten te delen, maar kan je niet fysiek tegenhouden. Als je in crisis bent, heb je menselijke, professionele hulp nodig: niet alleen een chatbot.
            </p>
          </FaqItem>
          <FaqItem question="Wat als Benji iets zegt dat me slechter doet voelen?">
            <p>
              Zie &quot;Wat als Benji iets zegt dat niet klopt of niet helpt?&quot; in de sectie Hoe het werkt. Hetzelfde geldt: geef het aan in het gesprek, stop als het te veel wordt, of meld het via{" "}
              <a href="mailto:contactmetien@talktobenji.com" className="text-primary-600 hover:underline">contactmetien@talktobenji.com</a>. Je welzijn is belangrijker dan het gesprek voortzetten.
            </p>
          </FaqItem>
          <FaqItem question="Wordt er gemonitord op gevaarlijke situaties?">
            <p>
              Nee, gesprekken zijn privé en worden niet live gemonitord. Als Benji in je berichten signalen herkent van crisis, zal hij je aanmoedigen om 113 te bellen, maar er wordt geen automatische melding gedaan bij hulpdiensten. Jij bent verantwoordelijk voor je eigen veiligheid.
            </p>
          </FaqItem>
        </FaqSection>

        <FaqSection title="Account & Instellingen">
          <FaqItem question="Hoe maak ik een account aan?">
            <p>
              Klik op &quot;Aanmelden&quot; in het menu, vul je email en een wachtwoord in, en je bent klaar. Je hoeft geen persoonlijke gegevens zoals naam of adres te delen als je dat niet wilt.
            </p>
          </FaqItem>
          <FaqItem question="Moet ik mijn echte naam gebruiken?">
            <p>
              Nee, je mag een pseudoniem of bijnaam gebruiken. We vragen alleen een emailadres voor inloggen en wachtwoordherstel.
            </p>
          </FaqItem>
          <FaqItem question="Kan ik mijn email adres later wijzigen?">
            <p>
              Ja, via je accountinstellingen kun je je emailadres aanpassen.
            </p>
          </FaqItem>
          <FaqItem question="Hoe verwijder ik mijn account?">
            <p>
              Ga naar Accountinstellingen &gt; Account verwijderen. Bevestig je keuze en je account en alle data worden binnen 30 dagen permanent verwijderd.
            </p>
          </FaqItem>
          <FaqItem question="Kan ik gesprekken verwijderen zonder mijn hele account te verwijderen?">
            <p>
              Ja, je kunt individuele gesprekken verwijderen via &quot;Mijn gesprekken&quot;. Klik op het gesprek en selecteer &quot;Verwijderen&quot;.
            </p>
          </FaqItem>
        </FaqSection>

        <FaqSection title="Contact & Support">
          <FaqItem question="Hoe kan ik contact opnemen met jullie?">
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Email:{" "}
                <a href="mailto:contactmetien@talktobenji.com" className="text-primary-600 hover:underline">contactmetien@talktobenji.com</a>
              </li>
              <li>Via het contactformulier op de website</li>
              <li>We proberen binnen 24 tot 48 uur te reageren</li>
            </ul>
          </FaqItem>
          <FaqItem question="Kan ik suggesties doen om Benji te verbeteren?">
            <p>
              Ja, graag zelfs! Stuur je suggesties naar{" "}
              <a href="mailto:contactmetien@talktobenji.com" className="text-primary-600 hover:underline">contactmetien@talktobenji.com</a>. We lezen alle feedback en gebruiken het om Benji beter te maken.
            </p>
          </FaqItem>
          <FaqItem question="Waar kan ik een klacht indienen?">
            <p>
              Neem contact op via{" "}
              <a href="mailto:contactmetien@talktobenji.com" className="text-primary-600 hover:underline">contactmetien@talktobenji.com</a> met je klacht. We nemen alle klachten serieus en reageren binnen 5 werkdagen met een inhoudelijke reactie.
            </p>
          </FaqItem>
          <FaqItem question="Wie kan ik bellen als ik vragen heb?">
            <p>
              We hebben geen telefonische support, maar je kunt mailen naar{" "}
              <a href="mailto:contactmetien@talktobenji.com" className="text-primary-600 hover:underline">contactmetien@talktobenji.com</a>. Voor dringende vragen over je account reageren we zo snel mogelijk.
            </p>
          </FaqItem>
        </FaqSection>

        <FaqSection title="Diversen">
          <FaqItem question="In welke talen werkt Benji?">
            <p>
              Op dit moment alleen in het Nederlands. We onderzoeken in de toekomst mogelijk Engels en andere talen.
            </p>
          </FaqItem>
          <FaqItem question="Werkt Benji ook in België?">
            <p>
              Ja, Benji is beschikbaar voor iedereen met een internetverbinding: Nederland, België, of waar ook ter wereld.
            </p>
          </FaqItem>
          <FaqItem question="Kan ik Benji cadeau doen aan iemand?">
            <p>
              Momenteel niet direct, maar je kunt iemand wijzen op Benji. Iedereen kan Benji gratis proberen met het gratis account (tot 10 gesprekken per maand). In de toekomst kunnen we cadeaubonnen of gift subscriptions overwegen.
            </p>
          </FaqItem>
          <FaqItem question="Gebruiken jullie cookies?">
            <p>
              Ja, we gebruiken noodzakelijke cookies om je ingelogd te houden en de website te laten werken. Geen tracking of advertentie cookies. Zie ons{" "}
              <Link href="/privacy" className="text-primary-600 hover:underline">privacybeleid</Link> voor details.
            </p>
          </FaqItem>
          <FaqItem question="Is Talk To Benji geschikt voor kinderen?">
            <p>
              Benji is ontworpen voor volwassenen (18+). Jongeren onder de 18 mogen Benji gebruiken met toestemming van ouders/verzorgers, maar we raden professionele jeugdhulp aan bij jongeren die met verlies omgaan.
            </p>
          </FaqItem>
          <FaqItem question="Kan mijn werkgever Benji aanbieden aan medewerkers?">
            <p>
              Ja, we bieden zakelijke pakketten aan voor bedrijven die Benji willen aanbieden als onderdeel van welzijnsprogramma&apos;s. Neem contact op via{" "}
              <a href="mailto:contactmetien@talktobenji.com" className="text-primary-600 hover:underline">contactmetien@talktobenji.com</a> voor meer informatie.
            </p>
          </FaqItem>
          <FaqItem question="Kan ik Benji eerst proberen voordat ik betaal?">
            <p>
              Ja, je kunt Benji altijd eerst proberen zonder account aan te maken. Je eerste gesprekken zijn toegankelijk zonder registratie. Als je een gratis account aanmaakt, kun je tot 10 gesprekken per maand voeren. Zo kun je rustig kijken of Benji bij je past voordat je eventueel upgradet naar een betaald abonnement.
            </p>
          </FaqItem>
        </FaqSection>

        <div className="pt-6 border-t border-gray-200 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Heb je nog andere vragen?</h2>
          <p>
            Staat je vraag er niet tussen? Stuur een email naar{" "}
            <a href="mailto:contactmetien@talktobenji.com" className="text-primary-600 hover:underline">contactmetien@talktobenji.com</a> of gebruik het contactformulier. We helpen je graag verder.
          </p>
          <p className="text-xs text-gray-500">Laatste update: Januari 2026</p>
        </div>

        <div className="pt-6 border-t border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Snelle links voor hulp</h2>
          <div className="space-y-4 text-sm text-gray-700">
            <div>
              <p className="font-semibold text-gray-900 mb-1">Bij acute crisis:</p>
              <ul className="space-y-1 ml-0">
                <li><strong>113 Zelfmoordpreventie</strong>: 113 of 0800-0113 (24/7, gratis)</li>
                <li><strong>Huisarts spoedlijn</strong>: Via je eigen huisartsenpraktijk</li>
                <li><strong>112</strong>: Bij directe levensbedreiging</li>
              </ul>
            </div>
            <div>
              <p className="font-semibold text-gray-900 mb-1">Voor een luisterend oor:</p>
              <ul className="space-y-1 ml-0">
                <li><strong>MIND Hulplijn</strong>: <a href="tel:09001450" className="text-primary-600 hover:underline">0900-1450</a> (maandag tot vrijdag 9:00 tot 21:00)</li>
                <li><strong>De Luisterlijn</strong>: <a href="tel:0880767000" className="text-primary-600 hover:underline">088-0767-000</a> (24/7)</li>
              </ul>
            </div>
            <div>
              <p className="font-semibold text-gray-900 mb-1">Voor specifieke hulp:</p>
              <ul className="space-y-1 ml-0">
                <li><strong>Slachtofferhulp</strong>: <a href="tel:09000101" className="text-primary-600 hover:underline">0900-0101</a> (na misdrijf, ongeval)</li>
                <li><strong>Kindertelefoon</strong>: <a href="tel:08000432" className="text-primary-600 hover:underline">0800-0432</a> (voor kinderen 8 tot 18 jaar)</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-4 pt-6">
          <Link href="/" className="text-primary-600 hover:text-primary-700 font-medium">
            ← Terug naar Benji
          </Link>
          <Link href="/privacy" className="text-primary-600 hover:text-primary-700 font-medium">
            Privacy
          </Link>
          <Link href="/algemene-voorwaarden" className="text-primary-600 hover:text-primary-700 font-medium">
            Algemene voorwaarden
          </Link>
        </div>
      </main>
    </div>
  );
}
