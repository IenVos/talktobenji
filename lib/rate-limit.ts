/**
 * Simpele in-memory rate limiter voor API routes.
 * Beperkt het aantal verzoeken per IP-adres binnen een tijdvenster.
 *
 * ⚠️ VERCEL BEPERKING: Serverless functies hebben geen gedeeld geheugen tussen
 * invocaties. Deze rate limiter werkt alleen betrouwbaar bij warme function-instanties
 * en biedt GEEN garantie op Vercel bij hoge load of cold starts.
 *
 * Voor productie-grade bescherming: gebruik Vercel Firewall (Dashboard → Firewall)
 * of voeg Upstash Redis toe: https://vercel.com/integrations/upstash
 */

const attempts = new Map<string, { count: number; resetAt: number }>();

// Ruim verlopen entries op elke 5 minuten
setInterval(() => {
  const now = Date.now();
  for (const [key, val] of attempts) {
    if (val.resetAt < now) attempts.delete(key);
  }
}, 5 * 60 * 1000);

export function retryAfterMessage(retryAfterMs: number): string {
  const mins = Math.ceil(retryAfterMs / 60000);
  if (mins <= 1) return "Probeer het over ongeveer 1 minuut opnieuw.";
  if (mins < 60) return `Probeer het over ${mins} minuten opnieuw.`;
  return `Probeer het over ${Math.ceil(mins / 60)} uur opnieuw.`;
}

export function rateLimit(
  ip: string,
  { maxAttempts = 5, windowMs = 15 * 60 * 1000 } = {}
): { allowed: boolean; retryAfterMs: number } {
  const now = Date.now();
  const entry = attempts.get(ip);

  if (!entry || entry.resetAt < now) {
    attempts.set(ip, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterMs: 0 };
  }

  entry.count++;
  if (entry.count > maxAttempts) {
    return { allowed: false, retryAfterMs: entry.resetAt - now };
  }

  return { allowed: true, retryAfterMs: 0 };
}
