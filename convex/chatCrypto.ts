/**
 * Versleuteling-at-rest voor chatMessages.content.
 *
 * Server-beheerde sleutel: `CHAT_ENCRYPTION_KEY` (base64 van 32 willekeurige bytes),
 * staat in de Convex environment. Formaat van versleutelde tekst: `enc:v1:<b64 iv>:<b64 ct>`.
 * AES-256-GCM via de Web Crypto API.
 *
 * VEILIGHEID:
 * - Aan/uit via `CHAT_ENCRYPTION_ACTIEF === "true"`. Staat die uit, dan versleutelt
 *   `encryptContent` NIETS (geeft platte tekst terug) — dan verandert er niets voor
 *   bestaande gebruikers.
 * - `decryptContent` laat platte tekst (alles zonder de `enc:v1:`-prefix) ongewijzigd
 *   door. Zo blijven bestaande, onversleutelde berichten gewoon werken.
 * - Alles heeft een VANGNET: bij welke fout dan ook geven we de originele tekst terug.
 *   Versleuteling kan zo nooit een gesprek breken, hoogstens "niet versleuteld".
 */
import { internalQuery } from "./_generated/server";
import { v } from "convex/values";

const PREFIX = "enc:v1:";

function getKeyBytes(): Uint8Array | null {
  const b64 = process.env.CHAT_ENCRYPTION_KEY;
  if (!b64) return null;
  try {
    const bin = atob(b64.trim());
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return bytes.length === 32 ? bytes : null;
  } catch {
    return null;
  }
}

function importKey(bytes: Uint8Array) {
  // `as any`: Uint8Array vs BufferSource verschilt tussen de convex- en project-
  // tsconfig (TS-lib-versies). Cast houdt beide typechecks tevreden.
  return crypto.subtle.importKey("raw", bytes as any, { name: "AES-GCM" }, false, ["encrypt", "decrypt"]);
}

function b64encode(bytes: Uint8Array): string {
  let s = "";
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s);
}

function b64decode(s: string): Uint8Array {
  const bin = atob(s);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

/** Versleutel alleen als de schakelaar aan staat én er een geldige sleutel is. */
export async function encryptContent(text: string): Promise<string> {
  if (typeof text !== "string" || text.length === 0) return text;
  if (process.env.CHAT_ENCRYPTION_ACTIEF !== "true") return text;
  if (text.startsWith(PREFIX)) return text; // al versleuteld
  const keyBytes = getKeyBytes();
  if (!keyBytes) return text;
  try {
    const key = await importKey(keyBytes);
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const ctBuf = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      key,
      new TextEncoder().encode(text)
    );
    return `${PREFIX}${b64encode(iv)}:${b64encode(new Uint8Array(ctBuf))}`;
  } catch {
    return text; // vangnet
  }
}

/** Ontsleutel versleutelde tekst; platte tekst gaat ongewijzigd door. */
export async function decryptContent(stored: string): Promise<string> {
  if (typeof stored !== "string" || !stored.startsWith(PREFIX)) return stored;
  const keyBytes = getKeyBytes();
  if (!keyBytes) return stored; // geen sleutel: niet stukmaken (mag niet gebeuren)
  try {
    const rest = stored.slice(PREFIX.length);
    const sep = rest.indexOf(":");
    if (sep < 0) return stored;
    const iv = b64decode(rest.slice(0, sep));
    const ct = b64decode(rest.slice(sep + 1));
    const key = await importKey(keyBytes);
    const ptBuf = await crypto.subtle.decrypt({ name: "AES-GCM", iv: iv as any }, key, ct as any);
    return new TextDecoder().decode(ptBuf);
  } catch {
    return stored; // vangnet
  }
}

/**
 * Zelftest: werkt crypto.subtle in een Convex QUERY-context (waar we de historie
 * voor de klant ontsleutelen)? Draai via `npx convex run chatCrypto:_cryptoSelfTest`.
 * Test de crypto direct, los van de ACTIEF-schakelaar.
 */
export const _cryptoSelfTest = internalQuery({
  args: {},
  handler: async () => {
    const keyBytes = getKeyBytes();
    if (!keyBytes) return { ok: false, reason: "geen/ongeldige CHAT_ENCRYPTION_KEY" };
    try {
      const key = await importKey(keyBytes);
      const iv = crypto.getRandomValues(new Uint8Array(12));
      const plain = "hallo Benji, dit is een testzin 🍃";
      const ctBuf = await crypto.subtle.encrypt(
        { name: "AES-GCM", iv },
        key,
        new TextEncoder().encode(plain)
      );
      const ptBuf = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, new Uint8Array(ctBuf));
      const decrypted = new TextDecoder().decode(ptBuf);
      return { ok: decrypted === plain, roundtripOk: decrypted === plain };
    } catch (e: any) {
      return { ok: false, reason: String(e?.message ?? e) };
    }
  },
});

/**
 * Test de ECHTE encryptContent/decryptContent (inclusief de ACTIEF-schakelaar en het
 * enc:v1:-formaat). Draai via `npx convex run chatCrypto:_encryptRoundTripTest`.
 */
export const _encryptRoundTripTest = internalQuery({
  args: {},
  handler: async () => {
    const plain = "Een testbericht van Ien, met een emoji 🍃 en accenten café.";
    const enc = await encryptContent(plain);
    const dec = await decryptContent(enc);
    return {
      actief: process.env.CHAT_ENCRYPTION_ACTIEF === "true",
      werdVersleuteld: enc.startsWith("enc:v1:"),
      voorbeeldOpslag: enc.slice(0, 24) + (enc.length > 24 ? "..." : ""),
      roundtripOk: dec === plain,
    };
  },
});

/**
 * Privacy-veilige controle: staat de tekst van het laatste gesprek van een adres
 * VERSLEUTELD op de schijf? Leest de RAUWE opslag (niet ontsleuteld) en geeft alleen
 * de `enc:v1:`-markering + lengte terug, nooit de inhoud.
 */
export const _encryptionCheck = internalQuery({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const email = args.email.toLowerCase().trim();
    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", email))
      .unique();
    if (!user) return { error: "gebruiker niet gevonden" };
    const sessions = await ctx.db
      .query("chatSessions")
      .withIndex("by_user", (q) => q.eq("userId", user._id.toString()))
      .collect();
    const laatste = [...sessions].sort((a, b) => (b.startedAt ?? 0) - (a.startedAt ?? 0))[0];
    if (!laatste) return { error: "geen gesprek gevonden" };
    const msgs = await ctx.db
      .query("chatMessages")
      .withIndex("by_session", (q) => q.eq("sessionId", laatste._id))
      .order("asc")
      .collect();
    return {
      sessionId: laatste._id,
      status: laatste.status,
      heeftKwaliteitsrapport: !!(laatste as any).adminRapport,
      rapportLengte: typeof (laatste as any).adminRapport === "string" ? (laatste as any).adminRapport.length : 0,
      sessieGestart: new Date(laatste.startedAt).toISOString(),
      aantalBerichten: msgs.length,
      berichten: msgs.map((m) => ({
        role: m.role,
        versleuteldOpSchijf: typeof m.content === "string" && m.content.startsWith("enc:v1:"),
        lengte: typeof m.content === "string" ? m.content.length : 0,
      })),
    };
  },
});
