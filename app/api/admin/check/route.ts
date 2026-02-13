import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

function verifySessionToken(token: string): boolean {
  const secret = process.env.AUTH_SECRET || process.env.ADMIN_PASSWORD || "";
  const dotIndex = token.indexOf(".");
  if (dotIndex === -1) return false;

  const sessionId = token.slice(0, dotIndex);
  const signature = token.slice(dotIndex + 1);
  if (!sessionId || !signature) return false;

  const hmac = crypto.createHmac("sha256", secret);
  hmac.update(sessionId);
  const expected = hmac.digest("hex");

  if (signature.length !== expected.length) return false;

  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature, "hex"),
      Buffer.from(expected, "hex")
    );
  } catch {
    return false;
  }
}

export async function GET(request: NextRequest) {
  const session = request.cookies.get("admin_session");

  if (session?.value && verifySessionToken(session.value)) {
    return NextResponse.json({ authenticated: true });
  }

  return NextResponse.json({ authenticated: false }, { status: 401 });
}
