"use client";

import { useState, useEffect, useRef } from "react";
import { useAdminQuery, useAdminMutation } from "../AdminAuthContext";
import { api } from "@/convex/_generated/api";
import { Save, LayoutTemplate, ExternalLink, Plus, Trash2, ChevronDown, ChevronUp } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
type Tab = "homepage" | "waarom-benji" | "voor-jou" | "privacy" | "av" | "faq";
type Section = { title: string; body: string };
type FaqItem = { q: string; a: string };
type FaqSection = { title: string; items: FaqItem[] };

// ─── Homepage velden ──────────────────────────────────────────────────────────
const HOMEPAGE_FIELDS = [
  { section: "Hero", fields: [
    { key: "heroLabel",       label: "Kleine tekst boven titel",       multiline: false },
    { key: "heroTitle",       label: "Hoofdtitel regel 1",              multiline: false },
    { key: "heroTitleAccent", label: "Hoofdtitel regel 2 (accent)",     multiline: false },
    { key: "heroSubtitle",    label: "Subtitel",                        multiline: true  },
    { key: "heroCta1",        label: "Primaire knoptekst",              multiline: false },
    { key: "heroCta2",        label: "Secundaire knoptekst",            multiline: false },
    { key: "heroNote",        label: "Kleine noot onder knoppen",       multiline: false },
  ]},
  { section: "Blok 1 — Gesprek", fields: [
    { key: "blok1Titel", label: "Titel",        multiline: false },
    { key: "blok1Tekst", label: "Beschrijving", multiline: true  },
    { key: "blok1Cta",   label: "Link tekst",   multiline: false },
    { key: "blok1Url",   label: "Link URL",     multiline: false },
  ]},
  { section: "Blok 2 — Blog", fields: [
    { key: "blok2Titel", label: "Titel",        multiline: false },
    { key: "blok2Tekst", label: "Beschrijving", multiline: true  },
    { key: "blok2Cta",   label: "Link tekst",   multiline: false },
    { key: "blok2Url",   label: "Link URL",     multiline: false },
  ]},
  { section: "Blok 3 — Jaar toegang", fields: [
    { key: "blok3Titel", label: "Titel",        multiline: false },
    { key: "blok3Tekst", label: "Beschrijving", multiline: true  },
    { key: "blok3Cta",   label: "Link tekst",   multiline: false },
    { key: "blok3Url",   label: "Link URL",     multiline: false },
  ]},
  { section: "Over Benji", fields: [
    { key: "overTitle", label: "Titel",    multiline: false },
    { key: "overP1",    label: "Alinea 1", multiline: true  },
    { key: "overP2",    label: "Alinea 2", multiline: true  },
    { key: "overP3",    label: "Alinea 3", multiline: true  },
  ]},
  { section: "Zo werkt een gesprek", fields: [
    { key: "stappenTitel", label: "Sectietitel",    multiline: false },
    { key: "stap1Titel",   label: "Stap 1 titel",   multiline: false },
    { key: "stap1Tekst",   label: "Stap 1 tekst",   multiline: true  },
    { key: "stap1Cta",     label: "Stap 1 link tekst", multiline: false },
    { key: "stap1Url",     label: "Stap 1 link URL",   multiline: false },
    { key: "stap2Titel",   label: "Stap 2 titel",   multiline: false },
    { key: "stap2Tekst",   label: "Stap 2 tekst",   multiline: true  },
    { key: "stap2Cta",     label: "Stap 2 link tekst", multiline: false },
    { key: "stap2Url",     label: "Stap 2 link URL",   multiline: false },
    { key: "stap3Titel",   label: "Stap 3 titel",   multiline: false },
    { key: "stap3Tekst",   label: "Stap 3 tekst",   multiline: true  },
    { key: "stap3Cta",     label: "Stap 3 link tekst", multiline: false },
    { key: "stap3Url",     label: "Stap 3 link URL",   multiline: false },
    { key: "stap4Titel",   label: "Stap 4 titel",   multiline: false },
    { key: "stap4Tekst",   label: "Stap 4 tekst",   multiline: true  },
    { key: "stap4Cta",     label: "Stap 4 link tekst", multiline: false },
    { key: "stap4Url",     label: "Stap 4 link URL",   multiline: false },
    { key: "stap5Titel",   label: "Stap 5 titel",   multiline: false },
    { key: "stap5Tekst",   label: "Stap 5 tekst",   multiline: true  },
    { key: "stap5Cta",     label: "Stap 5 link tekst", multiline: false },
    { key: "stap5Url",     label: "Stap 5 link URL",   multiline: false },
  ]},
  { section: "Klaar om te beginnen", fields: [
    { key: "ctaTitel", label: "Titel",        multiline: false },
    { key: "ctaTekst", label: "Beschrijving", multiline: true  },
    { key: "ctaKnop",  label: "Knoptekst",    multiline: false },
  ]},
  { section: "Screenshot-strip", fields: [
    { key: "showcaseTitel",    label: "Sectietitel",    multiline: false },
    { key: "showcaseSubtitel", label: "Sectiesubtitel", multiline: false },
  ]},
];

const HOMEPAGE_DEFAULTS: Record<string, string> = {
  heroLabel: "03:18 's nachts. Niemand om te bellen.",
  heroTitle: "Altijd iemand die luistert,",
  heroTitleAccent: "ook als het moeilijk is",
  heroSubtitle: "Benji is er voor je als je verdriet hebt, iets verliest of gewoon je gedachten kwijt wilt. Altijd beschikbaar, zonder oordeel.",
  heroCta1: "Praat nu met Benji",
  heroCta2: "Lees over verdriet en verlies",
  heroNote: "Anoniem · Geen registratie nodig · Direct beschikbaar",
  blok1Titel: "Praat gratis met Benji",
  blok1Tekst: "Je eerste vijf gesprekken zijn gratis, zonder account. Maak je een account aan, dan kun je tien gesprekken per maand voeren.",
  blok1Cta: "Begin een gesprek",
  blok1Url: "/benji",
  blok2Titel: "Samen Omgaan met Verdriet en Pijn",
  blok2Tekst: "Een plek waar je steun, begrip en praktische tips vindt om sterker door moeilijke tijden te komen.",
  blok2Cta: "Bekijk alle artikelen",
  blok2Url: "/blog",
  blok3Titel: "Benji voor een heel jaar",
  blok3Tekst: "Voor wie wil dat Benji er altijd is, ook als het even beter gaat. Ontdek wat erbij zit.",
  blok3Cta: "Bekijk wat erbij zit",
  blok3Url: "/lp/jaar-toegang",
  overTitle: "Gemaakt omdat er iets ontbrak en uit eigen ervaring met verlies",
  overP1: "Ik ben Ien, oprichter van Talk To Benji. Ik vroeg me af waarom er voor mensen met verdriet zo weinig is dat echt laagdrempelig is. Geen wachtlijst, geen intake, geen afspraak, gewoon iemand die luistert, ook om 03:00 's nachts.",
  overP2: "Dat werd Benji. Zes jaar lang zocht ik naar de beste manier om een plek te maken waar je je verhaal kwijt kunt, je gedachten kunt ordenen en zo beter zicht krijgt op alles wat er in je hoofd zit. Niet om je te vertellen wat je moet doen, maar om je te helpen het zelf te begrijpen.",
  overP3: "Benji is geen professional, en dat zegt hij ook eerlijk. Maar voor de momenten dat de drempel naar echte hulp te hoog is, of als je gewoon wilt zeggen wat er is, dan is Benji er.",
  stappenTitel: "Zo werkt een gesprek met Benji",
  stap1Titel: "Je typt of zegt wat er is",
  stap1Tekst: "Geen vragen vooraf, geen verplicht onderwerp. Je begint gewoon, ook als je niet precies weet waar je moet starten.",
  stap2Titel: "Benji luistert en vraagt door",
  stap2Tekst: "Benji reageert op jou. Stelt vragen, geeft ruimte, en past zich aan wat jij nodig hebt op dat moment.",
  stap3Titel: "Jij bepaalt wanneer je stopt",
  stap3Tekst: "Je sluit het gesprek af wanneer jij wilt. Geen verplichtingen, geen follow-up die je niet wilt.",
  stap4Titel: "Verder waar je gebleven was",
  stap4Tekst: "Met een gratis account blijven je gesprekken bewaard. Je kunt op elk moment verder waar je gebleven was.",
  stap5Titel: "Er is meer",
  stap5Tekst: "Met Benji voor een jaar heb je toegang tot alles: reflecties, doelen, memories, dagelijkse check-ins, inspiratie en een herdenkingskalender.",
  stap5Cta: "Bekijk wat erbij zit",
  stap5Url: "/lp/jaar-toegang",
  ctaTitel: "Klaar om te beginnen?",
  ctaTekst: "Je hoeft je niet te registreren. Begin gewoon een gesprek, anoniem en direct beschikbaar.",
  ctaKnop: "Praat nu met Benji",
  showcaseTitel: "Meer dan een gesprek",
  showcaseSubtitel: "Maak een gratis account aan en houd bij wat je bezighoudt. Met Benji voor een jaar heb je toegang tot alles.",
};

const WAAROM_DEFAULT = `Verlies is iets wat iedereen meemaakt.

Iemand die ziek is en midden in zware behandelingen zit. Van uitslag naar uitslag, van controle naar controle. Het leven dat op pauze lijkt te staan, terwijl de zorgen zich opstapelen en de onzekerheid constant aan je trekt.

Een scheiding die een relatie doet eindigen. Niet alleen het verlies van een partner, maar ook van een gedeelde toekomst, van plannen, van een thuis zoals je het kende. Verdriet dat vaak onzichtbaar blijft, maar wel diep kan snijden.

De één verliest een dierbare, iemand die er altijd was en er nu opeens niet meer is.

De ander verliest een kinderwens die nooit vervuld mocht worden, en daarmee een hele toekomst die stilletjes verdampt. Geen babykamer, geen eerste schooldag, geen kleinkinderen. Verdriet dat blijft, ook als de wereld om je heen alweer doorleeft.

Weer een ander verliest de gezondheid die er opeens niet meer is, of een bedrijf waar alles in zat, jarenlang werk, dromen en identiteit.

Verdriet heeft geen vaste vorm.

Het past niet altijd in een categorie, en het volgt zeker geen planning.

Maar er is iets wat ik keer op keer zie, al jaren. Verdriet wordt heel vaak alleen gedragen.

Niet omdat er niemand is. Maar omdat je niemand wilt belasten.

Omdat iedereen het druk heeft. Omdat je je misschien al te veel voelt.

Of omdat je eerst je gedachten wilt ordenen voordat je ze deelt met iemand die je kent.

En dus zwijg je.

Of je praat wel, maar niet echt.

Ik weet hoe dat voelt.

Ik zag het van dichtbij toen mijn schoonzus ziek werd en overleed. Het verdriet van haar man, haar kinderen, haar broers en zussen, iedereen op zijn eigen manier, en iedereen ergens ook alleen.

En ik begreep toen nog beter: dit overkomt iedereen, vroeg of laat. En toch doorleven zo veel mensen het in stilte, meer dan je van buitenaf zou denken.

Ik woon zelf in Zweden, ver van familie en vrienden in Nederland. Die afstand voegt iets extra's toe aan verdriet. Je bent niet bij de mensen van wie je houdt als het moeilijk is. Je kunt niet even langsgaan, niet zomaar samen zijn. Dat gevoel van ver weg zijn midden in verdriet heeft mede Benji doen ontstaan.

Vanuit die overtuiging begon ik vier jaar geleden Beterschap-cadeau.nl, een plek voor mensen die iemand willen steunen die iets moeilijks meemaakt. Dat werd meer gebruikt dan ik had verwacht.

En langzaamaan groeide de vraag die me al die tijd bezighield: Hoe kan ik mensen direct helpen, op het moment dat ze er zelf mee zitten?

Niet als cadeau voor iemand anders, maar voor zichzelf.

Benji is het antwoord op die vraag.

Door te schrijven of hardop te praten worden dingen vaak een stukje duidelijker.

Niet opgelost, maar draaglijker.

En soms is het makkelijker om eerst bij Benji te beginnen, voordat je het deelt met de mensen om je heen.

Verdriet verdient ruimte.

Benji geeft die ruimte, altijd.

Ik hoop dat het voor jou kan zijn wat ik zelf graag had gehad: een plek waar je verhaal ertoe doet, ook als je het (nog) niet hardop durft te zeggen.`;

const PRIVACY_DEFAULTS: Section[] = [
  { title: "Je gesprekken — Wat we opslaan", body: "Je gesprekken met Benji worden opgeslagen zodat je later kunt terugkomen en verder kunt praten. Dit werkt via een sessie-ID dat aan je browser is gekoppeld." },
  { title: "Je gesprekken — Wat we ermee doen", body: "We gebruiken geanonimiseerde gesprekken om Benji te verbeteren. Dat betekent: we halen alles wat naar jou kan leiden uit de data voordat we het gebruiken voor training. Geen namen, geen herkenbare details, alleen de essentie van het gesprek." },
  { title: "Je gesprekken — Wat we er níét mee doen", body: "We verkopen je gegevens niet.\nWe delen ze niet met derden.\nWe gebruiken ze niet voor advertenties.\nNiemand leest je gesprekken mee." },
  { title: "Hoe lang bewaren we je gegevens", body: "We bewaren je gesprekken zolang je account actief is, zodat je ze zelf kunt terugvinden. Als je 12 maanden niet hebt ingelogd, verwijderen we je gegevens — tenzij je hebt aangegeven ze te willen bewaren.\n\nWanneer je een gesprek verwijdert, heb je twee opties:\n- Volledig verwijderen: dan is het weg, ook voor verbetering van Benji\n- Anonimiseren: je gesprek wordt losgekoppeld van jou en kan (zonder enige persoonlijke details) worden gebruikt om Benji te verbeteren\n\nFacturen bewaren we conform de wettelijke bewaarplicht van 7 jaar." },
  { title: "Partners en data buiten de EU", body: "Om Benji te kunnen laten werken, maken we gebruik van de volgende dienstverleners:\n\nAnthropic — AI-technologie (VS)\nConvex — dataopslag (VS)\nVercel — hosting (VS)\nStripe — betalingsverwerking (VS/EU)\n\nHierdoor kan het voorkomen dat je (geanonimiseerde) gegevens worden verwerkt op servers buiten de Europese Unie, met name in de Verenigde Staten. Al deze partijen zijn gecertificeerd onder het EU-US Data Privacy Framework en hanteren de door de Europese Commissie goedgekeurde modelcontractbepalingen (Standard Contractual Clauses). Daarmee is jouw privacy ook buiten de EU wettelijk beschermd." },
  { title: "Benji en AI", body: "Benji gebruikt AI om te reageren op wat je schrijft. Elk gesprek staat volledig op zichzelf — de AI ziet alleen jouw huidige gesprek, nooit de gesprekken van andere gebruikers.\n\nOok wij als beheerder lezen de inhoud van gesprekken niet mee. Om Benji te verbeteren worden er automatisch geanonimiseerde kwaliteitsrapporten gegenereerd. Die rapporten bevatten geen persoonlijke informatie of herkenbare gespreksinhoud — alleen technische signalen over de kwaliteit van Benji's reacties.\n\nReacties van Benji zijn geen medisch of psychologisch advies." },
  { title: "Cookies", body: "We gebruiken alleen noodzakelijke cookies:\n- Om je sessie te onthouden zodat je gesprek bewaard blijft\n- Om anonieme statistieken te verzamelen (zoals bezoekersaantallen)\n\nWe plaatsen geen advertentiecookies en volgen je niet op andere websites." },
  { title: "Je rechten", body: "Op grond van de AVG heb je de volgende rechten:\n- Inzage in je gegevens\n- Correctie van onjuiste gegevens\n- Verwijdering van je gegevens (\"recht op vergetelheid\")\n- Beperking van de verwerking\n- Bezwaar tegen verwerking op grond van gerechtvaardigd belang\n- Overdraagbaarheid van je gegevens — je kunt je gegevens downloaden via je account\n- Intrekking van toestemming (zonder dat dit gevolgen heeft voor eerdere verwerking)\n- Verwijdering van je account — dit kan direct via je accountinstellingen\n\nJe hebt ook het recht om een klacht in te dienen bij de Autoriteit Persoonsgegevens." },
  { title: "Contact", body: "Vragen over je privacy of een verzoek indienen? Neem contact op via contactmetien@talktobenji.com. We reageren binnen 48 uur." },
];

const AV_DEFAULTS: Section[] = [
  { title: "Wat Benji is", body: "Talk To Benji is een initiatief van LAAV, gevestigd te Hässleholm, Zweden, organisatienummer 671123-0422, btw-nummer SE671123042201.\n\nBenji is een AI-ondersteunde gesprekspartner die een luisterend oor biedt voor mensen die te maken hebben met verlies of verdriet. Benji is er om te luisteren, niet om te oordelen." },
  { title: "Wat Benji niet is — medische disclaimer", body: "Benji is geen vervanging voor:\n- Professionele hulpverlening, psychotherapie of psychiatrie\n- Medisch of psychologisch advies\n- Contact met vrienden, familie of naasten\n- Crisisinterventie of spoedhulp\n\nDe inhoud van gesprekken met Benji is uitsluitend bedoeld als emotionele ondersteuning en mag niet worden beschouwd als medisch, psychologisch of therapeutisch advies. Bij ernstige psychische klachten of crisis raden we je sterk aan contact op te nemen met een professional." },
  { title: "Professionele hulp en crisis", body: "Benji herkent signalen waarbij professionele hulp nodig kan zijn en verwijst je dan door. Bij crisis kun je direct terecht bij:\n- 113 Zelfmoordpreventie — bel 113 of 0800-0113 (gratis, 24/7), of chat via 113.nl\n- Huisarts of POH-GGZ — voor professionele begeleiding" },
  { title: "Leeftijd", body: "Talk To Benji is uitsluitend bestemd voor personen van 18 jaar of ouder. Door je te registreren verklaar je minimaal 18 jaar oud te zijn." },
  { title: "Abonnement en betaling", body: "Talk To Benji biedt toegang via een eenmalige betaling of abonnement. Na je aankoop ontvang je direct toegang tot de dienst en wordt de betaling verwerkt via Stripe.\n\nPrijswijzigingen worden minimaal 30 dagen van tevoren aangekondigd via e-mail." },
  { title: "Herroepingsrecht", body: "Als consument heb je in principe het recht om een aankoop binnen 14 dagen zonder opgave van reden te herroepen. Voor digitale diensten die direct na aankoop worden geleverd, vervalt dit herroepingsrecht zodra de dienst is gestart — mits je daar bij de aankoop uitdrukkelijk mee hebt ingestemd.\n\nDoor je aankoop af te ronden en de dienst direct te gebruiken, geef je die toestemming. Heb je de dienst nog niet gebruikt en wil je van je aankoop af? Neem dan binnen 14 dagen na aankoop contact op via contactmetien@talktobenji.com." },
  { title: "Je gesprekken en privacy", body: "Je gesprekken worden opgeslagen zodat je later verder kunt praten. We gebruiken uitsluitend volledig geanonimiseerde data om Benji te verbeteren. Lees ons privacybeleid voor meer details over hoe we met je gegevens omgaan." },
  { title: "Aansprakelijkheid", body: "We doen ons best om Benji zo behulpzaam mogelijk te maken, maar:\n- Benji kan fouten maken of iets verkeerd begrijpen\n- Benji is niet altijd beschikbaar (bij technische storingen)\n- Reacties van Benji zijn geen professioneel, medisch of therapeutisch advies\n\nDe aansprakelijkheid van Talk To Benji is te allen tijde beperkt tot het bedrag dat je voor de dienst hebt betaald. Talk To Benji is niet aansprakelijk voor indirecte schade, gevolgschade of emotionele schade die voortvloeit uit het gebruik van de dienst." },
  { title: "Gebruik", body: "Je mag Benji gebruiken voor persoonlijke ondersteuning bij verdriet en verlies. Je mag Benji niet gebruiken om:\n- Anderen te schaden of te intimideren\n- De dienst te misbruiken of te verstoren\n- Illegale activiteiten te ondersteunen\n- Inhoud te genereren die schadelijk, discriminerend of onrechtmatig is\n\nBij misbruik behouden wij het recht je toegang te beëindigen zonder restitutie." },
  { title: "Wijzigingen", body: "We kunnen deze voorwaarden aanpassen. Bij materiële wijzigingen informeren we je minimaal 30 dagen van tevoren per e-mail. Door de dienst na die datum te blijven gebruiken, accepteer je de nieuwe voorwaarden." },
  { title: "Toepasselijk recht en geschillen", body: "Op deze voorwaarden is Zweeds recht van toepassing. Geschillen worden bij voorkeur in onderling overleg opgelost. Lukt dat niet, dan is de bevoegde rechtbank in Hässleholm, Zweden bevoegd.\n\nAls EU-consument behoud je altijd de bescherming van de dwingende consumentenrechtelijke bepalingen van je eigen woonland. Je kunt ook gebruik maken van het Europese ODR-platform voor online geschillenbeslechting: ec.europa.eu/consumers/odr" },
  { title: "Contact", body: "Vragen over deze voorwaarden? Neem contact op via contactmetien@talktobenji.com." },
];

const FAQ_DEFAULTS: FaqSection[] = [
  { title: "Over Benji", items: [
    { q: "Wat is Talk To Benji?", a: "Talk To Benji is een AI-chatbot speciaal ontwikkeld voor mensen die met verlies, verdriet of moeilijke emoties omgaan. Benji biedt een luisterend oor wanneer je dat nodig hebt: dag en nacht, zonder oordeel. Het is bedoeld als aanvullende steun, niet als vervanging van professionele hulp of menselijk contact." },
    { q: "Is Benji een echte persoon?", a: "Nee, Benji is een AI-chatbot. Benji is getraind op gesprekken over verlies, rouw en verdriet, en wordt continu verbeterd om empathisch en begripvol te reageren." },
    { q: "Voor wie is Benji bedoeld?", a: "Benji is er voor iedereen die iemand heeft verloren, worstelt met verdriet of eenzaamheid, graag wil praten maar zich schuldig voelt anderen te belasten, midden in de nacht steun zoekt, of een veilige plek zoekt om gedachten te ordenen." },
  ]},
  { title: "Hoe het werkt", items: [
    { q: "Hoe start ik een gesprek met Benji?", a: "Ga naar de chat, typ je eerste bericht en het gesprek begint. Er is geen tijdslimiet, geen verplicht onderwerp." },
    { q: "Kan ik een gesprek pauzeren en later hervatten?", a: "Ja, je kunt op elk moment stoppen en later terugkomen. Je eerdere gesprekken worden bewaard zodat je kunt doorgaan waar je was gebleven." },
  ]},
  { title: "Privacy & Veiligheid", items: [
    { q: "Zijn mijn gesprekken echt privé?", a: "Ja, absoluut. Jouw gesprekken zijn versleuteld, niet zichtbaar voor andere gebruikers, niet gedeeld met derden, en niet gebruikt voor marketing." },
    { q: "Wat als ik in crisis ben?", a: "Benji kan niet bellen of hulpdiensten waarschuwen. Als je in acute crisis bent of zelfmoordgedachten hebt, bel dan direct 113 Zelfmoordpreventie: 0800-0113 (24/7, gratis)." },
  ]},
  { title: "Kosten & Abonnementen", items: [
    { q: "Wat kost Talk To Benji?", a: "Je eerste vijf gesprekken zijn gratis, zonder account. Met een gratis account kun je tien gesprekken per maand voeren. Voor onbeperkte toegang en extra functies is er een betaald abonnement." },
    { q: "Is er een gratis versie?", a: "Ja, je kunt Benji gebruiken met een gratis account en tot tien gesprekken per maand voeren." },
  ]},
  { title: "Contact & Support", items: [
    { q: "Hoe kan ik contact opnemen?", a: "Stuur een email naar contactmetien@talktobenji.com. We proberen binnen 24 tot 48 uur te reageren." },
  ]},
];

// ─── Hulpcomponenten ──────────────────────────────────────────────────────────
function Field({ label, value, onChange, multiline, rows = 3 }: {
  label: string; value: string; onChange: (v: string) => void; multiline?: boolean; rows?: number;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-700 mb-1">{label}</label>
      {multiline ? (
        <textarea value={value} onChange={e => onChange(e.target.value)} rows={rows}
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400 resize-y" />
      ) : (
        <input type="text" value={value} onChange={e => onChange(e.target.value)}
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400" />
      )}
    </div>
  );
}

function SaveBar({ onSave, saving, saved }: { onSave: () => void; saving: boolean; saved: boolean }) {
  return (
    <div className="flex justify-end pt-2 pb-8">
      <button onClick={onSave} disabled={saving}
        className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50 transition-colors">
        <Save size={16} />
        {saving ? "Bezig…" : saved ? "Opgeslagen!" : "Opslaan"}
      </button>
    </div>
  );
}

// ─── Afbeelding upload hulpcomponent ─────────────────────────────────────────
function ImageUploadButton({ label, currentUrl, onUploaded }: {
  label: string;
  currentUrl?: string;
  onUploaded: (url: string) => void;
}) {
  const generateUploadUrl = useAdminMutation(api.pageContent.generateUploadUrl);
  const getImageUrl = useAdminMutation(api.pageContent.getImageUrl);
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const handleFile = async (file: File) => {
    setUploading(true); setError("");
    try {
      const uploadUrl = await generateUploadUrl();
      const res = await fetch(uploadUrl, { method: "POST", body: file, headers: { "Content-Type": file.type } });
      const { storageId } = await res.json();
      const url = await getImageUrl({ storageId });
      if (url) onUploaded(url);
    } catch {
      setError("Upload mislukt");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex items-start gap-3">
      {currentUrl && (
        <img src={currentUrl} alt="" className="w-16 h-16 rounded-lg object-cover border border-gray-200 flex-shrink-0" />
      )}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-gray-700 mb-1.5">{label}</p>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="px-3 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg border border-gray-200 transition-colors disabled:opacity-50"
        >
          {uploading ? "Bezig…" : currentUrl ? "Vervangen" : "Uploaden"}
        </button>
        {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
      </div>
    </div>
  );
}

// ─── Tab: Homepage ────────────────────────────────────────────────────────────
const SCREENSHOT_SLOTS = [
  { id: "gesprek",        label: "Gesprek met Benji" },
  { id: "mijn-plek",      label: "Mijn plek" },
  { id: "memories",       label: "Memories" },
  { id: "inspiratie",     label: "Inspiratie & troost" },
  { id: "check-in",       label: "Dagelijkse check-ins" },
  { id: "handreikingen",  label: "Handreikingen" },
];

function HomepageTab() {
  const saved = useAdminQuery(api.pageContent.getPageContent, { pageKey: "homepage" });
  const setContent = useAdminMutation(api.pageContent.setPageContent);
  const [values, setValues] = useState<Record<string, string>>(HOMEPAGE_DEFAULTS);
  const [saving, setSaving] = useState(false);
  const [saved2, setSaved2] = useState(false);

  // screenshots: array of FeatureItem stored as JSON in values.screenshots
  const [screenshots, setScreenshots] = useState<{ id: string; label: string; image: string; imageAlt: string }[]>(
    SCREENSHOT_SLOTS.map(s => ({ ...s, image: `/images/screenshots/${s.id}.png`, imageAlt: s.label }))
  );

  useEffect(() => {
    if (saved) {
      setValues({ ...HOMEPAGE_DEFAULTS, ...saved });
      if (saved.screenshots) {
        try { setScreenshots(JSON.parse(saved.screenshots)); } catch {}
      }
    }
  }, [saved]);

  const set = (key: string, val: string) => setValues(p => ({ ...p, [key]: val }));

  const setScreenshotUrl = (id: string, url: string) =>
    setScreenshots(p => p.map(s => s.id === id ? { ...s, image: url } : s));

  const handleSave = async () => {
    setSaving(true); setSaved2(false);
    try {
      await setContent({ pageKey: "homepage", content: JSON.stringify({ ...values, screenshots: JSON.stringify(screenshots) }) });
      setSaved2(true); setTimeout(() => setSaved2(false), 2000);
    } finally { setSaving(false); }
  };

  return (
    <div className="space-y-4">
      {HOMEPAGE_FIELDS.map(({ section, fields }) => (
        <div key={section} className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4 pb-3 border-b border-gray-100">{section}</h3>
          <div className="space-y-4">
            {fields.map(f => (
              <Field key={f.key} label={f.label} value={values[f.key] ?? ""} onChange={v => set(f.key, v)} multiline={f.multiline} />
            ))}
          </div>
        </div>
      ))}

      {/* Screenshot-afbeeldingen */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-1 pb-3 border-b border-gray-100">Screenshot-afbeeldingen</h3>
        <p className="text-xs text-gray-400 mb-4">Upload nieuwe screenshots voor de scrollstrip op de homepage.</p>
        <div className="space-y-4">
          {screenshots.map(s => (
            <ImageUploadButton
              key={s.id}
              label={s.label}
              currentUrl={s.image.startsWith("http") ? s.image : undefined}
              onUploaded={url => setScreenshotUrl(s.id, url)}
            />
          ))}
        </div>
      </div>

      {/* Founder foto */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-1 pb-3 border-b border-gray-100">Founder foto</h3>
        <p className="text-xs text-gray-400 mb-4">Foto van Ien in het &apos;Over Benji&apos; blok.</p>
        <ImageUploadButton
          label="Foto van Ien"
          currentUrl={values.founderImageUrl || undefined}
          onUploaded={url => set("founderImageUrl", url)}
        />
      </div>

      <SaveBar onSave={handleSave} saving={saving} saved={saved2} />
    </div>
  );
}

// ─── Tab: Waarom Benji ────────────────────────────────────────────────────────
function WaaromBenjiTab() {
  const saved = useAdminQuery(api.pageContent.getPageContent, { pageKey: "waarom-benji" });
  const setContent = useAdminMutation(api.pageContent.setPageContent);
  const [body, setBody] = useState(WAAROM_DEFAULT);
  const [saving, setSaving] = useState(false);
  const [saved2, setSaved2] = useState(false);

  useEffect(() => { if (saved?.body) setBody(saved.body); }, [saved]);

  const handleSave = async () => {
    setSaving(true); setSaved2(false);
    try { await setContent({ pageKey: "waarom-benji", content: JSON.stringify({ body }) }); setSaved2(true); setTimeout(() => setSaved2(false), 2000); }
    finally { setSaving(false); }
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-2">Verhaal</h3>
        <p className="text-xs text-gray-400 mb-3">Gebruik een lege regel tussen alinea's. Plaatjes en opmaak zijn hardcoded en veranderen niet.</p>
        <textarea value={body} onChange={e => setBody(e.target.value)} rows={30}
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400 resize-y font-mono" />
      </div>
      <SaveBar onSave={handleSave} saving={saving} saved={saved2} />
    </div>
  );
}

// ─── Tab: Privacy / AV ────────────────────────────────────────────────────────
function SectionsTab({ pageKey, defaults, href }: { pageKey: string; defaults: Section[]; href: string }) {
  const saved = useAdminQuery(api.pageContent.getPageContent, { pageKey });
  const setContent = useAdminMutation(api.pageContent.setPageContent);
  const [sections, setSections] = useState<Section[]>(defaults);
  const [saving, setSaving] = useState(false);
  const [saved2, setSaved2] = useState(false);

  useEffect(() => {
    if (saved?.sections) {
      try { setSections(JSON.parse(saved.sections)); } catch {}
    }
  }, [saved]);

  const update = (i: number, field: keyof Section, val: string) =>
    setSections(p => p.map((s, idx) => idx === i ? { ...s, [field]: val } : s));
  const add = () => setSections(p => [...p, { title: "Nieuwe sectie", body: "" }]);
  const remove = (i: number) => setSections(p => p.filter((_, idx) => idx !== i));

  const handleSave = async () => {
    setSaving(true); setSaved2(false);
    try { await setContent({ pageKey, content: JSON.stringify({ sections: JSON.stringify(sections) }) }); setSaved2(true); setTimeout(() => setSaved2(false), 2000); }
    finally { setSaving(false); }
  };

  const handleReset = () => {
    if (confirm("Weet je zeker dat je wilt terugzetten naar de standaardinhoud? Dit overschrijft de huidige tekst (nog niet opgeslagen).")) {
      setSections(defaults);
    }
  };

  return (
    <div className="space-y-3">
      <p className="text-xs text-gray-500">Gebruik een lege regel voor nieuwe alinea. Gebruik een koppelteken (-) aan het begin van een regel voor een bullet punt.</p>
      {sections.map((s, i) => (
        <div key={i} className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex gap-2 mb-3">
            <input value={s.title} onChange={e => update(i, "title", e.target.value)}
              className="flex-1 px-3 py-1.5 text-sm font-medium border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400" />
            <button onClick={() => remove(i)} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={15} /></button>
          </div>
          <textarea value={s.body} onChange={e => update(i, "body", e.target.value)} rows={4}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400 resize-y" />
        </div>
      ))}
      <div className="flex items-center gap-3">
        <button onClick={add} className="flex items-center gap-2 px-4 py-2 text-sm text-primary-600 hover:bg-primary-50 rounded-lg transition-colors border border-dashed border-primary-200">
          <Plus size={15} /> Sectie toevoegen
        </button>
        <button onClick={handleReset} className="px-4 py-2 text-sm text-gray-500 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200">
          ↺ Reset naar standaard
        </button>
      </div>
      <SaveBar onSave={handleSave} saving={saving} saved={saved2} />
    </div>
  );
}

// ─── Tab: FAQ ─────────────────────────────────────────────────────────────────
function FaqTab() {
  const saved = useAdminQuery(api.pageContent.getPageContent, { pageKey: "faq" });
  const setContent = useAdminMutation(api.pageContent.setPageContent);
  const [sections, setSections] = useState<FaqSection[]>(FAQ_DEFAULTS);
  const [open, setOpen] = useState<number | null>(0);
  const [saving, setSaving] = useState(false);
  const [saved2, setSaved2] = useState(false);

  useEffect(() => {
    if (saved?.sections) {
      try { setSections(JSON.parse(saved.sections)); } catch {}
    }
  }, [saved]);

  const updateSection = (i: number, title: string) =>
    setSections(p => p.map((s, idx) => idx === i ? { ...s, title } : s));
  const updateItem = (si: number, ii: number, field: keyof FaqItem, val: string) =>
    setSections(p => p.map((s, idx) => idx === si ? { ...s, items: s.items.map((item, jdx) => jdx === ii ? { ...item, [field]: val } : item) } : s));
  const addItem = (si: number) =>
    setSections(p => p.map((s, idx) => idx === si ? { ...s, items: [...s.items, { q: "", a: "" }] } : s));
  const removeItem = (si: number, ii: number) =>
    setSections(p => p.map((s, idx) => idx === si ? { ...s, items: s.items.filter((_, jdx) => jdx !== ii) } : s));
  const addSection = () => setSections(p => [...p, { title: "Nieuwe sectie", items: [] }]);
  const removeSection = (i: number) => setSections(p => p.filter((_, idx) => idx !== i));

  const handleSave = async () => {
    setSaving(true); setSaved2(false);
    try { await setContent({ pageKey: "faq", content: JSON.stringify({ sections: JSON.stringify(sections) }) }); setSaved2(true); setTimeout(() => setSaved2(false), 2000); }
    finally { setSaving(false); }
  };

  return (
    <div className="space-y-3">
      {sections.map((s, si) => (
        <div key={si} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 border-b border-gray-100">
            <input value={s.title} onChange={e => updateSection(si, e.target.value)}
              className="flex-1 px-2 py-1 text-sm font-semibold border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-primary-400 bg-white" />
            <button onClick={() => setOpen(open === si ? null : si)} className="p-1 text-gray-400 hover:text-gray-600">
              {open === si ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            <button onClick={() => removeSection(si)} className="p-1 text-red-400 hover:text-red-600"><Trash2 size={15} /></button>
          </div>

          {open === si && (
            <div className="p-4 space-y-4">
              {s.items.map((item, ii) => (
                <div key={ii} className="border border-gray-100 rounded-lg p-3 space-y-2">
                  <div className="flex gap-2">
                    <input value={item.q} onChange={e => updateItem(si, ii, "q", e.target.value)}
                      placeholder="Vraag"
                      className="flex-1 px-2 py-1.5 text-sm border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-primary-400" />
                    <button onClick={() => removeItem(si, ii)} className="p-1 text-red-400 hover:text-red-600 flex-shrink-0"><Trash2 size={14} /></button>
                  </div>
                  <textarea value={item.a} onChange={e => updateItem(si, ii, "a", e.target.value)}
                    placeholder="Antwoord" rows={3}
                    className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-primary-400 resize-y" />
                </div>
              ))}
              <button onClick={() => addItem(si)} className="flex items-center gap-1.5 text-xs text-primary-600 hover:bg-primary-50 px-3 py-1.5 rounded-lg border border-dashed border-primary-200 transition-colors">
                <Plus size={13} /> Vraag toevoegen
              </button>
            </div>
          )}
        </div>
      ))}
      <button onClick={addSection} className="flex items-center gap-2 px-4 py-2 text-sm text-primary-600 hover:bg-primary-50 rounded-lg border border-dashed border-primary-200 transition-colors">
        <Plus size={15} /> Sectie toevoegen
      </button>
      <SaveBar onSave={handleSave} saving={saving} saved={saved2} />
    </div>
  );
}

// ─── Tab: Voor Jou ───────────────────────────────────────────────────────────
const VOOR_JOU_DEFAULTS = {
  label: "Van Talk To Benji",
  titel: "Voor jou",
  subtitel: "Producten en programma's die je kunnen helpen als je iets moeilijks meemaakt.",
};

function VoorJouTab() {
  const saved = useAdminQuery(api.pageContent.getPageContent, { pageKey: "voor-jou" });
  const setContent = useAdminMutation(api.pageContent.setPageContent);
  const [values, setValues] = useState<Record<string, string>>(VOOR_JOU_DEFAULTS);
  const [saving, setSaving] = useState(false);
  const [saved2, setSaved2] = useState(false);

  useEffect(() => {
    if (saved) setValues({ ...VOOR_JOU_DEFAULTS, ...saved });
  }, [saved]);

  const set = (key: string, val: string) => setValues(p => ({ ...p, [key]: val }));

  const handleSave = async () => {
    setSaving(true); setSaved2(false);
    try {
      await setContent({ pageKey: "voor-jou", content: JSON.stringify(values) });
      setSaved2(true); setTimeout(() => setSaved2(false), 2000);
    } finally { setSaving(false); }
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-4 pb-3 border-b border-gray-100">Paginakop</h3>
        <div className="space-y-4">
          <Field label="Klein label boven titel" value={values.label ?? ""} onChange={v => set("label", v)} />
          <Field label="Titel" value={values.titel ?? ""} onChange={v => set("titel", v)} />
          <Field label="Subtitel" value={values.subtitel ?? ""} onChange={v => set("subtitel", v)} multiline />
        </div>
      </div>
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
        De productkaarten beheer je via <strong>Verkoop → Shop</strong>. Zet &ldquo;Toon op Voor Jou&rdquo; aan bij elk product dat hier moet verschijnen.
      </div>
      <SaveBar onSave={handleSave} saving={saving} saved={saved2} />
    </div>
  );
}

// ─── Hoofdpagina ──────────────────────────────────────────────────────────────
const TABS: { key: Tab; label: string; href: string }[] = [
  { key: "homepage",     label: "Homepage",            href: "/" },
  { key: "waarom-benji", label: "Waarom Benji",        href: "/waarom-benji" },
  { key: "voor-jou",     label: "Voor Jou",            href: "/voor-jou" },
  { key: "privacy",      label: "Privacy",              href: "/privacy" },
  { key: "av",           label: "Alg. voorwaarden",    href: "/algemene-voorwaarden" },
  { key: "faq",          label: "FAQ",                  href: "/faq" },
];

export default function PaginasAdminPage() {
  const [tab, setTab] = useState<Tab>("homepage");
  const current = TABS.find(t => t.key === tab)!;

  return (
    <div className="max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <LayoutTemplate size={22} className="text-primary-500" />
          <div>
            <h1 className="text-xl font-bold text-gray-900">Pagina's</h1>
            <p className="text-sm text-gray-500">Bewerk de teksten op je publieke pagina's</p>
          </div>
        </div>
        <a href={current.href} target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors">
          <ExternalLink size={14} /> Bekijk pagina
        </a>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl flex-wrap">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === t.key ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === "homepage"     && <HomepageTab />}
      {tab === "waarom-benji" && <WaaromBenjiTab />}
      {tab === "voor-jou"     && <VoorJouTab />}
      {tab === "privacy"      && <SectionsTab pageKey="privacy" defaults={PRIVACY_DEFAULTS} href="/privacy" />}
      {tab === "av"           && <SectionsTab pageKey="av" defaults={AV_DEFAULTS} href="/algemene-voorwaarden" />}
      {tab === "faq"          && <FaqTab />}
    </div>
  );
}
