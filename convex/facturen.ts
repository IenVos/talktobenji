/**
 * Oplopende factuurnummers. Het nummer wordt toegekend zodra een betaling slaagt
 * (aangeroepen vanuit de Stripe-webhook), niet bij het aanmaken van een betaalsessie.
 * Zo blijft de nummering doorlopend zonder gaten van niet-afgeronde checkouts.
 * Idempotent per betaling: dezelfde paymentIntentId krijgt altijd hetzelfde nummer,
 * ook als de webhook opnieuw binnenkomt.
 *
 * Formaat: TTB-JJJJ-0100 (per jaar oplopend, gestart bij 0100).
 */
import { mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";

function secretOk(secret: string): boolean {
  return secret === (process.env.STRIPE_INTERNAL_SECRET ?? process.env.KENNISSHOP_WEBHOOK_SECRET);
}

function formatNummer(jaar: number, volgnummer: number): string {
  return `TTB-${jaar}-${String(volgnummer).padStart(4, "0")}`;
}

/** Ken het volgende oplopende factuurnummer toe (idempotent per betaling). */
async function alloceer(ctx: any, paymentIntentId: string): Promise<string> {
  const bestaand = await ctx.db
    .query("facturen")
    .withIndex("by_paymentIntent", (q: any) => q.eq("paymentIntentId", paymentIntentId))
    .unique();
  if (bestaand) return bestaand.nummer;

  const jaar = new Date().getFullYear();
  const teller = await ctx.db
    .query("factuurTeller")
    .withIndex("by_jaar", (q: any) => q.eq("jaar", jaar))
    .unique();

  let volgende: number;
  if (teller) {
    volgende = teller.laatste + 1;
    await ctx.db.patch(teller._id, { laatste: volgende });
  } else {
    // Nog geen teller dit jaar: start bij 100, zodat het eerste nummer TTB-JJJJ-0100 is.
    volgende = 100;
    await ctx.db.insert("factuurTeller", { jaar, laatste: 100 });
  }

  const nummer = formatNummer(jaar, volgende);
  await ctx.db.insert("facturen", {
    paymentIntentId,
    nummer,
    createdAt: Date.now(),
  });
  return nummer;
}

export const wijsFactuurnummerToe = mutation({
  args: { webhookSecret: v.string(), paymentIntentId: v.string() },
  handler: async (ctx, args) => {
    if (!secretOk(args.webhookSecret)) throw new Error("Geen toegang");
    return await alloceer(ctx, args.paymentIntentId);
  },
});

// ── Test/beheer (intern) ────────────────────────────────────────────────────

/** Test: ken een nummer toe voor een test-betaling en geef het terug. */
export const _testFactuurnummering = internalMutation({
  args: {},
  handler: async (ctx) => {
    const nummer = await alloceer(ctx, "pi_TEST_nummering");
    const jaar = new Date().getFullYear();
    const teller = await ctx.db
      .query("factuurTeller")
      .withIndex("by_jaar", (q) => q.eq("jaar", jaar))
      .unique();
    return { nummer, tellerLaatste: teller?.laatste ?? null };
  },
});

/** Reset na de test: verwijder de test-factuur en zet de teller terug op 99,
 *  zodat de eerste échte betaling TTB-JJJJ-0100 krijgt. */
export const _resetFactuurTellerNaTest = internalMutation({
  args: {},
  handler: async (ctx) => {
    const jaar = new Date().getFullYear();
    // Test-factuur/facturen verwijderen
    const testRijen = await ctx.db
      .query("facturen")
      .withIndex("by_paymentIntent", (q) => q.eq("paymentIntentId", "pi_TEST_nummering"))
      .collect();
    for (const r of testRijen) await ctx.db.delete(r._id);
    // Teller op 99 zetten (volgende alloc = 100)
    const teller = await ctx.db
      .query("factuurTeller")
      .withIndex("by_jaar", (q) => q.eq("jaar", jaar))
      .unique();
    if (teller) await ctx.db.patch(teller._id, { laatste: 99 });
    else await ctx.db.insert("factuurTeller", { jaar, laatste: 99 });
    return { klaar: true, jaar, tellerLaatste: 99, verwijderd: testRijen.length };
  },
});
