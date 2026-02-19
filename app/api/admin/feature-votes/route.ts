import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

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
  if (!session?.value) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { valid, sessionId } = verifySessionToken(session.value);
  if (!valid) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!convexUrl) {
    return NextResponse.json({ error: "Convex URL missing" }, { status: 500 });
  }

  try {
    const res = await fetch(`${convexUrl}/api/query`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        path: "featureVotes:getVoteCounts",
        args: { adminToken: sessionId },
        format: "json",
      }),
    });

    if (!res.ok) {
      return NextResponse.json({ error: "Convex query failed" }, { status: 500 });
    }

    const data = await res.json();
    return NextResponse.json({ counts: data.value ?? {} });
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
