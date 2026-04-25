/**
 * Automatisch verwijderen van inactieve accounts:
 * - Na 11 maanden inactiviteit: stuur waarschuwingsmail
 * - Na 30 dagen na waarschuwing nog steeds inactief: verwijder account
 * - Als gebruiker inlogt of chat: reset lastActiveAt, wis waarschuwing
 */
import { v } from "convex/values";
import { internalAction, internalMutation, internalQuery } from "./_generated/server";
import { internal, api } from "./_generated/api";

const ELEVEN_MONTHS_MS = 11 * 30 * 24 * 60 * 60 * 1000;
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

/** Haal alle credentials op die al 11 maanden inactief zijn en nog geen waarschuwing hebben gehad */
export const getAccountsToWarn = internalQuery({
  args: { inactiveSince: v.number() },
  handler: async (ctx, args) => {
    const all = await ctx.db.query("credentials").collect();
    return all.filter((c) => {
      const lastActive = c.lastActiveAt ?? c._creationTime;
      return lastActive < args.inactiveSince && !c.deletionWarningSentAt;
    });
  },
});

/** Haal alle credentials op die een waarschuwing hebben gehad maar nog steeds inactief zijn */
export const getAccountsToDelete = internalQuery({
  args: { warnedBefore: v.number() },
  handler: async (ctx, args) => {
    const all = await ctx.db.query("credentials").collect();
    return all.filter((c) => {
      if (!c.deletionWarningSentAt) return false;
      if (c.deletionWarningSentAt > args.warnedBefore) return false;
      // Check of ze sindsdien actief zijn geweest
      const lastActive = c.lastActiveAt ?? c._creationTime;
      return lastActive < args.warnedBefore;
    });
  },
});

/** Zet deletionWarningSentAt op credential */
export const markWarningSent = internalMutation({
  args: { credentialId: v.id("credentials") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.credentialId, { deletionWarningSentAt: Date.now() });
  },
});

/** Stuur de waarschuwingsmail en markeer credential */
export const sendDeletionWarning = internalAction({
  args: {
    email: v.string(),
    name: v.optional(v.string()),
    credentialId: v.id("credentials"),
  },
  handler: async (ctx, args) => {
    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    if (!RESEND_API_KEY) return;

    const firstName = args.name?.split(" ")[0] || "daar";

    const html = `
      <div style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; color: #2d3748;">
        <p style="font-size: 16px; margin-bottom: 8px;">Hi ${firstName},</p>

        <p style="font-size: 15px; line-height: 1.7; color: #4a5568;">
          We hebben je een tijdje niet gezien bij Talk To Benji.
        </p>

        <p style="font-size: 15px; line-height: 1.7; color: #4a5568;">
          Omdat je account al meer dan een jaar niet actief is geweest, verwijderen we het over <strong>30 dagen</strong> automatisch. Daarna zijn al je gegevens gewist en is dat niet meer terug te draaien.
        </p>

        <p style="font-size: 15px; line-height: 1.7; color: #4a5568;">
          Wil je je account houden? Log dan gewoon één keer in, dan reset de teller automatisch en blijft alles zoals het is.
        </p>

        <div style="margin: 28px 0;">
          <a href="https://talktobenji.com/inloggen"
             style="background-color: #6d84a8; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-size: 15px; font-weight: 600; display: inline-block;">
            Inloggen en account behouden
          </a>
        </div>

        <p style="font-size: 15px; line-height: 1.7; color: #4a5568;">
          Wil je je account liever zelf nu al verwijderen? Dat kan ook. Ga naar <a href="https://talktobenji.com/account" style="color: #6d84a8;">Mijn account</a> en kies 'Account verwijderen'. Dan regelen we het direct.
        </p>

        <p style="font-size: 14px; line-height: 1.6; color: #9ca3af; border-top: 1px solid #e5e7eb; margin-top: 32px; padding-top: 20px;">
          Als je niets doet, wordt je account op ${new Date(Date.now() + THIRTY_DAYS_MS).toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric" })} automatisch verwijderd.
        </p>

        <p style="font-size: 15px; margin-top: 24px; color: #4a5568;">Met warme groet,</p>
        <table cellpadding="0" cellspacing="0" border="0" style="margin-top: 12px;">
          <tr>
            <td style="padding-right: 14px; vertical-align: middle;">
              <img src="https://talktobenji.com/images/ien-founder.png" alt="Ien" width="56" height="56" style="border-radius: 50%; display: block; width: 56px; height: 56px; object-fit: cover;" />
            </td>
            <td style="vertical-align: middle;">
              <p style="font-size: 15px; font-weight: 600; color: #2d3748; margin: 0; padding: 0;">Ien</p>
              <p style="font-size: 13px; color: #718096; margin: 3px 0 0 0; padding: 0;">Founder van Talk To Benji</p>
            </td>
          </tr>
        </table>
      </div>
    `;

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Talk To Benji <noreply@talktobenji.com>",
        to: [args.email],
        subject: "Je Talk To Benji account wordt over 30 dagen verwijderd",
        html,
      }),
    });

    if (response.ok) {
      await ctx.runMutation(internal.inactiveAccounts.markWarningSent, {
        credentialId: args.credentialId,
      });
    }
  },
});

/** Dagelijkse cron: stuur waarschuwingen + verwijder verlopen accounts */
export const checkInactiveAccounts = internalAction({
  args: {},
  returns: v.object({ warned: v.number(), deleted: v.number() }),
  handler: async (ctx): Promise<{ warned: number; deleted: number }> => {
    const now = Date.now();
    const elevenMonthsAgo = now - ELEVEN_MONTHS_MS;
    const thirtyDaysAgo = now - THIRTY_DAYS_MS;

    // 1. Stuur waarschuwingsmails aan accounts die 11 maanden inactief zijn
    const toWarn: Array<{ _id: any; email: string; userId: any; name?: string }> =
      await ctx.runQuery(internal.inactiveAccounts.getAccountsToWarn, {
        inactiveSince: elevenMonthsAgo,
      });

    for (const account of toWarn) {
      const user: { name?: string } | null = await ctx.runQuery(
        internal.inactiveAccounts.getUserForDeletion,
        { userId: account.userId }
      );
      await ctx.runAction(internal.inactiveAccounts.sendDeletionWarning, {
        email: account.email,
        name: user?.name ?? undefined,
        credentialId: account._id,
      });
    }

    // 2. Verwijder accounts die 30 dagen na waarschuwing nog steeds inactief zijn
    const toDelete: Array<{ userId: any; email: string }> =
      await ctx.runQuery(internal.inactiveAccounts.getAccountsToDelete, {
        warnedBefore: thirtyDaysAgo,
      });

    for (const account of toDelete) {
      await ctx.runMutation(api.deleteAccount.deleteAccount, {
        userId: account.userId.toString(),
        email: account.email,
      });
    }

    return {
      warned: toWarn.length,
      deleted: toDelete.length,
    };
  },
});

/** Helper: haal gebruiker op voor naam in mail */
export const getUserForDeletion = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.userId);
  },
});
