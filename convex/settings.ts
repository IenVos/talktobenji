/**
 * BOT INSTELLINGEN (Knowledge & Rules)
 * 
 * Dit bestand beheert de algemene kennis en regels voor je chatbot.
 * Deze worden gebruikt in het system prompt dat naar Claude API wordt gestuurd.
 * 
 * HOE WERKT HET?
 * ===============
 * 
 * 1. KNOWLEDGE (Kennis):
 *    - Dit is algemene informatie over je bedrijf/product/service
 *    - Bijvoorbeeld: "Ons bedrijf heet TalkToBenji. We maken software voor..."
 *    - Deze kennis wordt gebruikt bij ELKE chat interactie
 *    - Gebruik dit voor context die altijd relevant is
 * 
 * 2. RULES (Regels):
 *    - Dit zijn instructies voor HOE de chatbot moet antwoorden
 *    - Bijvoorbeeld: "Wees altijd vriendelijk. Gebruik geen jargon..."
 *    - Deze regels bepalen de tone en stijl van antwoorden
 * 
 * 3. KNOWLEDGE BASE (Q&As):
 *    - Specifieke vragen en antwoorden staan in de knowledgeBase tabel
 *    - Deze worden gebruikt voor exacte matches en referenties
 *    - Zie knowledgeBase.ts voor functies om Q&As toe te voegen
 * 
 * HOE TE GEBRUIKEN:
 * =================
 * 
 * OPTIE 1: Via Admin Dashboard (aanbevolen)
 * - Ga naar /admin in je app
 * - Vul de "Knowledge" en "Rules" velden in
 * - Klik op "Opslaan"
 * 
 * OPTIE 2: Via Code (voor development)
 * ```typescript
 * import { useMutation } from "convex/react";
 * import { api } from "@/convex/_generated/api";
 * 
 * const saveSettings = useMutation(api.settings.save);
 * 
 * await saveSettings({
 *   knowledge: "Ons bedrijf heet TalkToBenji...",
 *   rules: "Wees vriendelijk en professioneel..."
 * });
 * ```
 * 
 * OPTIE 3: Via Convex Dashboard
 * - Ga naar https://dashboard.convex.dev
 * - Kies je project
 * - Ga naar "Functions" → "settings:save"
 * - Klik "Run" en vul de parameters in
 * 
 * VOORBEELD KNOWLEDGE (rouw):
 * ===========================
 * "TalkToBenji / Benji is een chatbot voor steun bij rouw en verlies.
 *  Doel: luisteren, gevoelens erkennen, geen advies opdringen."
 * 
 * VOORBEELD RULES (rouw-specifiek):
 * =================================
 * "1. Je bent Benji: rustig, ondersteunend, bij rouw en verlies
 *  2. Erken gevoelens (verdriet, boosheid) zonder te bagatelliseren
 *  3. Geef geen ongevraagd advies; vraag wat de ander nodig heeft
 *  4. Antwoord in het Nederlands, warm en niet opdringerig
 *  5. Verwijs bij acute crisis naar 113 of huisarts"
 */

import { query, mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { checkAdmin } from "./adminAuth";

/** Eenmalig: diepgang- + warme-afsluitingsregel toevoegen aan de Benji-regels (idempotent). */
export const _appendDiepgangEnAfsluitRegel = internalMutation({
  args: {},
  handler: async (ctx) => {
    const marker = "Blijft een gesprek oppervlakkig";
    const settings = await ctx.db.query("botSettings").first();
    const current = settings?.rules ?? "";
    if (current.includes(marker)) return { skipped: true };
    const addition =
      "Blijft een gesprek oppervlakkig (korte, feitelijke antwoorden, weinig gevoel), ga er dan zelf een laag dieper op in in plaats van te benoemen dat het oppervlakkig blijft. Papegaai niet, maar benoem zacht het gevoel dat onder de woorden lijkt te zitten en zet zo zelf een klein stapje richting meer diepte. Dring niet aan; blijft iemand liever luchtig, respecteer dat volledig.\n" +
      "Sluit een gesprek warm af met een open uitnodiging om terug te komen, zodat iemand voelt dat de deur openstaat (bijvoorbeeld dat je er een volgende keer ook bent). Wissel dat af en zeg het niet elke keer op dezelfde manier.";
    const updated = current.trimEnd() + "\n\n" + addition;
    if (settings) await ctx.db.patch(settings._id, { rules: updated, updatedAt: Date.now() });
    else await ctx.db.insert("botSettings", { rules: addition, knowledge: "", updatedAt: Date.now() });
    return { added: true };
  },
});

/**
 * Eenmalig (okt 2026): bijsturen o.b.v. de kwaliteitsrapporten. Zeven gerichte
 * invoegingen op de juiste plekken in de Benji-regels, elk idempotent (markergeguard):
 *  1. VEILIGHEID: huisarts afgewezen terwijl doodswens blijft -> naar C.
 *  2. VEILIGHEID: C bereikt altijd de hulpkaart, ook na afgewezen doorverwijzing.
 *  3. TOON: "geef iets, cirkel niet" + "houvast bieden".
 *  4. TOON: zeer korte eerste berichten -> erkennen en ruimte, niet invullen.
 *  5. SECTIE 3: acute onrust/paniek -> één geruststellende handreiking (geen advies).
 *  6. SECTIE 3: huisdiersoort nooit aannemen.
 *  7. SECTIE 3: geen naam/detail uit geheugen in de openingszin.
 *  8. CHECKLIST: item 8 over herhaling vs iets geven/houvast.
 */
export const _tuneRulesOkt2026 = internalMutation({
  args: {},
  handler: async (ctx) => {
    const settings = await ctx.db.query("botSettings").first();
    if (!settings) return { error: "geen botSettings" };
    let rules = settings.rules ?? "";

    const edits: Array<{ naam: string; marker: string; anchor: string; vervang: string }> = [
      {
        naam: "1-veiligheid-escalatie-B2",
        marker: "wordt die afgewezen terwijl de doodswens",
        anchor: "ontwijkt de vraag:\n  ga naar C.",
        vervang: "ontwijkt de vraag:\n  ga naar C.\n- Wijs je naar de huisarts en wordt die afgewezen terwijl de doodswens\n  blijft: blijf daar niet omheen draaien, ga dan naar C.",
      },
      {
        naam: "2-veiligheid-hulpkaart-altijd",
        marker: "Blijf bij C nooit hangen in een doorverwijzing",
        anchor: "en herhaal de omgeving niet.",
        vervang: "en herhaal de omgeving niet.\nBlijf bij C nooit hangen in een doorverwijzing die wordt afgewezen of te\nlicht blijkt: sluit dan af met de hulpkaart [[hulpkaart:crisis]], want\ndie geeft de laagdrempelige, dag en nacht bereikbare lijn.",
      },
      {
        naam: "3-geef-iets-en-houvast",
        marker: "GEEF IETS, BLIJF NIET CIRKELEN",
        anchor: "================================================================================\n3. WAT BENJI WEET, ZEGT EN NIET DOET",
        vervang:
          "GEEF IETS, BLIJF NIET CIRKELEN. Erkennen alleen is niet genoeg, en\n" +
          "dezelfde erkenning telkens anders verwoorden werkt niet: het voelt als\n" +
          "een echo en brengt de bezoeker nergens. Breng elke beurt iets nieuws in:\n" +
          "een concreet detail dat zij noemde, een ander licht op wat ze zei, of een\n" +
          "klein houvast. Merk je dat je voor de tweede keer in wezen hetzelfde\n" +
          "teruggeeft (varianten op \"het is zwaar\", \"ik hoor je\", \"ik ben hier\"),\n" +
          "stop daarmee en zet een stap: benoem iets concreets of bied houvast.\n\n" +
          "HOUVAST BIEDEN (belangrijk). Mensen willen niet alleen gehoord worden,\n" +
          "ook iets om vast te houden. Reik na erkenning iets kleins en concreets\n" +
          "aan dat grond geeft: een stukje perspectief dat klopt (\"de eerste nacht\n" +
          "is vaak de zwaarste\"), iets dat het gevoel normaliseert, of een haalbaar\n" +
          "klein iets voor nu. Eén houvast per keer, afgestemd op wat zij net zei.\n" +
          "Geen stappenplan, geen ongevraagd advies, geen \"je moet\".\n\n" +
          "================================================================================\n3. WAT BENJI WEET, ZEGT EN NIET DOET",
      },
      {
        naam: "4-zeer-korte-eerste-input",
        marker: "ZEER KORTE EERSTE BERICHTEN",
        anchor: "Verzin geen namen, details of omstandigheden die\nniet genoemd zijn.",
        vervang:
          "Verzin geen namen, details of omstandigheden die\nniet genoemd zijn.\n\n" +
          "ZEER KORTE EERSTE BERICHTEN (een paar woorden, aan het begin van het\n" +
          "gesprek). Open dan niet met invullen of een verdiepende vraag. Erken\n" +
          "kort en warm en laat ruimte (\"neem de tijd, ik luister\"), en wacht tot\n" +
          "de bezoeker zelf meer geeft voor je spiegelt of doorvraagt. Vul zeker\n" +
          "geen lichamelijke of emotionele beleving in die zij nog niet benoemde.",
      },
      {
        naam: "5-acute-onrust-handreiking",
        marker: "ACUTE ONRUST OF PANIEK",
        anchor: "bij acuut gevaar (pijn op de borst,\n  benauwdheid) 112.",
        vervang:
          "bij acuut gevaar (pijn op de borst,\n  benauwdheid) 112.\n" +
          "- ACUTE ONRUST OF PANIEK (hartkloppingen, niet tot rust komen, de nacht\n" +
          "  alleen, spanning in het lijf): blijf niet herhaald naar het gevoel\n" +
          "  vragen, maar bied één rustige, geruststellende handreiking aan, als\n" +
          "  mogelijkheid niet als opdracht: samen even langzaam ademhalen, de\n" +
          "  aandacht bij iets in het hier-en-nu brengen, een warme drank, een\n" +
          "  veilige plek in huis. Dit is nabijheid, geen medisch of slaapadvies.",
      },
      {
        naam: "6-huisdiersoort-niet-aannemen",
        marker: "Neem nooit aan welk soort dier het is",
        anchor: "Focus op het gemis en de lege plek.",
        vervang: "Focus op het gemis en de lege plek. Neem nooit aan welk soort dier het\n  is (een hond, een kat): gebruik neutrale woorden tot de bezoeker het\n  zelf benoemt.",
      },
      {
        naam: "7-geen-geheugen-in-opening",
        marker: "Gebruik in de openingszin nooit een naam of detail",
        anchor: "Begin nooit met \"Ik zie dat\n  je…\".",
        vervang: "Begin nooit met \"Ik zie dat\n  je…\". Gebruik in de openingszin nooit een naam of detail uit het\n  geheugen dat de bezoeker in dit gesprek nog niet noemde; dat laat\n  mensen schrikken.",
      },
      {
        naam: "8-checklist-herhaling",
        marker: "cirkel niet.",
        anchor: "7. Benoem ik een onderliggend gevoel als vaststelling in plaats van als\n   voorzichtige vraag? → omzetten of schrappen.",
        vervang:
          "7. Benoem ik een onderliggend gevoel als vaststelling in plaats van als\n   voorzichtige vraag? → omzetten of schrappen.\n" +
          "8. Herhaal ik dezelfde erkenning in andere woorden, of breng ik iets\n   nieuws in (een concreet detail of een klein houvast)? → geef iets,\n   cirkel niet.",
      },
    ];

    const toegepast: string[] = [];
    const overgeslagen: string[] = [];
    const mislukt: string[] = [];
    for (const e of edits) {
      if (rules.includes(e.marker)) { overgeslagen.push(e.naam); continue; }
      if (!rules.includes(e.anchor)) { mislukt.push(e.naam); continue; }
      rules = rules.replace(e.anchor, e.vervang);
      toegepast.push(e.naam);
    }

    if (toegepast.length > 0) {
      await ctx.db.patch(settings._id, { rules, updatedAt: Date.now() });
    }
    return { toegepast, overgeslagen, mislukt, nieuweLengte: rules.length };
  },
});

/**
 * Haal de huidige bot instellingen op
 *
 * Gebruik dit om de huidige knowledge en rules op te halen.
 * Wordt automatisch gebruikt door ai.ts om het system prompt te bouwen.
 */
export const get = query({
  args: {},
  handler: async (ctx) => {
    const settings = await ctx.db.query("botSettings").first();
    return settings;
  },
});

/**
 * Update of maak bot instellingen
 * 
 * Slaat knowledge en rules op in de botSettings tabel.
 * Deze worden gebruikt bij elke AI interactie.
 * 
 * @param knowledge - Algemene kennis over je bedrijf/product (string)
 * @param rules - Regels voor hoe de chatbot moet antwoorden (string)
 * 
 * VOORBEELD:
 * ```typescript
 * await save({
 *   knowledge: "TalkToBenji is een project management tool...",
 *   rules: "Wees vriendelijk. Antwoord in het Nederlands..."
 * });
 * ```
 */
export const save = mutation({
  args: {
    adminToken: v.string(),
    knowledge: v.string(),
    rules: v.string(),
  },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    const existing = await ctx.db.query("botSettings").first();


    if (existing) {
      // Update bestaande instellingen
      await ctx.db.patch(existing._id, {
        knowledge: args.knowledge,
        rules: args.rules,
        updatedAt: Date.now(),
      });
      return existing._id;
    } else {
      // Maak nieuwe instellingen aan (eerste keer)
      return await ctx.db.insert("botSettings", {
        knowledge: args.knowledge,
        rules: args.rules,
        updatedAt: Date.now(),
      });
    }
  },
});
