/**
 * Toespitsen van de gedupliceerde blok-LP's op hun verliestype.
 *
 * De pagina's verlies-huisdier en ik-voel-me-eenzaam zijn gedupliceerd van
 * zij-aan-zij (zelfde €425-programma-structuur). Deze seeds lezen de actuele
 * zij-aan-zij-blokken als basis en overschrijven ALLEEN de verlies-specifieke
 * teksten (hero, herkenning, band, kern, Ien, ervaringen, slot) + pageTitle/meta.
 * Programma-mechaniek (cadence/stappen/ditkrijgje/account/document/offer) blijft.
 *
 * Pagina's blijven op concept (gepubliceerd wordt niet aangeraakt) zodat Ien
 * ze nakijkt vóór livegang. Re-runbaar.
 */
import { internalMutation } from "./_generated/server";

type Overrides = Record<string, Record<string, unknown>>;

async function pasToe(
  ctx: any,
  opts: { doelSlug: string; pageTitle: string; metaDescription: string; overrides: Overrides }
) {
  const bron = await ctx.db
    .query("blokPaginas")
    .withIndex("by_slug", (q: any) => q.eq("slug", "zij-aan-zij"))
    .first();
  if (!bron) throw new Error("Bron zij-aan-zij niet gevonden.");
  const doel = await ctx.db
    .query("blokPaginas")
    .withIndex("by_slug", (q: any) => q.eq("slug", opts.doelSlug))
    .first();
  if (!doel) throw new Error(`Doelpagina "${opts.doelSlug}" niet gevonden.`);

  const blocks: any[] = JSON.parse(bron.blocksJson);
  const next = blocks.map((b) =>
    b && opts.overrides[b.key] ? { ...b, ...opts.overrides[b.key] } : b
  );
  await ctx.db.patch(doel._id, {
    blocksJson: JSON.stringify(next),
    pageTitle: opts.pageTitle,
    metaDescription: opts.metaDescription,
    updatedAt: Date.now(),
  });
  return { slug: opts.doelSlug, blokken: next.length };
}

// ── Verlies van een huisdier ────────────────────────────────────────────
export const seedHuisdier = internalMutation({
  args: {},
  handler: async (ctx) =>
    pasToe(ctx, {
      doelSlug: "verlies-huisdier",
      pageTitle: "Zij aan Zij — 8 weken persoonlijke begeleiding bij het verlies van je dier",
      metaDescription:
        "Persoonlijke begeleiding bij het verlies van je huisdier. Acht weken lang iemand die naast je blijft, met Ien en Benji.",
      overrides: {
        hero: {
          eyebrow: "8 weken persoonlijke begeleiding bij verlies van je dier",
          titel1: "Ze zeggen: het was maar een dier.",
          titel2: "Voor jou was het zoveel meer.",
          body: [
            { soort: "lead", tekst: "Je gaat naar je werk. Je praat met mensen. Je doet wat er moet gebeuren." },
            { soort: "lead", tekst: "Maar thuis voel je de lege mand. De riem aan de haak. De stilte waar altijd geluid was." },
            { soort: "whisper", tekst: "Een vaste wandeling. Een etenstijd. Een plek op de bank." },
            { soort: "lead", tekst: "Of gewoon: wakker worden en opnieuw beseffen dat hij of zij er echt niet meer is." },
            { soort: "lead", tekst: "En misschien denk je dan:" },
            { soort: "thought", tekst: "Met wie moet ik hier nu mee praten?" },
          ],
        },
        herkenning: {
          titel: "Je mist je maatje op momenten waarop niemand het ziet.",
          voices: [
            "Ik wil erover praten, maar ik ben bang dat mensen denken: het was maar een dier.",
            "Waarom doet dit vandaag ineens weer zo veel pijn?",
            "Iedereen lijkt het gewoon te vinden dat ik doorga. Waarom lukt mij dat niet?",
            "Ik weet niet eens wat ik nodig heb. Ik weet alleen dat ik dit niet alleen wil dragen.",
            "Soms wil ik gewoon vertellen wat ik vandaag mis.",
          ],
        },
        band: {
          stack: [
            "Je hoeft niet te weten hoe je verder moet.",
            "Je hoeft niet te weten wanneer je er \"overheen\" zou moeten zijn.",
            "Je hoeft je verdriet niet klein te maken omdat het \"maar\" een dier was.",
          ],
        },
        kern: {
          naast: [
            "Voor de dagen waarop je vooral wilt praten.",
            "Voor de dagen waarop je niets weet te zeggen.",
            "Voor de momenten waarop je ineens terugvalt.",
            "Voor de herinneringen aan jullie samen die je opnieuw wilt vertellen.",
            "Voor alles wat je liever niet zegt tegen iemand die het \"maar een dier\" vindt.",
          ],
        },
        ien: {
          paras: [
            "Ik ga je niet vertellen hoe je moet rouwen. Ik weet hoe eenzaam het kan zijn als de mensen om je heen het \"maar een dier\" vinden, terwijl jij een maatje mist dat je dagen deelde.",
            "Ik ken verlies in veel gedaantes: een kinderwens die niet uitkwam, een bedrijf waar ik alles in had gelegd, en dieren die voor mij familie waren.",
            "Daarom heb ik Zij aan Zij gemaakt. Geen methode die je moet volgen. Geen vinkjes die je moet zetten. Gewoon iemand die naast je blijft.",
          ],
        },
        ervaringen: {
          quotes: [
            { bron: "Voorbeeld, vervangen voor livegang", tekst: "Voor het eerst hoefde ik niet uit te leggen waarom ik zo verdrietig was om een dier." },
            { bron: "Voorbeeld, vervangen voor livegang", tekst: "Ik dacht dat ik vooral iemand nodig had die luisterde. Pas onderweg merkte ik hoeveel ik al die tijd alleen had gedragen." },
            { bron: "Voorbeeld, vervangen voor livegang", tekst: "Geen adviezen, geen 'geef het tijd'. Gewoon iemand die bleef. Dat was precies wat ik nodig had." },
          ],
        },
      },
    }),
});

// ── Ik voel me eenzaam ──────────────────────────────────────────────────
export const seedEenzaam = internalMutation({
  args: {},
  handler: async (ctx) =>
    pasToe(ctx, {
      doelSlug: "ik-voel-me-eenzaam",
      pageTitle: "Zij aan Zij — 8 weken iemand die echt naast je staat",
      metaDescription:
        "Als je je alleen voelt: acht weken lang iemand die naast je blijft, met Ien en Benji.",
      overrides: {
        hero: {
          eyebrow: "8 weken persoonlijke begeleiding als je je alleen voelt",
          titel1: "Je bent omringd door mensen.",
          titel2: "En toch voel je je alleen.",
          body: [
            { soort: "lead", tekst: "Je gaat naar je werk. Je praat met mensen. Je doet wat er moet gebeuren." },
            { soort: "lead", tekst: "Maar er is zoveel dat je nergens echt kwijt kunt." },
            { soort: "whisper", tekst: "Niet omdat er niemand is. Maar omdat je niemand wilt belasten." },
            { soort: "lead", tekst: "Of gewoon: 's avonds thuiskomen in een stilte die te groot voelt." },
            { soort: "lead", tekst: "En misschien denk je dan:" },
            { soort: "thought", tekst: "Met wie kan ik hier nu écht over praten?" },
          ],
        },
        herkenning: {
          titel: "Je voelt je alleen op momenten waarop niemand het ziet.",
          voices: [
            "Ik wil erover praten, maar ik wil niemand tot last zijn.",
            "Ik ben onder mensen en voel me toch alleen.",
            "Iedereen lijkt zijn plek te hebben. Waarom ik niet?",
            "Ik weet niet eens goed wat ik nodig heb. Ik weet alleen dat ik het niet alleen wil dragen.",
            "Soms wil ik gewoon dat iemand vraagt hoe het écht met me gaat.",
          ],
        },
        band: {
          stack: [
            "Je hoeft niet te weten hoe je verder moet.",
            "Je hoeft je niet groot te houden.",
            "Je hoeft niet te doen alsof het wel meevalt.",
          ],
        },
        kern: {
          naast: [
            "Voor de dagen waarop je vooral wilt praten.",
            "Voor de dagen waarop je niets weet te zeggen.",
            "Voor de avonden waarop de stilte te groot wordt.",
            "Voor de gedachten die je nergens kwijt kunt.",
            "Voor alles wat je liever niet zegt tegen iemand die je kent.",
          ],
        },
        ien: {
          paras: [
            "Ik ga je niet vertellen dat je 'er meer op uit moet'. Ik weet hoe eenzaam het kan zijn, ook als er mensen om je heen zijn, als je het gevoel hebt dat je niemand echt tot last mag zijn.",
            "Ik ken dat gevoel van er alleen voor staan in veel gedaantes: een kinderwens die niet uitkwam, een bedrijf waar ik alles in had gelegd, en dieren die voor mij familie waren.",
            "Daarom heb ik Zij aan Zij gemaakt. Geen methode die je moet volgen. Geen vinkjes die je moet zetten. Gewoon iemand die naast je blijft.",
          ],
        },
        ervaringen: {
          quotes: [
            { bron: "Voorbeeld, vervangen voor livegang", tekst: "Voor het eerst hoefde ik me niet groot te houden. Iemand vroeg gewoon hoe het écht ging." },
            { bron: "Voorbeeld, vervangen voor livegang", tekst: "Ik dacht dat ik er alleen voor stond. Pas onderweg merkte ik hoeveel het scheelt als iemand blijft." },
            { bron: "Voorbeeld, vervangen voor livegang", tekst: "Geen adviezen, geen 'ga eens wat vaker weg'. Gewoon iemand die er was. Dat was precies wat ik nodig had." },
          ],
        },
        final: {
          titel: "Je hoeft je niet groter te houden dan je bent.\nJe hoeft het alleen niet meer alleen te doen.",
        },
      },
    }),
});
