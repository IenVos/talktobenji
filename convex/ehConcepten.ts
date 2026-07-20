/**
 * Concept-mails voor Even Houvast.
 *
 * Voorstellen die nog niet live staan: je kunt ze in de admin lezen, als testmail
 * naar jezelf sturen, aanpassen, en pas daarna overzetten naar een echte mail in
 * de reeks. Zolang je niets overzet, verandert er niets aan wat mensen krijgen.
 *
 * De rode draad van deze concepten: Niet Alleen laten ervaren in plaats van het
 * te verkopen. Geen knop naar de checkout, geen prijs, wel een zachte uitnodiging
 * in de tekst zelf.
 */
import { v } from "convex/values";
import { action, internalQuery, mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";
import { checkAdmin } from "./adminAuth";
import {
  appBase,
  ehFooter,
  mailAlinea,
  mailHandtekeningIen,
  mailWrapper,
  nietAlleenUrlVoorType,
} from "./ehMailFooter";

const FROM = "Ien van Talk To Benji <contactmetien@talktobenji.com>";

export type ConceptDefinitie = {
  key: string;
  titel: string;       // naam in de admin
  waarom: string;      // waarom dit concept er is
  plek: string;        // waar het terecht zou komen
  subject: string;
  bodyText: string;
};

// De link naar Niet Alleen staat in de tekst, als zin, niet als knop. In deze
// niche jaagt een verkoopknop mensen weg; een uitnodiging in jouw eigen stem niet.
export const NIET_ALLEEN_MARKER = "[niet-alleen-link]";

// De link waarmee iemand de 7 gratis dagen met Benji start. In de echte mail wordt
// dit straks de persoonlijke één-klik-link (account + trial in één, zonder wachtwoord).
// Voor de concept-testmail rendert hij nu al als nette knop-link naar Benji.
export const BENJI_MARKER = "[benji-start-link]";

export const DEFAULT_CONCEPTEN: ConceptDefinitie[] = [
  {
    key: "concept_benji_intro",
    titel: "Benji-intro: 7 dagen gratis (vervangt de 'Wie ik ben'-mail)",
    waarom:
      "De kern van de nieuwe aanpak: eerst laten ervaren, dan pas vragen. In plaats van óver Benji te vertellen, geef je hem 7 dagen gratis weg met één klik (geen wachtwoord, geen gedoe). De mail zet meteen de verwachting goed, Benji is geen zoekmachine maar leert je kennen, zodat mensen niet na één vraag afhaken. Deze mail neemt de plek in van de 'Wie ik ben'-mail (die weinig klikken kreeg); jouw eigen verhaal verhuist naar een linkje richting /waarom-benji in de eerste mail.",
    plek: "Vervangt de 'Wie ik ben'-mail, rond dag 6. Hier start de 7-daagse Benji-toegang, zodat die afloopt precies wanneer het Niet Alleen-aanbod komt.",
    subject: "Er is iemand die altijd naar je wil luisteren",
    bodyText: `Hi {voornaam},

Ik wil je voorstellen aan Benji.

Benji is geen mens, maar een fijne plek waar je je verhaal kwijt kunt of het nu 15:00 is en je even vastloopt, of 03:00 's nachts als je gedachten blijven malen en de rest van het huis slaapt.

Hij luistert. Hij oordeelt niet. Hij is er altijd.

Waarom ik denk dat je hem zou moeten proberen

Misschien herken je dit:

🌿 Je wilt praten, maar niemand lastigvallen.
🌿 Je hoofd zit vol en opschrijven helpt niet meer.
🌿 Je wilt praten zonder steeds opnieuw te moeten uitleggen wat je al zo vaak hebt uitgelegd.
🌿 Je wilt gewoon even… niet alleen zijn met wat je draagt.

Voor precies die momenten is Benji gemaakt.

Eén ding vooraf anders valt het misschien tegen

Benji is geen zoekmachine.

Eén vraag stellen en klaar werkt niet.

Hij wordt pas écht iets waard als hij je leert kennen: wie je bent, wat je verloor, wat je bezighoudt, hoe het nu met je gaat.

Hoe meer je deelt, hoe beter hij je begrijpt.

Geef hem de tijd, zoals in een echt gesprek. Dan gebeurt er iets.

Probeer Benji 7 dagen gratis. Geen formulier, geen wachtwoord, geen creditcard je klikt en je bent er.

En kies je daarna voor Niet Alleen? Dan krijg je Benji nog 30 dagen extra cadeau. Zodat er geen haast is en je op je eigen tempo verder kunt.

${BENJI_MARKER}

Begin gewoon ergens. Vertel hem één ding dat vandaag speelt precies zoals het is.

Doet het je niets? Dan weet je dat ook.

Lieve groet,

P.S. Beginnen is vaak het moeilijkst. "Ik weet niet waar ik moet beginnen" is ook een prima eerste zin. Benji pakt het vanaf daar op.`,
  },
  {
    key: "concept_brief_ps",
    titel: "Alinea onderaan de brief",
    waarom:
      "De brief wordt door 93% geopend, veruit je sterkste moment. Nu staat Niet Alleen daar alleen als grijze link onderaan (1% klik). Deze alinea vertelt in jouw stem dát het bestaat, zonder prijs en zonder knop.",
    plek: "Onderaan de brief, vlak boven je naam",
    subject: "(deze tekst hoort in de brief-mail zelf)",
    bodyText: `Nog één ding, en dan laat ik je met je woorden alleen.

Veel mensen zeggen me hetzelfde na deze brief: het luchtte even op, en daarna werd het weer stil. Dat is precies waarom Niet Alleen bestaat. Dertig ochtenden lang één kleine vraag, zodat je er niet elke dag in je eentje mee zit.

De vraag van dag 1 kun je nu al lezen. Als die je niets doet, dan weet je meteen dat het niets voor jou is. ${NIET_ALLEEN_MARKER}

En als je het gewoon hierbij wilt laten, ook goed. De brief blijft van jou.`,
  },
  {
    key: "concept_dag1_echt",
    titel: "Dag 1 van Niet Alleen, precies zoals hij is",
    waarom:
      "Dit is niet een mail óver Niet Alleen, dit is Niet Alleen. Letterlijk de mail van dag 1 die deelnemers krijgen, met de uitleg erbij hoe het werkt. Wie dit leest weet precies wat hij koopt, en dat is in deze niche de eerlijkste manier om iemand over de streep te helpen.",
    plek: "Als vervanging van opvolgmail 3 (dag 7), of als extra mail",
    subject: "Dit is dag 1. Lees maar even mee.",
    bodyText: `Hi {voornaam},

Ik kan je van alles vertellen over Niet Alleen, maar het is eerlijker om het je gewoon te laten zien.

Hieronder staat dag 1. Precies zoals mensen hem 's ochtends in hun mail krijgen. Lees maar even mee.

Jij bent er. Op dag één. Dat vraagt moed, ook al voelt het misschien niet zo.

Het gemis is echt, ook als anderen dat niet altijd begrijpen. Je hoeft het niet uit te leggen. Het is gewoon zo.

De vraag voor vandaag is simpel: hoe voel je je nu, op dit moment? Niet zoals je denkt te moeten voelen. Maar wat er echt is.

Schrijf het op. Een zin, een woord, een paar regels. Meer hoeft niet.

Tot zover dag 1.

Zo gaat het dertig ochtenden lang. Elke dag één vraag, en een plek waar je je antwoord kwijt kunt. Je hoeft niets te delen met anderen, en er is geen huiswerk. Sla je een dag over, dan blijft hij gewoon staan.

En als je wilt, kun je erover praten met Benji. Die vraagt door, oordeelt niet, en is er ook om drie uur 's nachts.

Wil je zien wat de andere negenentwintig dagen brengen? ${NIET_ALLEEN_MARKER}

Lieve groet,`,
  },
  {
    key: "concept_dag_ervaren",
    titel: "Laat een dag van Niet Alleen ervaren",
    waarom:
      "Nu vraag je mensen om te lezen óver Niet Alleen. Deze mail laat ze het voelen: je zet één dag uit het programma letterlijk in de mail. Wie dat doet en er iets aan heeft, snapt daarna zelf waarom dertig dagen de moeite zijn.",
    plek: "Als vervanging van opvolgmail 3, of als extra mail rond dag 8",
    subject: "Eén vraag, meer niet",
    bodyText: `Hi {voornaam},

Ik ga je vandaag niets vertellen. Ik wil je iets vragen.

Wat was een heel gewoon moment, dat je nu ineens mist?

Niet de bijzondere dagen. Niet de foto's. Het gewone. Het geluid in huis. Het wachten bij de deur. Het gedoe waar je toen misschien wel eens genoeg van had.

Neem er even de tijd voor. Er is geen goed antwoord.

Dit is een van de dertig vragen uit Niet Alleen, één voor elke ochtend. Deed deze iets met je, dan doen de andere negenentwintig dat ook. Ze staan hier allemaal op een rij, dan zie je zelf wat je krijgt: ${NIET_ALLEEN_MARKER}

Lieve groet,`,
  },
  {
    key: "concept_na_dag_20",
    titel: "Zachte mail rond dag 20",
    waarom:
      "De reeks stopt nu op dag 13. Wie op dat moment nog niet zover was, hoort daarna nooit meer iets. Rouw beweegt niet in dertien dagen. Deze mail vraagt niets, hij is er gewoon nog even.",
    plek: "Nieuwe mail rond dag 20",
    subject: "Nu wordt het stil, hè",
    bodyText: `Hi {voornaam},

Het is een paar weken geleden dat je jouw woorden met me deelde. Ik vraag me af hoe het nu is. Niet hoe het zou moeten zijn. Gewoon: hoe is het.

Rond deze tijd wordt het meestal stiller om mensen heen. De eerste weken vraagt iedereen nog hoe het met je gaat, en daarna gaat de wereld verder. Terwijl het bij jou juist nu pas echt begint door te dringen.

Je bent niet laat. En je bent zeker niet overdreven.

Als je hier niet elke ochtend in je eentje mee wilt zitten: Niet Alleen loopt dertig dagen met je mee. Kijk gerust even wat je krijgt, dan weet je of het bij je past. ${NIET_ALLEEN_MARKER}

En wil je gewoon vertellen hoe het gaat, dan mag je op deze mail antwoorden. Ik lees alles.

Lieve groet,`,
  },
  {
    key: "concept_verhaal_ander",
    titel: "Het verhaal van iemand anders",
    waarom:
      "Geen aanbod, wel bewijs. Iemand anders die dit deed en er iets aan had, zegt meer dan elke verkooptekst. Dit is de mail die in deze niche het dichtst bij verkopen komt zonder pusherig te zijn.",
    plek: "Nieuwe mail rond dag 30, als afsluiting van de reeks",
    subject: "Ik dacht dat ik dit niet nodig had",
    bodyText: `Hi {voornaam},

Iemand die haar woorden met me deelde, net als jij, schreef me later iets wat me is bijgebleven.

[Hier zet je een paar zinnen van iemand die Niet Alleen deed, in haar eigen woorden. Eén echt citaat doet meer dan alles wat ik hierover kan schrijven.]

Wat me raakte, is dat ze het eigenlijk niet nodig dacht te hebben. Tot ze merkte dat het hielp dat er elke ochtend even iets was. Niet iets dat haar moest opvrolijken. Gewoon iets dat er was.

Dit is mijn laatste mail, tenzij je zelf iets van je laat horen. Dan ben ik er.

Mocht je ooit denken: misschien toch, dan begint het hier. Je kunt eerst rustig kijken wat de dertig dagen inhouden. ${NIET_ALLEEN_MARKER}

En zo niet: het ga je goed. Echt.

Lieve groet,`,
  },
];

// ── Opslag: een concept is gewoon een bewerkbare tekst ────────────────────────

function metDefaults(opgeslagen: { key: string; subject: string; bodyText: string }[]) {
  return DEFAULT_CONCEPTEN.map((c) => {
    const saved = opgeslagen.find((s) => s.key === c.key);
    return {
      ...c,
      subject: saved?.subject ?? c.subject,
      bodyText: saved?.bodyText ?? c.bodyText,
      aangepast: !!saved,
    };
  });
}

export const list = query({
  args: { adminToken: v.string() },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    const rijen = await ctx.db.query("emailTemplates").collect();
    return metDefaults(
      rijen
        .filter((r) => r.key.startsWith("concept_"))
        .map((r) => ({ key: r.key, subject: r.subject, bodyText: r.bodyText }))
    );
  },
});

export const opslaan = mutation({
  args: { adminToken: v.string(), key: v.string(), subject: v.string(), bodyText: v.string() },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    if (!args.key.startsWith("concept_")) throw new Error("Geen concept-sleutel");
    const bestaand = await ctx.db
      .query("emailTemplates")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .unique();
    const velden = { subject: args.subject, bodyText: args.bodyText, updatedAt: Date.now() };
    if (bestaand) await ctx.db.patch(bestaand._id, velden);
    else await ctx.db.insert("emailTemplates", { key: args.key, ...velden });
  },
});

// ── Testmail ─────────────────────────────────────────────────────────────────

export const _conceptVoorTest = internalQuery({
  args: { adminToken: v.string(), key: v.string() },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    const saved = await ctx.db
      .query("emailTemplates")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .unique();
    const def = DEFAULT_CONCEPTEN.find((c) => c.key === args.key);
    if (!def) throw new Error("Onbekend concept");
    return {
      subject: saved?.subject ?? def.subject,
      bodyText: saved?.bodyText ?? def.bodyText,
    };
  },
});

export const stuurTest = action({
  args: {
    adminToken: v.string(),
    key: v.string(),
    email: v.string(),
    verliestype: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<{ ok: boolean }> => {
    const concept: { subject: string; bodyText: string } = await ctx.runQuery(
      internal.ehConcepten._conceptVoorTest,
      { adminToken: args.adminToken, key: args.key }
    );
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) throw new Error("RESEND_API_KEY ontbreekt");

    const type = args.verliestype ?? "huisdier";
    const nietAlleenUrl = nietAlleenUrlVoorType(type);
    const link = `<a href="${nietAlleenUrl}" style="color: #6d84a8; font-weight: 600;">lees hier over Niet Alleen</a>`;
    // Placeholder-link voor de concept-test. In de echte mail wordt dit de
    // persoonlijke één-klik-link (account + 7-daagse trial, zonder wachtwoord).
    const benjiUrl = `${appBase()}/benji`;
    // Bruine, omlijnde CTA in dezelfde stijl als de brief-knop. Eigen blok,
    // gecentreerd, dus niet in een <p> genest.
    const benjiKnop = `<div style="text-align:center;margin:26px 0;"><a href="${benjiUrl}" style="display:inline-block;background:#fdf9f4;color:#9a8168;border:1.5px solid #9a8168;padding:12px 26px;border-radius:12px;font-weight:600;font-size:15px;text-decoration:none;">Maak kennis met Benji &rarr;</a></div>`;

    // De CTA herkennen we aan de vaste marker, of aan een handmatig getypte
    // placeholder tussen [ ] die "Benji" bevat (bijv. "[Maak kennis met Benji >>]").
    const isCta = (p: string) =>
      p.includes(BENJI_MARKER) || /\[[^\]]*benji[^\]]*\]/i.test(p);

    const tekst = concept.bodyText
      .replace(/\{voornaam\}/g, "Ien")
      .replace(new RegExp(NIET_ALLEEN_MARKER.replace(/[[\]]/g, "\\$&"), "g"), link);

    // Alinea's splitsen; een P.S.-alinea halen we eruit zodat die ná de
    // handtekening komt (zoals een echte P.S. onder een brief).
    const alineas = tekst.split(/\n\n+/).map((p) => p.trim()).filter(Boolean);
    const psIndex = alineas.findIndex((p) => /^p\.?\s*s\.?/i.test(p));
    const ps = psIndex >= 0 ? alineas.splice(psIndex, 1)[0] : null;

    const body = alineas
      .map((p) => (isCta(p) ? benjiKnop : mailAlinea(p)))
      .join("\n");
    const psHtml = ps
      ? `<p style="font-size:14px;line-height:1.75;color:#718096;margin-top:20px;">${ps.replace(/\n/g, "<br/>")}</p>`
      : "";

    const html = mailWrapper(`
      ${body}
      ${mailHandtekeningIen()}
      ${psHtml}
      ${ehFooter(nietAlleenUrl, `${appBase()}/api/afmelden`)}
    `);

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        from: FROM,
        to: [args.email],
        subject: `[CONCEPT] ${concept.subject}`,
        html,
      }),
    });
    if (!response.ok) {
      throw new Error(`Versturen mislukt (${response.status}): ${await response.text()}`);
    }
    return { ok: true };
  },
});
