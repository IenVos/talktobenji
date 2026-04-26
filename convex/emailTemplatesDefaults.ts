/**
 * Standaard e-mail templates — plain TS, veilig te importeren in browser én server.
 */
export const DEFAULT_TEMPLATES = {
  trial_day5: {
    subject: "Nog 2 dagen — je proefperiode loopt bijna af",
    aanhef: "Lieve {naam},",
    bodyText: `Over 2 dagen loopt je proefperiode af.\n\nIk hoop dat je in deze week hebt gevoeld waarvoor Benji er is — een plek om je verhaal kwijt te kunnen, op je eigen tempo.\n\nAls je wilt doorgaan met wat je bent begonnen, je gesprekken, je reflecties, je doelen, dan is er een mogelijkheid die bij je past. Wat je tot nu toe hebt opgebouwd, blijft altijd van jou.`,
    buttonText: "Kies wat bij je past",
    buttonUrl: "https://www.talktobenji.com/lp/prijzen",
  },
  trial_day7: {
    subject: "Vandaag is de laatste dag van je proefperiode",
    aanhef: "Lieve {naam},",
    bodyText: `Hoe gaat het met je?\n\nVandaag is de laatste dag van je 7 dagen met Benji. Ik hoop dat het iets heeft gebracht — al was het maar het gevoel dat je er niet alleen voor stond.\n\nAlles wat je hebt opgebouwd — je gesprekken, reflecties, memories — blijft bewaard, wat je ook kiest.\n\nWil je verder? De deur staat open.`,
    buttonText: "Kies wat bij je past",
    buttonUrl: "https://www.talktobenji.com/lp/prijzen",
  },
  // ── Jaar ──
  renewal_jaar_1: {
    subject: "Hoe gaat het met je?",
    aanhef: "Hi {naam},",
    bodyText: `Het is bijna een jaar geleden dat je met Talk To Benji bent begonnen. Ik hoop dat het je heeft geholpen — op welke manier dan ook.\n\nJe toegang loopt over ongeveer een maand af op {einddatum}. Als je nog een jaar samen wil gaan, is dat van harte welkom.`,
    buttonText: "Nog een jaar samen",
    buttonUrl: "https://www.talktobenji.com/betalen/je-hoeft-het-niet-alleen-te-dragen",
  },
  renewal_jaar_2: {
    subject: "Nog twee weken — wil je verder?",
    aanhef: "Hi {naam},",
    bodyText: `Nog twee weken, dan loopt je toegang tot Talk To Benji af op {einddatum}.\n\nAlles wat je hebt opgebouwd — je gesprekken, reflecties, memories — blijft bewaard zolang je account bestaat. Maar Benji zal na die datum niet meer voor je beschikbaar zijn.\n\nWil je nog een jaar verder?`,
    buttonText: "Toegang verlengen",
    buttonUrl: "https://www.talktobenji.com/betalen/je-hoeft-het-niet-alleen-te-dragen",
  },
  renewal_jaar_3: {
    subject: "Vandaag is je laatste dag — tot ziens, of tot snel",
    aanhef: "Hi {naam},",
    bodyText: `Vandaag is de laatste dag van je jaar met Talk To Benji.\n\nIk ben blij dat je er was. Ik hoop dat het jaar je iets heeft gegeven, al was het maar het gevoel dat je er niet alleen voor stond.\n\nAls je nog een jaar verder wilt, kun je dat hieronder regelen. Benji staat voor je klaar.\n\nWil je liever stoppen? Je kunt al je gegevens downloaden of je account verwijderen via Instellingen in je account.`,
    buttonText: "Nog een jaar samen",
    buttonUrl: "https://www.talktobenji.com/betalen/je-hoeft-het-niet-alleen-te-dragen",
  },

  // ── Kwartaal ──
  renewal_kwartaal_1: {
    subject: "Je kwartaal loopt bijna af",
    aanhef: "Hi {naam},",
    bodyText: `Over twee weken loopt je toegang tot Talk To Benji af op {einddatum}.\n\nIk hoop dat de afgelopen maanden je iets hebben gegeven — een plek om je verhaal kwijt te kunnen, op je eigen tempo.\n\nWil je doorgaan?`,
    buttonText: "Nog een kwartaal",
    buttonUrl: "https://www.talktobenji.com/betalen/47-kwartaal",
    upsellText: "Een heel jaar voor €97",
    upsellUrl: "https://www.talktobenji.com/betalen/je-hoeft-het-niet-alleen-te-dragen",
  },
  renewal_kwartaal_2: {
    subject: "Nog een week — wil je verder?",
    aanhef: "Hi {naam},",
    bodyText: `Nog één week, dan loopt je toegang af op {einddatum}.\n\nAlles wat je hebt opgebouwd blijft bewaard, wat je ook kiest. Maar Benji zal na die datum niet meer voor je beschikbaar zijn.\n\nWil je nog een kwartaal?`,
    buttonText: "Toegang verlengen",
    buttonUrl: "https://www.talktobenji.com/betalen/47-kwartaal",
    upsellText: "Een heel jaar voor €97",
    upsellUrl: "https://www.talktobenji.com/betalen/je-hoeft-het-niet-alleen-te-dragen",
  },
  renewal_kwartaal_3: {
    subject: "Vandaag is je laatste dag",
    aanhef: "Hi {naam},",
    bodyText: `Vandaag loopt je toegang tot Talk To Benji af.\n\nIk ben blij dat je er was. Als je wilt doorgaan, kun je dat hieronder regelen — Benji staat voor je klaar.\n\nWil je liever stoppen? Je kunt al je gegevens downloaden via Instellingen in je account.`,
    buttonText: "Nog een kwartaal",
    buttonUrl: "https://www.talktobenji.com/betalen/47-kwartaal",
    upsellText: "Een heel jaar voor €97",
    upsellUrl: "https://www.talktobenji.com/betalen/je-hoeft-het-niet-alleen-te-dragen",
  },

  // ── Maand ──
  renewal_maand_1: {
    subject: "Je toegang loopt bijna af",
    aanhef: "Hi {naam},",
    bodyText: `Over een week loopt je maandtoegang tot Talk To Benji af op {einddatum}.\n\nWil je doorgaan? Je kunt je toegang eenvoudig verlengen via de knop hieronder.`,
    buttonText: "Nog een maand",
    buttonUrl: "https://www.talktobenji.com/betalen/17-voor-1-maand",
    upsellText: "3 maanden voor €47",
    upsellUrl: "https://www.talktobenji.com/betalen/47-kwartaal",
  },
  renewal_maand_2: {
    subject: "Nog 3 dagen — wil je verder?",
    aanhef: "Hi {naam},",
    bodyText: `Nog 3 dagen, dan loopt je toegang af op {einddatum}.\n\nAlles wat je hebt opgebouwd blijft bewaard. Maar Benji zal na die datum niet meer voor je beschikbaar zijn.\n\nWil je nog een maand?`,
    buttonText: "Toegang verlengen",
    buttonUrl: "https://www.talktobenji.com/betalen/17-voor-1-maand",
    upsellText: "3 maanden voor €47",
    upsellUrl: "https://www.talktobenji.com/betalen/47-kwartaal",
  },
  renewal_maand_3: {
    subject: "Vandaag is je laatste dag",
    aanhef: "Hi {naam},",
    bodyText: `Vandaag loopt je maandtoegang tot Talk To Benji af.\n\nAls je wilt doorgaan, kun je dat hieronder direct regelen. Benji staat voor je klaar.`,
    buttonText: "Nog een maand",
    buttonUrl: "https://www.talktobenji.com/betalen/17-voor-1-maand",
    upsellText: "3 maanden voor €47",
    upsellUrl: "https://www.talktobenji.com/betalen/47-kwartaal",
  },

  // legacy keys — worden niet meer gebruikt maar staan voor backwards compat
  renewal_email1: {
    subject: "Hoe gaat het met je?",
    aanhef: "Hi {naam},",
    bodyText: `Je toegang loopt binnenkort af. Wil je doorgaan?`,
    buttonText: "Verlengen",
    buttonUrl: "https://www.talktobenji.com/betalen/je-hoeft-het-niet-alleen-te-dragen",
  },
  renewal_email2: {
    subject: "Nog twee weken — wil je verder?",
    aanhef: "Hi {naam},",
    bodyText: `Je toegang loopt binnenkort af.`,
    buttonText: "Toegang verlengen",
    buttonUrl: "https://www.talktobenji.com/betalen/je-hoeft-het-niet-alleen-te-dragen",
  },
  renewal_email3: {
    subject: "Vandaag is je laatste dag",
    aanhef: "Hi {naam},",
    bodyText: `Vandaag loopt je toegang af.`,
    buttonText: "Verlengen",
    buttonUrl: "https://www.talktobenji.com/betalen/je-hoeft-het-niet-alleen-te-dragen",
  },

  // Niet Alleen
  niet_alleen_welkom: {
    subject: "Welkom bij Niet Alleen, dag 1 begint vandaag",
    bodyText: `Fijn dat je er bent. De komende 30 dagen lopen we samen met je mee, één dag tegelijk.\n\nElke ochtend ontvang je een kleine vraag. Geen druk, geen goed of fout. Gewoon ruimte voor wat er in je leeft.`,
  },
  niet_alleen_dag: {
    subject: "Dag {dag}, jouw moment van vandaag",
    bodyText: `Geen zin vandaag? Dat is ook goed. De pagina blijft open staan.`,
  },
  niet_alleen_dag15: {
    subject: "Je bent halverwege. Hoe gaat het?",
    bodyText: `Je bent nu halverwege. Vijftien dagen. Dat is niet niks.

Hoe gaat het echt? Niet hoe je denkt dat het zou moeten gaan. Maar wat er nu in je leeft.

De afgelopen twee weken heb je elke dag iets in jezelf aangekeken. Dat vraagt moed, ook al voelt het van binnenuit misschien gewoon als doorgaan.

En als je merkt dat je soms meer nodig hebt: bij TalkToBenji kun je ook gewoon praten met Benji. Herinneringen bewaren. Altijd terugkijken op wat je hebt geschreven. Het is er als je het ooit nodig hebt, zonder verplichtingen.

Tot morgen,
Benji`,
  },
  niet_alleen_dag28: {
    subject: "Nog twee dagen en wat er daarna is",
    bodyText: `Over twee dagen zijn je 30 dagen klaar. Wat je hebt geschreven, is van jou. Het verdwijnt niet zomaar.\n\nOp dag 30 sturen we je een overzicht van alles wat je hebt ingevuld, zodat je het kunt bewaren. Wil je daarna gewoon verdergaan? Dan kun je je account omzetten naar een volledig abonnement.`,
  },
  niet_alleen_dag30: {
    subject: "Je 30 dagen zijn klaar — dit is voor jou",
    bodyText: `Je hebt het gedaan. 30 dagen lang ben je er geweest voor jezelf. Dat is meer dan het klinkt.

Alles wat je hebt geschreven kun je nu bekijken en downloaden als persoonlijk dagboek, een herinnering die helemaal van jou is.

En als je verder wilt: TalkToBenji is er voor als je behoefte hebt aan een luisterend oor. Je kunt er gesprekken voeren met Benji, herinneringen bewaren in je eigen vault, en altijd terugkijken op wat je hebt geschreven. Geen verplichting, maar de deur staat open.

Je hebt nog 7 dagen om alles te bewaren en te beslissen wat je wilt.

We zijn blij dat je er was.`,
  },
} as const;

export type TemplateKey = keyof typeof DEFAULT_TEMPLATES;
