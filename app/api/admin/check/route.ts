import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

function verifySessionToken(token: string): { valid: boolean; sessionId: string } {
  const secret = process.env.AUTH_SECRET || process.env.ADMIN_PASSWORD || "";
  const dotIndex = token.indexOf(".");
  if (dotIndex === -1) return { valid: false, sessionId: "" };

  const sessionId = token.slice(0, dotIndex);
  const signature = token.slice(dotIndex + 1);
  if (!sessionId || !signature) return { valid: false, sessionId: "" };

  const hmac = crypto.createHmac("sha256", secret);
  hmac.update(sessionId);
  const expected = hmac.digest("hex");

  if (signature.length !== expected.length) return { valid: false, sessionId: "" };

  try {
    const isValid = crypto.timingSafeEqual(
      Buffer.from(signature, "hex"),
      Buffer.from(expected, "hex")
    );
    return { valid: isValid, sessionId: isValid ? sessionId : "" };
  } catch {
    return { valid: false, sessionId: "" };
  }
}

export async function GET(request: NextRequest) {
  const session = request.cookies.get("admin_session");

  if (session?.value) {
    const { valid, sessionId } = verifySessionToken(session.value);
    if (valid) {
      // Verifieer ook dat de Convex sessie nog geldig is
      try {
        await convex.query(api.adminAuth.validateToken, { adminToken: sessionId });
        return NextResponse.json({
          authenticated: true,
          adminToken: sessionId,
        });
      } catch {
        // Convex sessie ongeldig of verlopen → cookie verwijderen
        const response = NextResponse.json({ authenticated: false }, { status: 401 });
        response.cookies.delete("admin_session");
        return response;
      }
    }
  }

  return NextResponse.json({ authenticated: false }, { status: 401 });
}
