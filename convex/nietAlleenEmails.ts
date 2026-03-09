/**
 * Niet Alleen — e-mailfuncties
 * Dagelijkse herinneringsmail + bijzondere mails (dag 28, dag 30).
 */
import { internalAction } from "./_generated/server";
import { v } from "convex/values";

const FROM = "Talk To Benji <noreply@talktobenji.com>";

async function verstuurEmail(args: {
  to: string;
  subject: string;
  html: string;
  apiKey: string;
}) {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${args.apiKey}`,
    },
    body: JSON.stringify({
      from: FROM,
      to: [args.to],
      subject: args.subject,
      html: args.html,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`E-mail verzenden mislukt: ${error}`);
  }
}

function handtekening(): string {
  return `
    <table cellpadding="0" cellspacing="0" border="0" style="margin-top: 24px;">
      <tr>
        <td style="padding-right: 14px; vertical-align: middle;">
          <img src="https://talktobenji.com/images/ien-founder.png" alt="Ien" width="52" height="52"
            style="border-radius: 50%; display: block; width: 52px; height: 52px; object-fit: cover;" />
        </td>
        <td style="vertical-align: middle;">
          <p style="font-size: 15px; font-weight: 600; color: #2d3748; margin: 0;">Ien</p>
          <p style="font-size: 13px; color: #718096; margin: 3px 0 0 0;">Founder van TalkToBenji</p>
        </td>
      </tr>
    </table>
  `;
}

function wrapper(inhoud: string): string {
  return `
    <div style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                max-width: 560px; margin: 0 auto; color: #2d3748; background: #fdf9f4; padding: 32px 24px;">
      ${inhoud}
      ${handtekening()}
    </div>
  `;
}

// ─────────────────────────────────────────
// Welkomstmail — gestuurd bij activatie
// ─────────────────────────────────────────

export const sendWelkomstMail = internalAction({
  args: {
    email: v.string(),
    naam: v.string(),
  },
  handler: async (_ctx, args) => {
    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    if (!RESEND_API_KEY) return;

    const voornaam = args.naam.split(" ")[0];

    const html = wrapper(`
      <p style="font-size: 16px; margin-bottom: 8px;">Lieve ${voornaam},</p>

      <p style="font-size: 15px; line-height: 1.8; color: #4a5568;">
        Fijn dat je er bent. De komende 30 dagen lopen we samen met je mee — één dag tegelijk.
      </p>

      <p style="font-size: 15px; line-height: 1.8; color: #4a5568;">
        Elke ochtend ontvang je een kleine vraag. Geen druk, geen goed of fout — gewoon ruimte voor wat er in je leeft.
      </p>

      <div style="margin: 28px 0;">
        <a href="https://talktobenji.com/niet-alleen"
           style="background-color: #6d84a8; color: white; padding: 13px 26px; border-radius: 10px;
                  text-decoration: none; font-size: 15px; font-weight: 600; display: inline-block;">
          Begin dag 1
        </a>
      </div>

      <p style="font-size: 14px; color: #718096;">
        Heb je vragen? Stuur een mail naar
        <a href="mailto:contactmetien@talktobenji.com" style="color: #6d84a8;">contactmetien@talktobenji.com</a>.
      </p>
    `);

    await verstuurEmail({
      to: args.email,
      subject: "Welkom bij Niet Alleen — dag 1 begint vandaag",
      html,
      apiKey: RESEND_API_KEY,
    });
  },
});

// ─────────────────────────────────────────
// Dagelijkse herinneringsmail (dag 1 t/m 30)
// ─────────────────────────────────────────

export const sendDagMail = internalAction({
  args: {
    email: v.string(),
    naam: v.string(),
    dagNummer: v.number(),
    verliesType: v.string(),
  },
  handler: async (_ctx, args) => {
    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    if (!RESEND_API_KEY) return;

    const voornaam = args.naam.split(" ")[0];

    // TODO: vervang dit door de echte prompt tekst zodra de 30 dagen content beschikbaar is.
    // Gebruik: import { getNietAlleenPrompt } from "../lib/nietAlleenPrompts";
    // const promptTekst = getNietAlleenPrompt(args.verliesType, args.dagNummer);
    const promptTekst = `[Dag ${args.dagNummer} prompt — binnenkort gevuld]`;

    const html = wrapper(`
      <p style="font-size: 16px; margin-bottom: 8px;">Lieve ${voornaam},</p>

      <p style="font-size: 13px; color: #a0aec0; margin-bottom: 4px;">Dag ${args.dagNummer} van 30</p>

      <p style="font-size: 17px; line-height: 1.8; color: #3d3530; font-weight: 500; margin: 12px 0 20px;">
        ${promptTekst}
      </p>

      <div style="margin: 24px 0;">
        <a href="https://talktobenji.com/niet-alleen"
           style="background-color: #6d84a8; color: white; padding: 13px 26px; border-radius: 10px;
                  text-decoration: none; font-size: 15px; font-weight: 600; display: inline-block;">
          Schrijf vandaag
        </a>
      </div>

      <p style="font-size: 14px; color: #718096; margin-top: 20px;">
        Geen zin vandaag? Dat is ook goed. De pagina blijft open staan.
      </p>
    `);

    await verstuurEmail({
      to: args.email,
      subject: `Dag ${args.dagNummer} — jouw moment van vandaag`,
      html,
      apiKey: RESEND_API_KEY,
    });
  },
});

// ─────────────────────────────────────────
// Dag 28 — voorbereidingsmail
// ─────────────────────────────────────────

export const sendVoorbereidingsMail = internalAction({
  args: {
    email: v.string(),
    naam: v.string(),
  },
  handler: async (_ctx, args) => {
    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    if (!RESEND_API_KEY) return;

    const voornaam = args.naam.split(" ")[0];

    const html = wrapper(`
      <p style="font-size: 16px; margin-bottom: 8px;">Lieve ${voornaam},</p>

      <p style="font-size: 15px; line-height: 1.8; color: #4a5568;">
        Over twee dagen zijn je 30 dagen klaar. Wat je hebt geschreven, is van jou — en het verdwijnt niet zomaar.
      </p>

      <p style="font-size: 15px; line-height: 1.8; color: #4a5568;">
        Op dag 30 sturen we je een overzicht van alles wat je hebt ingevuld, zodat je het kunt bewaren.
        Wil je daarna gewoon verdergaan? Dan kun je je account omzetten naar een volledig abonnement.
      </p>

      <div style="margin: 28px 0;">
        <a href="https://talktobenji.com/niet-alleen/ontdek"
           style="background-color: #6d84a8; color: white; padding: 13px 26px; border-radius: 10px;
                  text-decoration: none; font-size: 15px; font-weight: 600; display: inline-block;">
          Bekijk wat er meer is
        </a>
      </div>
    `);

    await verstuurEmail({
      to: args.email,
      subject: "Nog twee dagen — wat er daarna is",
      html,
      apiKey: RESEND_API_KEY,
    });
  },
});

// ─────────────────────────────────────────
// Dag 30 — afsluitmail
// ─────────────────────────────────────────

export const sendAfsluitMail = internalAction({
  args: {
    email: v.string(),
    naam: v.string(),
    aantalDagenIngevuld: v.number(),
  },
  handler: async (_ctx, args) => {
    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    if (!RESEND_API_KEY) return;

    const voornaam = args.naam.split(" ")[0];

    const html = wrapper(`
      <p style="font-size: 16px; margin-bottom: 8px;">Lieve ${voornaam},</p>

      <p style="font-size: 15px; line-height: 1.8; color: #4a5568;">
        Je hebt het gedaan. 30 dagen. Je hebt ${args.aantalDagenIngevuld} van de 30 dagen ingevuld —
        dat is iets om bij stil te staan.
      </p>

      <p style="font-size: 15px; line-height: 1.8; color: #4a5568;">
        Je kunt alles wat je hebt geschreven bewaren als je een volledig account neemt.
        Je hebt daar nog 7 dagen de tijd voor — daarna sluit je gratis account.
      </p>

      <div style="margin: 28px 0; display: flex; gap: 12px; flex-wrap: wrap;">
        <a href="https://talktobenji.com/niet-alleen/ontdek"
           style="background-color: #6d84a8; color: white; padding: 13px 26px; border-radius: 10px;
                  text-decoration: none; font-size: 15px; font-weight: 600; display: inline-block; margin-right: 12px;">
          Alles bewaren
        </a>
        <a href="https://talktobenji.com/niet-alleen"
           style="color: #6d84a8; padding: 13px 0; font-size: 15px; display: inline-block; text-decoration: underline;">
          Bekijk jouw 30 dagen
        </a>
      </div>

      <p style="font-size: 14px; color: #718096;">
        Vragen? Stuur een mail naar
        <a href="mailto:contactmetien@talktobenji.com" style="color: #6d84a8;">contactmetien@talktobenji.com</a>.
      </p>
    `);

    await verstuurEmail({
      to: args.email,
      subject: "Je 30 dagen zijn klaar — bewaar wat je hebt geschreven",
      html,
      apiKey: RESEND_API_KEY,
    });
  },
});
