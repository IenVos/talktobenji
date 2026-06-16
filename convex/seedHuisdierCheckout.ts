/**
 * Eenmalige seed voor de rustige huisdier-checkout (/betalen/niet-alleen-huisdier).
 * Idempotent: bestaat de slug al, dan gebeurt er niets. Verder bewerkbaar via admin.
 * Run: npx convex run --prod seedHuisdierCheckout:seed
 */
import { internalMutation } from "./_generated/server";

export const seed = internalMutation({
  args: {},
  handler: async (ctx) => {
    const bestaand = await ctx.db
      .query("checkoutProducts")
      .withIndex("by_slug", (q) => q.eq("slug", "niet-alleen-huisdier"))
      .first();
    if (bestaand) return { status: "bestaat al", id: bestaand._id };

    const now = Date.now();
    const id = await ctx.db.insert("checkoutProducts", {
      slug: "niet-alleen-huisdier",
      name: "Niet Alleen",
      kortNaam: "N.A. huisdier",
      verliesType: "huisdier",
      priceInCents: 3700,
      subscriptionType: "niet_alleen",
      isLive: true,
      giftEnabled: false,
      b2bEnabled: false,
      checkoutLayout: "rustig",
      reviews: [],
      rustigeContent: {
        hero: {
          titel: "Niet Alleen",
          subtitel: "30 dagen zachte begeleiding na het verlies van je huisdier, voor als je hoofd vol zit en je even niet weet hoe verder.",
          intro: "💙 Een klein dagelijks ankerpunt voor mensen die hun maatje missen.",
          bullets: ["Slechts 3 tot 5 minuten per dag", "Geen zware opdrachten", "Op jouw tempo", "Direct toegang"],
          prijsLabel: "€37 eenmalig",
          buttonText: "Ja, ik wil beginnen",
        },
        watJeKrijgt: {
          titel: "Geen grote opdrachten",
          tekst: "Gewoon kleine dagelijkse momenten die helpen om stil te staan bij wat je voelt.",
          bullets: ["30 dagen begeleiding", "Reflectievragen", "Kleine oefeningen", "Meer rust en overzicht"],
          prompts: [
            { dag: "Dag 3", vraag: "Wat heb je vandaag nodig?" },
            { dag: "Dag 7", vraag: "Welke herinnering aan je huisdier blijft steeds terugkomen?" },
            { dag: "Dag 14", vraag: "Wat zou je tegen jezelf zeggen als je je beste vriend was?" },
          ],
        },
        herkenning: {
          quote: "Soms ben je niet verdrietig.\nSoms ben je gewoon moe van alles dragen.",
          intro: "Misschien herken je dit:",
          bullets: [
            "Je hoofd blijft maar doorgaan",
            "Je weet niet goed wat je voelt",
            "Je probeert sterk te blijven",
            "Je bent moe van alles alleen dragen",
          ],
          slot: "Dan is Niet Alleen voor jou gemaakt.",
        },
        reviewsTitel: "Hoe anderen dit hebben ervaren",
        benjiVerhaal: {
          titel: "Waarom ik dit maakte",
          tekst: "Ik heb Niet Alleen gemaakt omdat ik zag hoe vaak mensen alleen gelaten worden met verdriet. Juist bij het verlies van een huisdier wordt het soms niet begrepen, terwijl het verdriet heel groot is.",
        },
        veiligheid: {
          bullets: ["Direct toegang na betaling", "Eenmalig, geen abonnement", "Op jouw tempo", "Geen druk of verwachtingen"],
          buttonText: "Ja, ik gun mezelf dit moment",
        },
        faq: [
          { vraag: "Moet ik veel schrijven?", antwoord: "Nee. Een paar woorden is genoeg. Je hoeft niets, je mag alles." },
          { vraag: "Hoeveel tijd kost dit?", antwoord: "Een paar minuten per dag, meer niet." },
          { vraag: "Is dit therapie?", antwoord: "Nee. Het is zachte begeleiding, geen vervanging voor professionele hulp." },
          { vraag: "Krijg ik direct toegang?", antwoord: "Ja, meteen na je betaling kun je beginnen." },
          { vraag: "Wat als ik een dag oversla?", antwoord: "Helemaal niet erg. Je pakt het op wanneer het jou uitkomt, op jouw tempo." },
        ],
      },
      createdAt: now,
      updatedAt: now,
    });
    return { status: "aangemaakt", id };
  },
});
