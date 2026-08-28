import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

/** Normaliseer een pad zoals in convex/redirects.ts (leidende slash, geen trailing slash). */
function normalizePath(p: string): string {
  if (!p) return "/";
  let out = p.split("#")[0].split("?")[0];
  if (out.length > 1 && out.endsWith("/")) out = out.slice(0, -1);
  return out;
}

// Korte in-memory cache van de actieve redirects, zodat we niet elke request Convex bevragen.
type RedirectRule = { from: string; to: string; permanent: boolean };
let redirectCache: { map: Map<string, RedirectRule>; at: number } | null = null;
const REDIRECT_TTL_MS = 60_000;

async function lookupRedirect(pathname: string): Promise<RedirectRule | null> {
  const now = Date.now();
  if (!redirectCache || now - redirectCache.at > REDIRECT_TTL_MS) {
    try {
      const client = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
      const rules = (await client.query(api.redirects.listActive, {})) as RedirectRule[];
      redirectCache = { map: new Map(rules.map((r) => [normalizePath(r.from), r])), at: now };
    } catch {
      // Convex onbereikbaar: nooit de site breken, gewoon geen redirect toepassen.
      if (!redirectCache) return null;
    }
  }
  return redirectCache?.map.get(normalizePath(pathname)) ?? null;
}

/**
 * Redirect HTTP → HTTPS in productie + beheerbare redirects + security headers + admin route protection.
 */
export async function middleware(request: NextRequest) {
  if (
    process.env.NODE_ENV === "production" &&
    request.headers.get("x-forwarded-proto") === "http"
  ) {
    const url = request.nextUrl.clone();
    url.protocol = "https:";
    return NextResponse.redirect(url, 301);
  }

  // Beheerbare redirects (admin). Alleen op de hoofdsite, niet voor admin/api.
  const path = request.nextUrl.pathname;
  const host = request.headers.get("host") ?? "";
  const isNietAlleenHost = host === "niet-alleen.nl" || host === "www.niet-alleen.nl";
  if (!isNietAlleenHost && !path.startsWith("/admin") && !path.startsWith("/api")) {
    const rule = await lookupRedirect(path);
    if (rule) {
      let dest: string;
      if (/^https?:\/\//i.test(rule.to)) {
        dest = rule.to;
      } else {
        // Bestemming kan zelf query-params bevatten (bijv. /benji?start=momenten&t=scheiding).
        // Voeg inkomende params (utm, fbclid van Facebook) daar NETJES bij samen i.p.v.
        // een tweede "?" aan te plakken (dat brak de link vanuit een ad).
        const target = new URL(rule.to, request.url);
        request.nextUrl.searchParams.forEach((v, k) => {
          if (!target.searchParams.has(k)) target.searchParams.set(k, v);
        });
        dest = target.toString();
      }
      return NextResponse.redirect(dest, rule.permanent ? 301 : 302);
    }
  }

  // Hostname-based routing voor niet-alleen.nl
  const hostname = request.headers.get("host") ?? "";
  const isNietAlleen = hostname === "niet-alleen.nl" || hostname === "www.niet-alleen.nl";
  if (isNietAlleen) {
    const pathname = request.nextUrl.pathname;

    // Vaste routes
    const fixedMap: Record<string, string> = {
      "/": "/niet-alleen-nl",
      "/betalen": "/niet-alleen-nl/betalen",
      "/bedankt": "/niet-alleen-nl/bedankt",
      "/privacy": "/niet-alleen-nl/privacy",
    };
    if (fixedMap[pathname]) {
      return NextResponse.rewrite(new URL(fixedMap[pathname], request.url));
    }

    // Dynamische landingspagina's: /er-zijn → /niet-alleen-nl/er-zijn (slug: niet-alleen-er-zijn)
    const dynamicMatch = pathname.match(/^\/([a-z0-9-]+)$/);
    if (dynamicMatch) {
      return NextResponse.rewrite(new URL(`/niet-alleen-nl/${dynamicMatch[1]}`, request.url));
    }

    // Alles wat niet matcht → homepage
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Admin route protection: controleer of admin_session cookie aanwezig is
  // met geldig formaat (uuid.hmac). De volledige cryptografische verificatie
  // gebeurt in /api/admin/check, maar dit blokkeert ongeautoriseerde toegang
  // al op server-niveau.
  if (request.nextUrl.pathname.startsWith("/admin")) {
    const adminSession = request.cookies.get("admin_session")?.value;
    if (!adminSession || !adminSession.includes(".")) {
      // Geen geldige sessie → toon login pagina (redirect naar /admin)
      // We laten /admin zelf door (daar zit de login form in de layout)
      // maar blokkeren alle sub-pagina's
      if (request.nextUrl.pathname !== "/admin") {
        const url = request.nextUrl.clone();
        url.pathname = "/admin";
        return NextResponse.redirect(url);
      }
    }
  }

  const response = NextResponse.next();

  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(self), geolocation=()");
  response.headers.set(
    "Strict-Transport-Security",
    "max-age=63072000; includeSubDomains; preload"
  );
  response.headers.set(
    "Content-Security-Policy",
    "frame-ancestors 'none'; object-src 'none'; base-uri 'self';"
  );
  response.headers.set("X-Permitted-Cross-Domain-Policies", "none");

  return response;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|icon|images).*)"],
};
