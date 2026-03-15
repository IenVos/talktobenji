/**
 * Houvast — gratis mini-gids toegankelijk via magic link token.
 */
import { v } from "convex/values";
import { action, internalAction, internalMutation, internalQuery, query } from "./_generated/server";
import { internal } from "./_generated/api";

const FROM = "Talk To Benji <noreply@talktobenji.com>";

async function verstuurEmail(args: { to: string; subject: string; html: string; apiKey: string }) {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${args.apiKey}` },
    body: JSON.stringify({ from: FROM, to: [args.to], subject: args.subject, html: args.html }),
  });
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`E-mail verzenden mislukt: ${error}`);
  }
}

function handtekeningIen(): string {
  return `
    <table cellpadding="0" cellspacing="0" border="0" style="margin-top: 28px;">
      <tr>
        <td style="padding-right: 14px; vertical-align: middle;">
          <img src="https://talktobenji.com/images/ien-founder.png" alt="Ien" width="52" height="52"
            style="border-radius: 50%; display: block; width: 52px; height: 52px; object-fit: cover;" />
        </td>
        <td style="vertical-align: middle;">
          <p style="font-size: 15px; font-weight: 600; color: #2d3748; margin: 0;">Ien</p>
          <p style="font-size: 13px; color: #718096; margin: 3px 0 0 0;">Founder van Talk To Benji</p>
        </td>
      </tr>
    </table>`;
}

function wrapperIen(inhoud: string): string {
  return `
    <div style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                max-width: 560px; margin: 0 auto; color: #2d3748; background: #fdf9f4; padding: 32px 24px;">
      ${inhoud}
      ${handtekeningIen()}
    </div>`;
}

// ─── Internal queries & mutations ───────────────────────────────────────────

export const getByEmailInternal = internalQuery({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("houvasteProfielen")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();
  },
});

export const createProfiel = internalMutation({
  args: { email: v.string(), token: v.string() },
  handler: async (ctx, args) => {
    await ctx.db.insert("houvasteProfielen", {
      email: args.email,
      token: args.token,
      createdAt: Date.now(),
    });
  },
});

export const sendWelkomstMailInternal = internalAction({
  args: { email: v.string(), token: v.string() },
  handler: async (_ctx, args) => {
    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    if (!RESEND_API_KEY) return;

    const link = `https://talktobenji.com/houvast/gids?token=${args.token}`;

    const html = wrapperIen(`
      <p style="font-size: 16px; margin-bottom: 20px;">Hoi,</p>
      <p style="font-size: 15px; line-height: 1.8; color: #4a5568;">
        Houvast staat klaar voor je.
      </p>
      <p style="font-size: 15px; line-height: 1.8; color: #4a5568;">
        Het is een kleine gids, voor de momenten dat het extra zwaar voelt. Geen grote stappen, geen verplichtingen. Alleen iets wat je nu meteen kunt doen.
      </p>
      <p style="font-size: 15px; line-height: 1.8; color: #4a5568;">
        Klik op de knop hieronder om Houvast te openen. De link werkt altijd, je hoeft nergens in te loggen.
      </p>
      <div style="margin: 28px 0;">
        <a href="${link}" style="background-color: #6d84a8; color: white; padding: 13px 26px;
           border-radius: 10px; text-decoration: none; font-size: 15px; font-weight: 600; display: inline-block;">
          Open Houvast
        </a>
      </div>
      <p style="font-size: 14px; color: #718096;">
        Heb je vragen? Je kunt me altijd bereiken via
        <a href="mailto:contactmetien@talktobenji.com" style="color: #6d84a8;">contactmetien@talktobenji.com</a>.
      </p>
    `);

    await verstuurEmail({
      to: args.email,
      subject: "Houvast staat klaar voor je",
      html,
      apiKey: RESEND_API_KEY,
    });
  },
});

// ─── Public actions & queries ────────────────────────────────────────────────

/** Registreer een nieuw Houvast profiel en stuur de welkomstmail. */
export const registreer = action({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const email = args.email.trim().toLowerCase();
    const existing = await ctx.runQuery(internal.houvast.getByEmailInternal, { email });
    let token: string;
    if (existing) {
      token = existing.token;
    } else {
      token = crypto.randomUUID();
      await ctx.runMutation(internal.houvast.createProfiel, { email, token });
    }
    await ctx.runAction(internal.houvast.sendWelkomstMailInternal, { email, token });
    return { success: true };
  },
});

/** Haal profiel op via token — valideert toegang voor de gids. */
export const getByToken = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    if (!args.token) return null;
    return await ctx.db
      .query("houvasteProfielen")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();
  },
});
