/**
 * Trial verwerking: dagelijkse check voor reminders en verlopen proefperiodes.
 */
import { internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";

const DAY_MS = 1000 * 60 * 60 * 24;

export const checkAndProcessTrials = internalMutation({
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
