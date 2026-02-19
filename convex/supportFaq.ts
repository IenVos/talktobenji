/**
 * Support FAQ: account-gerelateerde vragen en antwoorden.
 * Beheerbaar via admin panel.
 */
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/** Alle actieve FAQ-items (publiek, voor de support pagina) */
export const listActive = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("supportFaq")
      .withIndex("by_active_order", (q) => q.eq("isActive", true))
      .collect();
  },
});

/** Alle FAQ-items (admin) */
export const listAll = query({
  args: { adminToken: v.optional(v.string()) },
  handler: async (ctx) => {
    return await ctx.db.query("supportFaq").collect();
  },
});

/** Opslaan of bijwerken */
export const upsertFaq = mutation({
  args: {
    adminToken: v.optional(v.string()),
    id: v.optional(v.id("supportFaq")),
    question: v.string(),
    answer: v.string(),
    category: v.string(),
    order: v.number(),
    isActive: v.boolean(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    if (args.id) {
      await ctx.db.patch(args.id, {
        question: args.question,
        answer: args.answer,
        category: args.category,
        order: args.order,
        isActive: args.isActive,
        updatedAt: now,
      });
      return args.id;
    }
    return await ctx.db.insert("supportFaq", {
      question: args.question,
      answer: args.answer,
      category: args.category,
      order: args.order,
      isActive: args.isActive,
      createdAt: now,
      updatedAt: now,
    });
  },
});

/** Verwijderen */
export const deleteFaq = mutation({
  args: {
    adminToken: v.optional(v.string()),
    id: v.id("supportFaq"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

const FAQ_ITEMS = [
  // ACCOUNT
  { category: "account", order: 1, question: "Hoe maak ik een account aan?", answer: "Ga naar [talktobenji.com](/) en klik op 'Account aanmaken'. Vul je naam, e-mailadres en een wachtwoord in. Je krijgt automatisch 7 dagen gratis toegang tot alle functies — zonder betaalgegevens." },
  { category: "account", order: 2, question: "Ik ben mijn wachtwoord vergeten", answer: "Ga naar [de inlogpagina](/inloggen) en klik op 'Wachtwoord vergeten'. Vul je e-mailadres in en je ontvangt binnen een paar minuten een e-mail met een link om een nieuw wachtwoord in te stellen. Check ook je spammap." },
  { category: "account", order: 3, question: "Hoe wijzig ik mijn wachtwoord?", answer: "Ga naar je account → [Personalisatie](/account/instellingen) → [Wachtwoord](/account/wachtwoord). Vul je huidige wachtwoord in en daarna tweemaal je nieuwe wachtwoord." },
  { category: "account", order: 4, question: "Hoe wijzig ik mijn e-mailadres?", answer: "Stuur een bericht via het formulier hieronder met je huidige en gewenste e-mailadres. We passen dit voor je aan." },
  { category: "account", order: 5, question: "Hoe verwijder ik mijn account?", answer: "Ga naar [Personalisatie](/account/instellingen) in het menu, scroll naar beneden naar 'Account verwijderen'. Na bevestiging worden al je gegevens definitief gewist. Dit kan niet ongedaan worden gemaakt." },
  { category: "account", order: 6, question: "Ik kan niet inloggen, wat kan ik doen?", answer: "Controleer of je het juiste e-mailadres gebruikt. Werkt je wachtwoord niet? Klik op ['Wachtwoord vergeten'](/inloggen) op de inlogpagina. Lukt het daarna nog steeds niet? Stuur ons een bericht via het formulier hieronder." },
  // ABONNEMENT
  { category: "abonnement", order: 10, question: "Wat is het verschil tussen de abonnementen?", answer: "Gratis: 10 gesprekken per maand.\n\nBenji Uitgebreid (€6,99/maand): onbeperkte gesprekken, dagelijkse check-ins, persoonlijke doelen en reflecties.\n\nBenji Alles-in-1 (€11,99/maand): alles van Uitgebreid, plus memories, inspiratie & troost en handreikingen." },
  { category: "abonnement", order: 11, question: "Wat is de gratis proefperiode?", answer: "Nieuwe gebruikers krijgen automatisch 7 dagen volledige toegang tot alle functies. Je hoeft geen betaalgegevens in te voeren. Na 7 dagen ga je automatisch terug naar het gratis abonnement — je gegevens blijven altijd bewaard." },
  { category: "abonnement", order: 12, question: "Wat verlies ik als mijn proefperiode afloopt?", answer: "Je verliest toegang tot de premium functies (memories, inspiratie & troost, handreikingen en personalisatie). Al je gesprekken, reflecties, doelen en check-ins blijven altijd bewaard." },
  { category: "abonnement", order: 13, question: "Hoe upgrade ik naar een betaald abonnement?", answer: "Ga naar [Personalisatie](/account/instellingen) → [Abonnement](/account/abonnement) in je account. Kies het abonnement dat bij je past en volg de betaalinstructies." },
  { category: "abonnement", order: 14, question: "Hoe zeg ik mijn abonnement op?", answer: "Stuur ons een bericht via het formulier hieronder of een e-mail naar contactmetien@talktobenji.com met als onderwerp 'Abonnement opzeggen'. We regelen het voor je. Je gegevens blijven bewaard." },
  { category: "abonnement", order: 15, question: "Wat gebeurt er met mijn gegevens als ik opzeg?", answer: "Al je gesprekken, reflecties, doelen en herinneringen blijven gewoon bewaard. Je gaat terug naar het gratis abonnement (10 gesprekken per maand). Je kunt altijd opnieuw [upgraden](/account/abonnement)." },
  // GEBRUIK
  { category: "gebruik", order: 20, question: "Waar vind ik mijn eerdere gesprekken?", answer: "Ga naar je account en klik op ['Jouw gesprekken'](/account/gesprekken). Hier staan al je gesprekken met Benji op datum, van nieuw naar oud." },
  { category: "gebruik", order: 21, question: "Waarom zie ik bepaalde functies niet?", answer: "Sommige functies zijn alleen beschikbaar bij een betaald abonnement. Bij een vergrendeld slot-icoon heb je een ander abonnement nodig. Ga naar [Personalisatie](/account/instellingen) → [Abonnement](/account/abonnement) om je opties te bekijken." },
  { category: "gebruik", order: 22, question: "Wat zijn memories (herinneringen)?", answer: "Memories is een plek om mooie of bijzondere momenten vast te leggen — een foto, een herinnering, een moment dat je wilt bewaren. Beschikbaar in het [Benji Alles-in-1](/account/abonnement) abonnement." },
  { category: "gebruik", order: 23, question: "Hoe personaliseer ik mijn account?", answer: "Ga naar [Personalisatie](/account/instellingen) in het menu. Daar kun je een accentkleur kiezen, een achtergrondafbeelding instellen en 'Jouw verhaal' invullen zodat Benji je beter leert kennen." },
  { category: "gebruik", order: 24, question: "Wat is 'Jouw verhaal'?", answer: "In [Personalisatie](/account/instellingen) kun je achtergrond over jezelf invullen — wie je bent, wat je meemaakt. Benji gebruikt dit om de gesprekken beter op jou af te stemmen. Je kunt het altijd aanpassen of wissen." },
  { category: "gebruik", order: 25, question: "Wat zijn dagelijkse check-ins?", answer: "Een korte dagelijkse vragenreeks om je gedachten en gevoelens te ordenen. Je vindt ze terug onder ['Dagelijkse check-ins'](/account/checkins) in je account. Beschikbaar vanaf het Uitgebreid abonnement." },
  { category: "gebruik", order: 26, question: "Mijn gegevens zijn weg na inloggen", answer: "Controleer of je bent ingelogd met hetzelfde e-mailadres als waarmee je je hebt aangemeld — je gegevens zijn gekoppeld aan je account, niet aan je apparaat. Stuur ons een bericht als je gegevens er echt niet meer zijn." },
  // TECHNISCH
  { category: "technisch", order: 30, question: "De pagina laadt niet goed", answer: "Probeer de pagina te vernieuwen (F5 of Ctrl+R). Werkt dat niet? Probeer een andere browser of leeg je browsercache (Ctrl+Shift+Delete). Blijft het probleem? Stuur ons een screenshot via het formulier hieronder." },
  { category: "technisch", order: 31, question: "Benji reageert niet of laadt niet", answer: "Controleer je internetverbinding. Vernieuw de pagina en probeer het opnieuw. Werkt het nog steeds niet? Vermeld in je bericht je browser en apparaat, dan zoeken we het uit." },
  // PRIVACY
  { category: "privacy", order: 40, question: "Welke gegevens slaan jullie op?", answer: "We slaan alleen op wat jij invult: je naam, e-mailadres, gesprekken met Benji, reflecties, doelen en herinneringen. We verkopen nooit gegevens aan derden en gebruiken ze niet voor advertenties." },
  { category: "privacy", order: 41, question: "Hoe worden mijn gesprekken gebruikt?", answer: "Je gesprekken worden gebruikt om Benji te laten reageren en zijn alleen voor jou zichtbaar. We gebruiken ze niet voor marketing, analyses of advertenties." },
  { category: "privacy", order: 42, question: "Kan ik al mijn gegevens opvragen?", answer: "Ja. Stuur een bericht via het formulier hieronder met als onderwerp 'Gegevensverzoek'. We sturen je binnen 30 dagen een overzicht van alle opgeslagen gegevens — dit is je recht onder de AVG." },
];

/** Eenmalig seeden met standaard vragen (alleen als tabel leeg is) */
export const seedFaq = mutation({
  args: { adminToken: v.optional(v.string()) },
  handler: async (ctx) => {
    const existing = await ctx.db.query("supportFaq").first();
    if (existing) return { seeded: false, message: "Al gevuld" };

    const now = Date.now();
    for (const item of FAQ_ITEMS) {
      await ctx.db.insert("supportFaq", { ...item, isActive: true, createdAt: now, updatedAt: now });
    }
    return { seeded: true, count: FAQ_ITEMS.length };
  },
});

/** Bestaande antwoorden bijwerken met links (matcht op question) */
export const updateAnswers = mutation({
  args: { adminToken: v.optional(v.string()) },
  handler: async (ctx) => {
    const now = Date.now();
    let updated = 0;
    for (const item of FAQ_ITEMS) {
      const existing = await ctx.db
        .query("supportFaq")
        .filter((q) => q.eq(q.field("question"), item.question))
        .first();
      if (existing) {
        await ctx.db.patch(existing._id, { answer: item.answer, updatedAt: now });
        updated++;
      }
    }
    return { updated };
  },
});
