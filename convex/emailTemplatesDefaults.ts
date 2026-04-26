/**
 * Standaard e-mail templates — plain TS, veilig te importeren in browser én server.
 */
export const DEFAULT_TEMPLATES = {
  trial_day5: {
    subject: "Nog 2 dagen — je proefperiode loopt bijna af",
    bodyText: `Over 2 dagen loopt je proefperiode af.\n\nIk hoop dat je in deze week hebt gevoeld waarvoor Benji er is — een plek om je verhaal kwijt te kunnen, op je eigen tempo.\n\nAls je wilt doorgaan met wat je bent begonnen, je gesprekken, je reflecties, je doelen, dan is er een mogelijkheid die bij je past. Bekijk de opties via de knop hieronder. Wat je tot nu toe hebt opgebouwd, blijft altijd van jou.`,
  },
  trial_day7: {
    subject: "Vandaag is de laatste dag van je proefperiode",
    bodyText: `Hoe gaat het met je?\n\nVandaag is de laatste dag van je 7 dagen met Benji. Ik hoop dat het iets heeft gebracht — al was het maar het gevoel dat je er niet alleen voor stond.\n\nAlles wat je hebt opgebouwd — je gesprekken, reflecties, memories — blijft bewaard, wat je ook kiest.\n\nWil je verder? Bekijk hieronder wat bij je past. Geen druk, maar de deur staat open.`,
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
