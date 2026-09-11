/**
 * Verliestype-pagina's in blok-opmaak, toegespitst op het product Niet Alleen.
 *
 * Eén pagina = één doel: Niet Alleen (€49). Geen Zij aan Zij of Benji als
 * concurrerende CTA op de pagina; de Even Houvast-popup is de zachte vangnet-stap.
 * Pagina's blijven concept (gepubliceerd wordt niet aangeraakt) zodat Ien ze
 * eerst nakijkt. Re-runbaar.
 */
import { internalMutation } from "./_generated/server";

async function zetPagina(
  ctx: any,
  opts: { slug: string; pageTitle: string; metaDescription: string; blocks: any[] }
) {
  const doel = await ctx.db
    .query("blokPaginas")
    .withIndex("by_slug", (q: any) => q.eq("slug", opts.slug))
    .first();
  if (!doel) throw new Error(`Doelpagina "${opts.slug}" niet gevonden.`);
  await ctx.db.patch(doel._id, {
    blocksJson: JSON.stringify(opts.blocks),
    pageTitle: opts.pageTitle,
    metaDescription: opts.metaDescription,
    verliestype: doel.verliestype,
    updatedAt: Date.now(),
  });
  return { slug: opts.slug, blokken: opts.blocks.length };
}

const CTA = "Start met Niet Alleen";

// ── Verlies van een huisdier (Niet Alleen, €49) ─────────────────────────
export const seedHuisdier = internalMutation({
  args: {},
  handler: async (ctx) => {
    const url = "/betalen/niet-alleen-huisdier";
    const micro = "€49 eenmalig. Je begint direct, in je eigen tempo.";
    return zetPagina(ctx, {
      slug: "verlies-huisdier",
      pageTitle: "Niet Alleen — 8 weken bij het verlies van je dier",
      metaDescription:
        "Acht weken lang elke dag een klein moment bij het verlies van je huisdier. In je eigen tempo, met Benji erbij.",
      blocks: [
        { key: "header", type: "header", logo: "/images/benji-logo-2.png", merk: "Talk To Benji", sub: "Niet Alleen" },
        {
          key: "hero", type: "hero",
          eyebrow: "Voor wie een dier verloor dat familie was",
          titel1: "De wereld draait door,",
          titel2: "maar in jouw huis is de leegte nog net zo groot.",
          body: [
            { soort: "lead", tekst: "Een maatje. Routine. Stilte die nu anders voelt." },
            { soort: "lead", tekst: "Je mist de kleine dingen. De vanzelfsprekendheid. De aanwezigheid." },
            { soort: "whisper", tekst: "En misschien voelt het alsof je dit niet \"groot genoeg\" mag maken." },
            { soort: "lead", tekst: "Dus je zegt er minder over dan je eigenlijk zou willen." },
            { soort: "thought", tekst: "Maar jouw verdriet is echt." },
          ],
          facts: "Acht weken lang, **om de dag** een bericht dat je op je eigen tempo doorloopt. Met Benji erbij, dag en nacht.",
          ctaText: CTA, ctaUrl: url, micro,
        },
        {
          key: "herkenning", type: "herkenning",
          eyebrow: "Misschien herken je dit",
          titel: "Soms ben je niet verdrietig.\nSoms ben je gewoon moe van alles dragen.",
          lead: "Je functioneert prima. En toch loopt er iets mee dat niemand ziet. Misschien herken je dit:",
          voices: [
            "Je hoofd blijft maar doorgaan.",
            "Je weet niet goed wat je voelt.",
            "Je probeert sterk te blijven.",
            "Je bent moe van alles alleen dragen.",
            "Iedereen zegt dat het maar een dier was.",
          ],
          pull: "Je verdriet mag er zijn. **Precies zoals het is.**",
        },
        {
          key: "band", type: "band", achtergrond: "band",
          eyebrow: "Wat Niet Alleen is",
          titel: "Elke dag een klein moment,\nalleen voor jou.",
          kicker: "Misschien voelt dit klein. **Maar juist dat ene moment om stil te staan kan het verschil maken tussen alles alleen dragen en even kunnen ademen.**",
          stack: [
            "Waar je niets hoeft uit te leggen.",
            "Waar je vandaag meer mag zijn dan gisteren.",
            "Waar je verdriet niet klein hoeft.",
          ],
        },
        {
          key: "kern", type: "kern",
          eyebrow: "Waar sta je bij stil",
          titel: "Niets moet. Alles mag.",
          naastLabel: "Zachte vragen die je op weg helpen, bijvoorbeeld:",
          naast: [
            "Waar denk je aan als het stil is in huis?",
            "Wanneer voelde jullie band het sterkst?",
            "Wat zou je nog tegen hem of haar willen zeggen?",
          ],
          slot: "Geen druk, geen huiswerk. Zacht, maar het brengt je wel ergens.",
        },
        {
          key: "ditkrijgje", type: "ditkrijgje",
          eyebrow: "Dit krijg je",
          titel: "Acht weken lang loop je het niet alleen.",
          items: [
            { kop: "Om de dag een bericht", tekst: "Acht weken lang, om de dag een klein bericht met een gedachte of vraag. Niks moet, je doet het op je eigen tempo." },
            { kop: "Erkenning zonder je te verdedigen", tekst: "Ruimte voor herinneringen én gemis, zonder dat je hoeft uit te leggen waarom dit zo groot is." },
            { kop: "Benji, dag en nacht", tekst: "Voor de momenten waarop het gemis ineens opkomt en je even iets kwijt wilt. Ook 's nachts." },
            { kop: "Je eigen plek om te houden", tekst: "Alles wat je opschrijft blijft van jou, ook na de acht weken." },
          ],
        },
        {
          key: "ervaringen", type: "ervaringen",
          eyebrow: "Wat anderen ervaren",
          titel: "Gewoon iemand die het begrijpt.",
          quotes: [
            { bron: "Sandra", tekst: "Ik dacht dat ik het wel alleen kon. Maar elke ochtend gaf dat ene moment me het gevoel dat er iemand aan me dacht, en dat was genoeg." },
            { bron: "Mariëlle", tekst: "Hier kon ik zeggen wat ik nergens anders kwijt kon, zonder dat iemand het probeerde op te lossen. Voor het eerst voelde mijn verdriet niet als iets om me voor te verontschuldigen." },
            { bron: "Annelies", tekst: "Iedereen zei dat het maar een hond was, maar hier voelde ik me eindelijk begrepen." },
          ],
        },
        {
          key: "aanbod", type: "offer", anchor: "aanbod",
          introLabel: "Wat als je het niet stil hoeft te dragen?",
          prijs: "€49", prijsSub: "eenmalig · 8 weken",
          bullets: [
            "Acht weken lang, om de dag een bericht",
            "Ruimte voor herinneringen en gemis, op je eigen tempo",
            "Benji erbij, dag en nacht",
            "Je eigen plek die je houdt",
          ],
          ctaText: CTA, ctaUrl: url,
          micro: "Je begint direct. Geen wachttijd, geen intake.",
        },
        {
          key: "final", type: "final", achtergrond: "band",
          eyebrow: "Tot slot",
          titel: "Je verdriet om je dier is echt.\nEn je hoeft het niet stil te dragen.",
          sub: "8 weken Niet Alleen.",
          ctaText: CTA, ctaUrl: url, micro,
        },
      ],
    });
  },
});
