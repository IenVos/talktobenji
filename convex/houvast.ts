/**
 * Houvast — gratis mini-gids toegankelijk via magic link token.
 */
import { v } from "convex/values";
import { action, internalAction, internalMutation, internalQuery, mutation, query } from "./_generated/server";
import { api, internal } from "./_generated/api";
import { checkAdmin, logAdminAction } from "./adminAuth";

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

// Vast, unisex gedichtje (4 regels) onder de foto's in de brief-mail. Per
// verliestype. Te overschrijven via admin (perType[type].fotoGedicht).
const GEDICHT_PER_TYPE: Record<string, string> = {
  persoon: `Wat jullie hadden,
neemt niemand ooit weg.
Het leeft in deze beelden,
en in jou, voorgoed.`,
  huisdier: `Trouw tot het einde,
dichtbij zonder woorden.
Wat jullie samen waren,
draag je voor altijd mee.`,
  scheiding: `Niet alles wat eindigt,
ging verloren.
Wat echt was, blijft echt,
en jij komt hier doorheen.`,
  eenzaamheid: `Ook in de stilte
ben je meer dan dit moment.
Je bent niet vergeten,
en je staat er niet alleen voor.`,
  kinderloos: `Een liefde zo groot,
voor wie er nooit kwam.
Dit gemis is echt,
en het mag er zijn.`,
};

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
  args: { email: v.string(), verliesType: v.optional(v.string()), naam: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const bestaand = await ctx.db
      .query("houvastBrieven")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();
    if (!bestaand) {
      await ctx.db.insert("houvastBrieven", {
        email: args.email,
        sentAt: Date.now(),
        verliesType: args.verliesType,
        naam: args.naam,
      });
    } else if (!bestaand.verliesType && args.verliesType) {
      // Vul type/naam aan als die er nog niet was (oude records).
      await ctx.db.patch(bestaand._id, { verliesType: args.verliesType, naam: args.naam ?? bestaand.naam });
    }
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

function wrapperBrief(inhoud: string, ps: string = ""): string {
  return `
    <div style="font-family: ${BRIEF_FONT}; max-width: 560px; margin: 0 auto;
                color: #2d3748; background: #fdf9f4; padding: 36px 28px;">
      <p style="font-size:12px;letter-spacing:0.14em;text-transform:uppercase;color:#9a9088;margin:0 0 20px 0;">Even Houvast</p>
      ${inhoud}
      <p style="font-size:15px;margin-top:28px;color:#4a5568;">Met warme groet,<br>Benji van</p>
      ${ps}
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
    // Brief-instructie: per verliestype als die is ingevuld, anders de basis.
    const typeInstructie =
      typeof saved?.perType?.[args.verliesType ?? ""]?.briefInstructie === "string"
        ? saved.perType[args.verliesType ?? ""].briefInstructie.trim()
        : "";
    const briefInstructie =
      typeInstructie ||
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

    // Korte omschrijving van het verlies, zodat de brief past bij dit verliestype.
    const VERLIES_CONTEXT: Record<string, string> = {
      persoon: "het overlijden van een dierbare",
      huisdier: "het verlies van een huisdier",
      scheiding: "het einde van een relatie (de ander leeft nog)",
      eenzaamheid: "diepe eenzaamheid",
      kinderloos: "ongewenste kinderloosheid, rouw om een kind dat er nooit kwam",
    };
    const verliesContext = args.verliesType ? VERLIES_CONTEXT[args.verliesType] : "";

    const userContent = [
      args.naam ? `Naam: ${args.naam}` : null,
      verliesContext ? `Het verdriet gaat over: ${verliesContext}.` : null,
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
      // Groter en volledig zichtbaar (geen bijsnijden): max 3 naast elkaar,
      // breedte verdeeld over het aantal foto's, hoogte volgt de verhouding.
      const perRij = Math.min(fotoUrls.length, 3);
      const celBreedte = Math.floor(100 / perRij);
      const rijen: string[][] = [];
      for (let i = 0; i < fotoUrls.length; i += 3) rijen.push(fotoUrls.slice(i, i + 3));
      const rijenHtml = rijen
        .map((rij) => {
          const cellen = rij
            .map(
              (u) =>
                `<td width="${celBreedte}%" style="padding:0 5px 10px 5px;vertical-align:top;">
                  <img src="${u}" alt="" width="100%" style="width:100%;height:auto;border-radius:10px;display:block;" />
                </td>`
            )
            .join("");
          const opvulling =
            rij.length < perRij
              ? Array(perRij - rij.length).fill(`<td width="${celBreedte}%"></td>`).join("")
              : "";
          return `<tr>${cellen}${opvulling}</tr>`;
        })
        .join("");

      // Vast gedichtje per verliestype (admin-override mogelijk), onder de foto's.
      const gedichtTekst =
        (typeof saved?.perType?.[type]?.fotoGedicht === "string" &&
          saved.perType[type].fotoGedicht.trim()) ||
        GEDICHT_PER_TYPE[type] ||
        GEDICHT_PER_TYPE.persoon;
      const gedichtRegels = gedichtTekst
        .split("\n")
        .map((r: string) => r.trim())
        .filter(Boolean);
      const gedichtHtml =
        gedichtRegels.length > 0
          ? `<div style="margin:20px 0 0 0;text-align:center;">
               <p style="font-size:15px;line-height:1.85;color:#6b6460;font-style:italic;margin:0;">${gedichtRegels.join(
                 "<br>"
               )}</p>
             </div>`
          : "";

      fotoHtml = `
        <div style="margin:28px 0 4px 0;">
          <p style="font-size:13px;color:#8a8078;margin:0 0 14px 0;">De foto's die je bewaarde:</p>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
            ${rijenHtml}
          </table>
          ${gedichtHtml}
        </div>`;
    }

    // Zacht P.S. ná de afsluiting: vriendelijke tekst + ingetogen knop
    // (zelfde achtergrond als de mail, blauwe tekst, dun blauw randje).
    const psHtml = `
      <div style="margin:26px 0 0 0;border-top:1px solid #e8e0d8;padding-top:22px;">
        <p style="font-size:14px;line-height:1.75;color:#6b6460;margin:0 0 16px 0;">
          <strong style="color:#4a5568;">P.S.</strong> Voor de langere weg is er Niet Alleen. Dag voor dag, samen, in jouw tempo. Geen haast, gewoon iemand die met je meeloopt.
        </p>
        <a href="${nietAlleenUrl}" style="background-color:#fdf9f4;color:#6d84a8;padding:11px 24px;border-radius:10px;
           text-decoration:none;font-size:14px;font-weight:600;display:inline-block;border:1px solid #6d84a8;">
          Ontdek Niet Alleen
        </a>
      </div>`;

    const html = wrapperBrief(
      `
      <p style="font-size:16px;margin:0 0 18px 0;color:#3d3530;">${aanhef}</p>
      ${briefHtml}
      ${fotoHtml}
    `,
      psHtml
    );

    await verstuurEmail({
      to: emailLc,
      subject: "Jouw woorden — Even Houvast",
      html,
      apiKey: RESEND_API_KEY,
    });
    await ctx.runMutation(internal.houvast.markBriefVerzonden, { email: emailLc, verliesType: args.verliesType, naam: args.naam });
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

// ─── Voortgang per lead (admin) ──────────────────────────────────────────────
// Toont per Even Houvast-lead (álle verliestypen) waar die in het traject zit.
// Combineert:
//   - houvasteProfielen  → aangemeld via magic link (welkomstmail verstuurd)
//   - houvastBrieven     → alle momenten ingevuld + brief verstuurd (met type)
//   - ehOpvolgVerzonden  → opvolgmails 1..5 met datum
//   - ehAfmeldingen      → afgemeld uit de opvolgreeks
//   - nietAlleenProfiles → kocht Niet Alleen
//
// Let op: de antwoorden op de momenten zelf worden bewust niet opgeslagen
// (privacy, ze blijven in de browser). Een verstuurde brief betekent dus dat
// alle momenten zijn ingevuld; zonder brief is het traject nog niet voltooid.
const DAG_MS = 24 * 60 * 60 * 1000;

export const leadsVoortgang = query({
  args: { adminToken: v.string() },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);

    const profielen = await ctx.db.query("houvasteProfielen").collect();
    const brieven = await ctx.db.query("houvastBrieven").collect();

    type Basis = {
      email: string;
      naam: string | null;
      welkomstAt: number | null; // aangemeld via magic link
      briefAt: number | null; // brief verstuurd = alle momenten ingevuld
      verliesType: string | null;
    };
    const byEmail = new Map<string, Basis>();
    const ensure = (emailRaw: string): Basis => {
      const email = emailRaw.trim().toLowerCase();
      let r = byEmail.get(email);
      if (!r) {
        r = { email, naam: null, welkomstAt: null, briefAt: null, verliesType: null };
        byEmail.set(email, r);
      }
      return r;
    };

    for (const p of profielen) {
      const r = ensure(p.email);
      r.welkomstAt = p.createdAt;
      if (p.name && !r.naam) r.naam = p.name;
    }
    for (const b of brieven) {
      const r = ensure(b.email);
      r.briefAt = b.sentAt;
      if (b.verliesType && !r.verliesType) r.verliesType = b.verliesType;
      if (b.naam && !r.naam) r.naam = b.naam;
    }

    const rijen = [];
    for (const r of byEmail.values()) {
      const [opvolg, afgemeld, profiel] = await Promise.all([
        ctx.db.query("ehOpvolgVerzonden").withIndex("by_email", (q) => q.eq("email", r.email)).collect(),
        ctx.db.query("ehAfmeldingen").withIndex("by_email", (q) => q.eq("email", r.email)).first(),
        ctx.db.query("nietAlleenProfiles").withIndex("by_email", (q) => q.eq("email", r.email)).first(),
      ]);
      const opvolgmails = opvolg
        .map((o: any) => ({ mailNummer: o.mailNummer as number, sentAt: o.sentAt as number }))
        .sort((a, b) => a.mailNummer - b.mailNummer);
      const gekochtAt = profiel ? (profiel.startDatum as number) : null;
      const laatsteActiviteit = Math.max(
        r.welkomstAt ?? 0,
        r.briefAt ?? 0,
        gekochtAt ?? 0,
        ...opvolgmails.map((o) => o.sentAt),
      );
      rijen.push({
        email: r.email,
        naam: r.naam,
        verliesType: r.verliesType,
        welkomstAt: r.welkomstAt,
        briefAt: r.briefAt,
        opvolgmails,
        afgemeld: !!afgemeld,
        gekocht: !!profiel,
        gekochtAt,
        dagenSindsBrief: r.briefAt ? Math.floor((Date.now() - r.briefAt) / DAG_MS) : null,
        laatsteActiviteit,
      });
    }
    rijen.sort((a, b) => b.laatsteActiviteit - a.laatsteActiviteit);
    return rijen;
  },
});

// Verwijder een Even Houvast-lead volledig uit de lead-tabellen (admin).
// Raakt bewust NIET nietAlleenProfiles aan: een gekochte Niet Alleen blijft staan.
async function verwijderLeadRecords(ctx: any, emailRaw: string): Promise<number> {
  const email = emailRaw.trim().toLowerCase();
  let verwijderd = 0;
  const tabellen = ["houvasteProfielen", "houvastBrieven", "ehOpvolgVerzonden", "ehAfmeldingen"] as const;
  for (const tabel of tabellen) {
    const rijen = await ctx.db.query(tabel).withIndex("by_email", (q: any) => q.eq("email", email)).collect();
    for (const r of rijen) {
      await ctx.db.delete(r._id);
      verwijderd++;
    }
  }
  return verwijderd;
}

export const verwijderLead = mutation({
  args: { adminToken: v.string(), email: v.string() },
  handler: async (ctx, args) => {
    await checkAdmin(ctx, args.adminToken);
    const verwijderd = await verwijderLeadRecords(ctx, args.email);
    await logAdminAction(ctx, `Even Houvast lead verwijderd: ${args.email.trim().toLowerCase()}`);
    return { verwijderd };
  },
});

// Eenmalige opruiming: verwijder alle Even Houvast-leads behalve één e-mailadres.
// Bedoeld om testleads in één keer op te ruimen (via npx convex run).
export const opruimLeadsBehalve = internalMutation({
  args: { behoudEmail: v.string() },
  handler: async (ctx, args) => {
    const behoud = args.behoudEmail.trim().toLowerCase();
    const emails = new Set<string>();
    for (const p of await ctx.db.query("houvasteProfielen").collect()) emails.add(p.email.trim().toLowerCase());
    for (const b of await ctx.db.query("houvastBrieven").collect()) emails.add(b.email.trim().toLowerCase());
    const verwijderdeEmails: string[] = [];
    for (const email of emails) {
      if (email === behoud) continue;
      await verwijderLeadRecords(ctx, email);
      verwijderdeEmails.push(email);
    }
    return { behoud, verwijderd: verwijderdeEmails };
  },
});
