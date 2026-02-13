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

  return response;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|icon).*)"],
};
