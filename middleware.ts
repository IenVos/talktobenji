import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Redirect HTTP → HTTPS in productie.
 * Session cookies werken alleen over HTTPS, anders herkent NextAuth de sessie niet.
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
  return NextResponse.next();
}

export const config = {
  matcher: "/:path*",
};
