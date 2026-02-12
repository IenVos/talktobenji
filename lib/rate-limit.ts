/**
 * Simpele in-memory rate limiter voor API routes.
 * Beperkt het aantal verzoeken per IP-adres binnen een tijdvenster.
 */

const attempts = new Map<string, { count: number; resetAt: number }>();

// Ruim verlopen entries op elke 5 minuten
setInterval(() => {
  const now = Date.now();
  for (const [key, val] of attempts) {
    if (val.resetAt < now) attempts.delete(key);
  }
}, 5 * 60 * 1000);

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
