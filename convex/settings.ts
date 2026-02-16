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

import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { checkAdmin } from "./adminAuth";

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
