/**
 * Expose JWKS so Convex can validate JWTs issued by NextAuth (session callback).
 * Zie https://stack.convex.dev/nextauth-adapter
 */
import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";

const http = httpRouter();

// ─── Resend webhook ──────────────────────────────────────────────────────────
// Ontvangt e-mail-events van Resend (sent, delivered, opened, clicked, bounced,
// complained) en slaat ze op zodat de admin open-rate en klik-ratio kan tonen.
// Beveiligd met een svix-handtekening (RESEND_WEBHOOK_SECRET, begint met whsec_).

function base64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

function bytesToBase64(bytes: Uint8Array): string {
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}

// Verifieert de svix-handtekening zoals Resend die meestuurt.
async function verifieerSvix(opts: {
  secret: string;
  svixId: string;
  svixTimestamp: string;
  svixSignature: string;
  body: string;
}): Promise<boolean> {
  const { secret, svixId, svixTimestamp, svixSignature, body } = opts;
  if (!svixId || !svixTimestamp || !svixSignature) return false;

  // whsec_-prefix eraf; de rest is base64 van de sleutel.
  const rawSecret = secret.startsWith("whsec_") ? secret.slice(6) : secret;
  let keyBytes: Uint8Array;
  try {
    keyBytes = base64ToBytes(rawSecret);
  } catch {
    return false;
  }

  const signedContent = `${svixId}.${svixTimestamp}.${body}`;
  const key = await crypto.subtle.importKey(
    "raw",
    keyBytes.buffer.slice(keyBytes.byteOffset, keyBytes.byteOffset + keyBytes.byteLength) as ArrayBuffer,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sigBuf = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(signedContent));
  const verwacht = bytesToBase64(new Uint8Array(sigBuf));

  // svix-signature is een spatie-gescheiden lijst van "v1,<sig>"-items.
  for (const item of svixSignature.split(" ")) {
    const komma = item.indexOf(",");
    const sig = komma >= 0 ? item.slice(komma + 1) : item;
    if (sig === verwacht) return true;
  }
  return false;
}

http.route({
  path: "/resend-webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const secret = process.env.RESEND_WEBHOOK_SECRET;
    if (!secret) {
      // Nog niet geconfigureerd — verwerk niets, maar geef 200 zodat Resend
      // de webhook als "ontvangen" ziet tijdens het opzetten.
      return new Response("ok", { status: 200 });
    }

    const body = await request.text();
    const geldig = await verifieerSvix({
      secret,
      svixId: request.headers.get("svix-id") ?? "",
      svixTimestamp: request.headers.get("svix-timestamp") ?? "",
      svixSignature: request.headers.get("svix-signature") ?? "",
      body,
    });
    if (!geldig) {
      return new Response("ongeldige handtekening", { status: 401 });
    }

    let payload: any;
    try {
      payload = JSON.parse(body);
    } catch {
      return new Response("ongeldige payload", { status: 400 });
    }

    const type: string = typeof payload?.type === "string" ? payload.type : "";
    const data = payload?.data ?? {};
    const emailId: string = typeof data.email_id === "string" ? data.email_id : "";
    if (!type.startsWith("email.") || !emailId) {
      // Andere event-typen (bijv. contact.*) negeren we.
      return new Response("ok", { status: 200 });
    }

    const toRaw = Array.isArray(data.to) ? data.to[0] : data.to;
    const tijd = Date.parse(data.created_at || payload.created_at || "");
    const clickLink =
      data.click && typeof data.click.link === "string" ? data.click.link : undefined;

    await ctx.runMutation(internal.emailStats.recordEvent, {
      emailId,
      type,
      subject: typeof data.subject === "string" ? data.subject : undefined,
      to: typeof toRaw === "string" ? toRaw.toLowerCase() : undefined,
      clickLink,
      createdAt: Number.isFinite(tijd) ? tijd : Date.now(),
      svixId: request.headers.get("svix-id") ?? "",
    });

    return new Response("ok", { status: 200 });
  }),
});

http.route({
  path: "/.well-known/openid-configuration",
  method: "GET",
  handler: httpAction(async () => {
    return new Response(
      JSON.stringify({
        issuer: process.env.CONVEX_SITE_URL,
        jwks_uri: process.env.CONVEX_SITE_URL + "/.well-known/jwks.json",
        authorization_endpoint:
          process.env.CONVEX_SITE_URL + "/oauth/authorize",
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control":
            "public, max-age=15, stale-while-revalidate=15, stale-if-error=86400",
        },
      }
    );
  }),
});

http.route({
  path: "/.well-known/jwks.json",
  method: "GET",
  handler: httpAction(async () => {
    if (process.env.JWKS === undefined) {
      throw new Error("Missing JWKS Convex environment variable");
    }
    return new Response(process.env.JWKS, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control":
          "public, max-age=15, stale-while-revalidate=15, stale-if-error=86400",
      },
    });
  }),
});

export default http;
