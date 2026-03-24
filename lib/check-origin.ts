/**
 * CSRF-bescherming: controleer of het verzoek van een bekende origin komt.
 * Voor JSON API routes — browsers kunnen geen JSON sturen naar andere origins
 * zonder een preflight (CORS), maar dit voegt een extra verdedigingslaag toe.
 */

const ALLOWED_ORIGINS = [
  "https://www.talktobenji.com",
  "https://talktobenji.com",
  "http://localhost:3000",
  "http://localhost:3001",
];

export function checkOrigin(req: Request): boolean {
  const origin = req.headers.get("origin");
  const referer = req.headers.get("referer");

  // Geen origin header = server-to-server of curl = accepteren
  if (!origin && !referer) return true;

  if (origin) return ALLOWED_ORIGINS.some((o) => origin.startsWith(o));
  if (referer) return ALLOWED_ORIGINS.some((o) => referer.startsWith(o));

  return false;
}
