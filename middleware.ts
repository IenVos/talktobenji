import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Redirect HTTP → HTTPS in productie + security headers + admin route protection.
 */
export function middleware(request: NextRequest) {
  if (
    process.env.NODE_ENV === "production" &&
    request.headers.get("x-forwarded-proto") === "http"
  ) {
    const url = request.nextUrl.clone();
    url.protocol = "https:";
    return NextResponse.redirect(url, 301);
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
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|icon).*)"],
};
