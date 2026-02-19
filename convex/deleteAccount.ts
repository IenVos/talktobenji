/**
 * Account verwijderen: wist alle persoonlijke data en verwijdert het account.
 */
import { v } from "convex/values";
import { mutation } from "./_generated/server";

export const deleteAccount = mutation({
  args: {
    userId: v.string(),
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = args.userId;
    const email = args.email.toLowerCase().trim();

    // 1. Chat berichten + sessies
    const chatSessions = await ctx.db
      .query("chatSessions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    for (const session of chatSessions) {
      const messages = await ctx.db
        .query("chatMessages")
        .withIndex("by_session", (q) => q.eq("sessionId", session._id))
        .collect();
      for (const msg of messages) await ctx.db.delete(msg._id);
      await ctx.db.delete(session._id);
    }

    // 2. Voorkeuren (+ opgeslagen achtergrondafbeelding)
    const prefs = await ctx.db
      .query("userPreferences")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();
    if (prefs) {
      if (prefs.backgroundImageStorageId) {
        await ctx.storage.delete(prefs.backgroundImageStorageId);
      }
      await ctx.db.delete(prefs._id);
    }

    // 3. Herinneringen (+ opgeslagen afbeeldingen)
    const memories = await ctx.db
      .query("memories")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    for (const memory of memories) {
      if (memory.imageStorageId) {
        await ctx.storage.delete(memory.imageStorageId);
      }
      await ctx.db.delete(memory._id);
    }

    // 4. Notities, doelen, emoties, check-ins
    const [notes, goals, emotions, checkInAnswers, checkInEntries] =
      await Promise.all([
        ctx.db.query("notes").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
        ctx.db.query("goals").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
        ctx.db.query("emotionEntries").withIndex("by_user_date", (q) => q.eq("userId", userId)).collect(),
        ctx.db.query("checkInAnswers").withIndex("by_user_date", (q) => q.eq("userId", userId)).collect(),
        ctx.db.query("checkInEntries").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
      ]);
    for (const r of [...notes, ...goals, ...emotions, ...checkInAnswers, ...checkInEntries]) {
      await ctx.db.delete(r._id);
    }

    // 5. Abonnement, gespreksteller, push subscriptions
    const [subs, usage, pushSubs] = await Promise.all([
      ctx.db.query("userSubscriptions").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
      ctx.db.query("conversationUsage").filter((q) => q.eq(q.field("userId"), userId)).collect(),
      ctx.db.query("pushSubscriptions").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
    ]);
    for (const r of [...subs, ...usage, ...pushSubs]) await ctx.db.delete(r._id);

    // 6. Wachtwoord reset tokens + credentials
    const userRecord = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", email))
      .unique();

    if (userRecord) {
      const [resetTokens, creds] = await Promise.all([
        ctx.db.query("passwordResetTokens")
          .filter((q) => q.eq(q.field("userId"), userRecord._id))
          .collect(),
        ctx.db.query("credentials")
          .withIndex("email", (q) => q.eq("email", email))
          .collect(),
      ]);
      for (const r of [...resetTokens, ...creds]) await ctx.db.delete(r._id);

      // 7. Auth sessies (NextAuth sessions tabel)
      const authSessions = await ctx.db
        .query("sessions")
        .withIndex("userId", (q) => q.eq("userId", userRecord._id))
        .collect();
      for (const s of authSessions) await ctx.db.delete(s._id);

      // 8. Gebruiker zelf
      await ctx.db.delete(userRecord._id);
    }

    return { success: true };
  },
});
