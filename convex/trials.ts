/**
 * Trial verwerking: dagelijkse check voor reminders en verlopen proefperiodes.
 */
import { mutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";

const DAY_MS = 1000 * 60 * 60 * 24;

export const checkAndProcessTrials = mutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();

    const trialSubscriptions = await ctx.db
      .query("userSubscriptions")
      .filter((q) => q.eq(q.field("subscriptionType"), "trial"))
      .collect();

    for (const sub of trialSubscriptions) {
      if (!sub.expiresAt) continue;

      const daysLeft = Math.ceil((sub.expiresAt - now) / DAY_MS);

      // Proefperiode verlopen → reset naar free
      if (sub.expiresAt < now) {
        // Reset voorkeuren (accentkleur + achtergrond), bewaar userContext
        const prefs = await ctx.db
          .query("userPreferences")
          .withIndex("by_user", (q) => q.eq("userId", sub.userId))
          .unique();

        if (prefs) {
          const { backgroundImageStorageId: _bg, accentColor: _ac, ...rest } = prefs;
          await ctx.db.replace(prefs._id, {
            ...rest,
            updatedAt: now,
          });
        }

        // Zet subscription terug naar free (bewaar expiresAt voor popup)
        await ctx.db.patch(sub._id, {
          subscriptionType: "free",
          status: "active",
          updatedAt: now,
        });
        continue;
      }

      // Dag 5 reminder: nog ~2 dagen over
      if (daysLeft <= 2 && daysLeft > 1 && !sub.reminderDay5Sent) {
        const user = await ctx.db
          .query("users")
          .withIndex("email", (q) => q.eq("email", sub.email))
          .unique();

        await ctx.scheduler.runAfter(0, internal.emails.sendTrialDayFiveReminder, {
          email: sub.email,
          name: user?.name || "daar",
          expiresAt: sub.expiresAt,
        });
        await ctx.db.patch(sub._id, { reminderDay5Sent: true, updatedAt: now });
      }

      // Dag 7 reminder: laatste dag
      if (daysLeft <= 1 && daysLeft > 0 && !sub.reminderDay7Sent) {
        const user = await ctx.db
          .query("users")
          .withIndex("email", (q) => q.eq("email", sub.email))
          .unique();

        await ctx.scheduler.runAfter(0, internal.emails.sendTrialDaySevenReminder, {
          email: sub.email,
          name: user?.name || "daar",
          expiresAt: sub.expiresAt,
        });
        await ctx.db.patch(sub._id, { reminderDay7Sent: true, updatedAt: now });
      }
    }
  },
});

/**
 * Zet trial naar een teststate (alleen voor admin/testing).
 * state: "fresh" | "day5" | "day7" | "expired"
 */
export const setTrialStateForTesting = mutation({
  args: {
    email: v.string(),
    state: v.union(
      v.literal("fresh"),
      v.literal("day5"),
      v.literal("day7"),
      v.literal("expired")
    ),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const sub = await ctx.db
      .query("userSubscriptions")
      .withIndex("by_email", (q) => q.eq("email", args.email.toLowerCase().trim()))
      .first();

    if (!sub) throw new Error("Geen subscription gevonden voor dit e-mailadres");

    const expiresAtMap = {
      fresh:   now + 7 * DAY_MS,
      day5:    now + 2 * DAY_MS,
      day7:    now + DAY_MS * 0.5, // 12 uur over → ceil = 1 dag
      expired: now - 1000,
    };

    await ctx.db.patch(sub._id, {
      subscriptionType: "trial",
      status: "active",
      expiresAt: expiresAtMap[args.state],
      reminderDay5Sent: false,
      reminderDay7Sent: false,
      updatedAt: now,
    });

    return { success: true, expiresAt: expiresAtMap[args.state] };
  },
});
