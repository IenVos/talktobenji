/**
 * Houvast — gratis mini-gids toegankelijk via magic link token.
 */
import { v } from "convex/values";
import { action, internalAction, internalMutation, internalQuery, query } from "./_generated/server";
import { api, internal } from "./_generated/api";

const FROM = "Talk To Benji <noreply@talktobenji.com>";

// Fallback-instructie voor de persoonlijke brief (Benji-toon). Beheerbaar via
// admin → Pagina's → Even Houvast (veld "Brief-instructie").
const BRIEF_INSTRUCTIE_DEFAULT = `Je bent Benji — een warme, rustige metgezel bij verdriet en verlies. Iemand heeft net de gratis mini-gids "Even Houvast" doorlopen en bij een paar momenten iets opgeschreven. Schrijf op basis van hun antwoorden een korte, persoonlijke brief terug — een "brief aan zichzelf", alsof er iemand echt geluisterd heeft.

Toon en stijl:
- Nederlands, warm, zacht, dichtbij. Geen therapeuten-taal, geen clichés, geen oplossingen of advies.
- Begin niet met hun woorden letterlijk te herhalen. Weef hun antwoorden tot één geheel.
- Een korte opening, hun woorden verweven in een lopende tekst, en een slotzin die dit moment afsluit.
- Kort: 150 tot 220 woorden. Geen kopjes, geen opsommingen, geen aanhef als "Beste". Schrijf in de tweede persoon ("je").
- Gebruik GEEN streepjes of gedachtestreepjes (— of –) in de tekst. Schrijf gewone zinnen met komma's en punten.
- Verzin geen feiten, namen of relaties die ze niet zelf hebben benoemd.
- Eindig met iets wat rust en nabijheid geeft, zonder te beloven dat het overgaat.

Geef alleen de brieftekst terug, niets anders.`;

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
  args: { email: v.string(), token: v.string(), name: v.optional(v.string()) },
  handler: async (ctx, args) => {
    await ctx.db.insert("houvasteProfielen", {
      email: args.email,
      token: args.token,
      name: args.name,
      createdAt: Date.now(),
    });
  },
});

export const briefAlVerzonden = internalQuery({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const bestaand = await ctx.db
      .query("houvastBrieven")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();
    return !!bestaand;
  },
});

export const markBriefVerzonden = internalMutation({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const bestaand = await ctx.db
      .query("houvastBrieven")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();
    if (!bestaand) await ctx.db.insert("houvastBrieven", { email: args.email, sentAt: Date.now() });
  },
});

export const updateNaamInternal = internalMutation({
  args: { email: v.string(), name: v.string() },
  handler: async (ctx, args) => {
    const profiel = await ctx.db
      .query("houvasteProfielen")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();
    if (profiel) await ctx.db.patch(profiel._id, { name: args.name });
  },
});

export const sendWelkomstMailInternal = internalAction({
  args: { email: v.string(), token: v.string(), name: v.optional(v.string()) },
  handler: async (_ctx, args) => {
    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    if (!RESEND_API_KEY) return;

    const link = `https://talktobenji.com/even-houvast?token=${args.token}`;
    const aanhef = args.name ? `Hi ${args.name},` : "Hi,";

    const html = wrapperIen(`
      <p style="font-size: 16px; margin-bottom: 20px;">${aanhef}</p>
      <p style="font-size: 15px; line-height: 1.8; color: #4a5568;">
        Houvast is er voor je.
      </p>
      <p style="font-size: 15px; line-height: 1.8; color: #4a5568;">
        Een klein steuntje voor de momenten dat het even zwaar is. Geen grote stappen, geen druk. Alleen iets kleins dat je nu meteen kunt doen.
      </p>
      <p style="font-size: 15px; line-height: 1.8; color: #4a5568;">
        Je staat er niet alleen voor. Een klein steuntje is altijd binnen handbereik.
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
  args: { email: v.string(), name: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const email = args.email.trim().toLowerCase();
    const name = args.name?.trim() || undefined;
    const existing = await ctx.runQuery(internal.houvast.getByEmailInternal, { email });
    let token: string;
    if (existing) {
      token = existing.token;
      // Update naam als die er nog niet was
      if (name && !existing.name) {
        await ctx.runMutation(internal.houvast.updateNaamInternal, { email, name });
      }
    } else {
      token = crypto.randomUUID();
      await ctx.runMutation(internal.houvast.createProfiel, { email, token, name });
    }
    await ctx.runAction(internal.houvast.sendWelkomstMailInternal, { email, token, name: name ?? existing?.name });
    return { success: true };
  },
});

// Zet een base64 data-URL om naar een Blob (voor opslag in Convex storage).
function dataUrlToBlob(dataUrl: string): Blob | null {
  const m = dataUrl.match(/^data:(.+?);base64,(.*)$/);
  if (!m) return null;
  try {
    const binary = atob(m[2]);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return new Blob([bytes], { type: m[1] });
  } catch {
    return null;
  }
}

// Brief-mail: zelfde sans-serif look als de overige mails, ondertekend door Benji.
const BRIEF_FONT = "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";

function wrapperBrief(inhoud: string): string {
  return `
    <div style="font-family: ${BRIEF_FONT}; max-width: 560px; margin: 0 auto;
                color: #2d3748; background: #fdf9f4; padding: 36px 28px;">
      <p style="font-size:12px;letter-spacing:0.14em;text-transform:uppercase;color:#9a9088;margin:0 0 20px 0;">Even Houvast</p>
      ${inhoud}
      <p style="font-size:15px;margin-top:28px;color:#4a5568;">Met warme groet,<br>Benji van</p>
      <div style="text-align:center;margin-top:30px;">
        <a href="https://www.talktobenji.com" style="font-size:16px;font-weight:600;color:#6d84a8;text-decoration:none;">talktobenji</a>
        <p style="font-size:13px;color:#718096;margin:10px 0 0 0;">contact</p>
        <p style="font-size:13px;margin:2px 0 0 0;">
          <a href="mailto:contactmetien@talktobenji.com" style="color:#6d84a8;text-decoration:none;">contactmetien@talktobenji.com</a>
        </p>
      </div>
    </div>`;
}

/**
 * Genereert op basis van de ingevulde antwoorden een persoonlijke "brief aan
 * zichzelf" (Benji-toon, via Claude) en stuurt die naar het opgegeven e-mailadres.
 */
export const genereerEnVerstuurBrief = action({
  args: {
    email: v.string(),
    naam: v.optional(v.string()),
    verliesType: v.optional(v.string()),
    antwoorden: v.array(v.object({ vraag: v.string(), antwoord: v.string() })),
    fotos: v.optional(v.array(v.string())), // base64 data-URL's
  },
  handler: async (ctx, args) => {
    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
    if (!RESEND_API_KEY) throw new Error("E-mail niet geconfigureerd (RESEND_API_KEY).");
    if (!ANTHROPIC_API_KEY) throw new Error("AI niet geconfigureerd (ANTHROPIC_API_KEY).");

    const ingevuld = args.antwoorden.filter((a) => a.antwoord && a.antwoord.trim());
    if (ingevuld.length === 0) throw new Error("Geen antwoorden om een brief van te maken.");

    // Max één brief per e-mailadres.
    const emailLc = args.email.trim().toLowerCase();
    const alVerzonden = await ctx.runQuery(internal.houvast.briefAlVerzonden, { email: emailLc });
    if (alVerzonden) throw new Error("Je hebt op dit e-mailadres al een brief ontvangen.");

    // Content uit de admin (brief-toon + Niet Alleen-links per verliestype).
    const saved = (await ctx.runQuery(api.pageContent.getPublicPageContent, {
      pageKey: "houvast",
    })) as Record<string, any> | null;
    const briefInstructie =
      (typeof saved?.briefInstructie === "string" ? saved.briefInstructie.trim() : "") ||
      BRIEF_INSTRUCTIE_DEFAULT;

    // Doel-URL voor de Niet Alleen-knop in de mail (per verliestype, absoluut maken).
    const DEFAULT_LINKS: Record<string, string> = {
      persoon: "/lp/je-mist-iemand",
      huisdier: "/lp/niet-alleen-voor-hulp-bij-verlies-van-huisdier",
      scheiding: "/lp/mijn-relatie-is-voorbij",
      eenzaamheid: "/lp/ik-voel-me-eenzaam",
      kinderloos: "/lp/ongewenst-kinderloos-die-pijn-gaat-nooit-weg",
    };
    const links: Record<string, string> = saved?.nietAlleenLinks ?? {};
    const type = args.verliesType || "persoon";
    const rawUrl =
      (links[type] && links[type].trim()) ||
      DEFAULT_LINKS[type] ||
      "/lp/je-hoeft-het-niet-alleen-te-doen";
    // Normaliseer een slug (met/zonder /lp/) naar een geldige LP-URL, dan absoluut maken.
    let pad = rawUrl.trim();
    if (!pad.startsWith("http")) {
      if (!pad.startsWith("/lp/")) pad = `/lp/${pad.replace(/^\/+/, "").replace(/^lp\//, "")}`;
    }
    const nietAlleenUrl = pad.startsWith("http") ? pad : `https://www.talktobenji.com${pad}`;

    const userContent = [
      args.naam ? `Naam: ${args.naam}` : null,
      "De persoon heeft bij Even Houvast het volgende opgeschreven:",
      ...ingevuld.map((a, i) => `${i + 1}. Vraag: ${a.vraag}\n   Antwoord: ${a.antwoord.trim()}`),
    ]
      .filter(Boolean)
      .join("\n\n");

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 800,
        system: briefInstructie,
        messages: [{ role: "user", content: userContent }],
      }),
    });
    if (!response.ok) throw new Error(`AI-fout: ${await response.text()}`);
    const data = (await response.json()) as { content?: Array<{ text?: string }> };
    const briefRaw: string = (data.content?.[0]?.text ?? "").trim();
    if (!briefRaw) throw new Error("Lege brief gegenereerd.");
    // Geen gedachtestreepjes in de tekst (— of –) → vervang door een komma.
    const brief = briefRaw.replace(/\s*[—–]\s*/g, ", ").replace(/, ,/g, ",");

    const aanhef = args.naam ? `Lieve ${args.naam},` : "Voor jou,";
    const briefHtml = brief
      .split(/\n\s*\n/)
      .map(
        (p) =>
          `<p style="font-size:15px;line-height:1.9;color:#3d3530;margin:0 0 16px 0;">${p.replace(/\n/g, "<br>")}</p>`
      )
      .join("");

    // Foto's: opslaan in Convex storage en als echte URL in de mail tonen.
    let fotoHtml = "";
    const fotoUrls: string[] = [];
    for (const dataUrl of args.fotos ?? []) {
      const blob = dataUrlToBlob(dataUrl);
      if (!blob) continue;
      try {
        const storageId = await ctx.storage.store(blob);
        const url = await ctx.storage.getUrl(storageId);
        if (url) fotoUrls.push(url);
      } catch {
        /* sla deze foto over */
      }
    }
    if (fotoUrls.length > 0) {
      // Kleine thumbnails, max 3 naast elkaar (via tabel — betrouwbaar in mailclients).
      const rijen: string[][] = [];
      for (let i = 0; i < fotoUrls.length; i += 3) rijen.push(fotoUrls.slice(i, i + 3));
      const rijenHtml = rijen
        .map((rij) => {
          const cellen = rij
            .map(
              (u) =>
                `<td width="33%" style="padding:0 4px 8px 0;vertical-align:top;">
                  <img src="${u}" alt="" width="100%" style="width:100%;height:84px;object-fit:cover;border-radius:8px;display:block;" />
                </td>`
            )
            .join("");
          const opvulling =
            rij.length < 3 ? Array(3 - rij.length).fill('<td width="33%"></td>').join("") : "";
          return `<tr>${cellen}${opvulling}</tr>`;
        })
        .join("");
      fotoHtml = `
        <div style="margin:26px 0 4px 0;">
          <p style="font-size:13px;color:#8a8078;margin:0 0 12px 0;">De foto's die je bewaarde:</p>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
            ${rijenHtml}
          </table>
        </div>`;
    }

    const ctaHtml = `
      <div style="margin:30px 0 4px 0;text-align:center;border-top:1px solid #e8e0d8;padding-top:26px;">
        <p style="font-size:14px;color:#6b6460;margin:0 0 16px 0;">Voor de langere weg is er Niet Alleen — dag voor dag, samen.</p>
        <a href="${nietAlleenUrl}" style="background-color:#6d84a8;color:#ffffff;padding:13px 26px;border-radius:10px;
           text-decoration:none;font-size:15px;font-weight:600;display:inline-block;">
          Ontdek Niet Alleen
        </a>
      </div>`;

    const html = wrapperBrief(`
      <p style="font-size:16px;margin:0 0 18px 0;color:#3d3530;">${aanhef}</p>
      ${briefHtml}
      ${fotoHtml}
      ${ctaHtml}
    `);

    await verstuurEmail({
      to: emailLc,
      subject: "Jouw woorden — Even Houvast",
      html,
      apiKey: RESEND_API_KEY,
    });
    await ctx.runMutation(internal.houvast.markBriefVerzonden, { email: emailLc });
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
