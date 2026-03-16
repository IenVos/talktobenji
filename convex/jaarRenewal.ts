/**
 * Dagelijkse check voor jaar-toegang verlenging emails.
 * Stuurt 2 emails in de laatste maand:
 *   - Email 1: ~30 dagen voor afloop (dag 335)
 *   - Email 2: ~15 dagen voor afloop (dag 350)
 */
import { internalAction, internalQuery, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";

export const getJaarSubscriptions = internalQuery({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("userSubscriptions")
      .filter((q) => q.eq(q.field("billingPeriod"), "yearly"))
      .collect();
  },
});

export const getUserByEmail = internalQuery({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const cred = await ctx.db
      .query("credentials")
      .withIndex("email", (q) => q.eq("email", args.email.toLowerCase()))
      .first();
    if (!cred) return null;
    return await ctx.db.get(cred.userId as any);
  },
});

export const markRenewalEmailSent = internalMutation({
  args: { subscriptionId: v.id("userSubscriptions"), emailNumber: v.number() },
  handler: async (ctx, args) => {
    const field =
      args.emailNumber === 1 ? "renewalEmail1SentAt" :
      args.emailNumber === 2 ? "renewalEmail2SentAt" :
      "renewalEmail3SentAt";
    await ctx.db.patch(args.subscriptionId, { [field]: Date.now() });
  },
});

export const checkJaarRenewal = internalAction({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();

    // Venster: stuur email als expiresAt binnen dit bereik valt
    const window30From = now + 29 * 24 * 60 * 60 * 1000;
    const window30To   = now + 31 * 24 * 60 * 60 * 1000;
    const window15From = now + 14 * 24 * 60 * 60 * 1000;
    const window15To   = now + 16 * 24 * 60 * 60 * 1000;
    const window0From  = now;
    const window0To    = now + 1  * 24 * 60 * 60 * 1000;

    const subscriptions: any[] = await ctx.runQuery(
      internal.jaarRenewal.getJaarSubscriptions,
      {}
    );

    for (const sub of subscriptions) {
      if (!sub.expiresAt || !sub.email) continue;

      const user: any = await ctx.runQuery(
        internal.jaarRenewal.getUserByEmail,
        { email: sub.email }
      );
      const name = user?.name || sub.email.split("@")[0];

      // Email 1 — 30 dagen voor afloop
      if (
        sub.expiresAt >= window30From &&
        sub.expiresAt <= window30To &&
        !sub.renewalEmail1SentAt
      ) {
        await ctx.runAction(internal.emails.sendJaarRenewalEmail1, {
          email: sub.email,
          name,
          expiresAt: sub.expiresAt,
        });
        await ctx.runMutation(internal.jaarRenewal.markRenewalEmailSent, {
          subscriptionId: sub._id,
          emailNumber: 1,
        });
      }

      // Email 2 — 15 dagen voor afloop
      if (
        sub.expiresAt >= window15From &&
        sub.expiresAt <= window15To &&
        !sub.renewalEmail2SentAt
      ) {
        await ctx.runAction(internal.emails.sendJaarRenewalEmail2, {
          email: sub.email,
          name,
          expiresAt: sub.expiresAt,
        });
        await ctx.runMutation(internal.jaarRenewal.markRenewalEmailSent, {
          subscriptionId: sub._id,
          emailNumber: 2,
        });
      }

      // Email 3 — laatste dag
      if (
        sub.expiresAt >= window0From &&
        sub.expiresAt <= window0To &&
        !sub.renewalEmail3SentAt
      ) {
        await ctx.runAction(internal.emails.sendJaarRenewalEmail3, {
          email: sub.email,
          name,
          expiresAt: sub.expiresAt,
        });
        await ctx.runMutation(internal.jaarRenewal.markRenewalEmailSent, {
          subscriptionId: sub._id,
          emailNumber: 3,
        });
      }
    }
  },
});
