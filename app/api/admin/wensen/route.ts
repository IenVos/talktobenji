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
    const isValid = crypto.timingSafeEqual(Buffer.from(signature, "hex"), Buffer.from(expected, "hex"));
    return { valid: isValid, sessionId: isValid ? sessionId : "" };
  } catch {
    return { valid: false, sessionId: "" };
  }
}

function getAdminToken(request: NextRequest): string | null {
  const session = request.cookies.get("admin_session");
  if (!session?.value) return null;
  const { valid, sessionId } = verifySessionToken(session.value);
  return valid ? sessionId : null;
}

const CONVEX_URL = () => process.env.NEXT_PUBLIC_CONVEX_URL!;

async function convexQuery(path: string, args: Record<string, unknown>) {
  const res = await fetch(`${CONVEX_URL()}/api/query`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path, args, format: "json" }),
  });
  const data = await res.json();
  return data.value;
}

async function convexMutation(path: string, args: Record<string, unknown>) {
  const res = await fetch(`${CONVEX_URL()}/api/mutation`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path, args, format: "json" }),
  });
  return res.ok;
}

/** GET: alle wensen ophalen */
export async function GET(request: NextRequest) {
  const adminToken = getAdminToken(request);
  if (!adminToken) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const features = await convexQuery("comingSoonFeatures:listAll", { adminToken });
    return NextResponse.json({ features: features ?? [] });
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

/** POST: aanmaken of bulk-seed */
export async function POST(request: NextRequest) {
  const adminToken = getAdminToken(request);
  if (!adminToken) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();

    // Bulk seed: array van features
    if (Array.isArray(body)) {
      for (const item of body) {
        await convexMutation("comingSoonFeatures:create", { adminToken, ...item });
      }
      return NextResponse.json({ ok: true });
    }

    // Enkel aanmaken
    await convexMutation("comingSoonFeatures:create", { adminToken, ...body });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

/** PATCH: bijwerken */
export async function PATCH(request: NextRequest) {
  const adminToken = getAdminToken(request);
  if (!adminToken) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    await convexMutation("comingSoonFeatures:update", { adminToken, ...body });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

/** DELETE: verwijderen */
export async function DELETE(request: NextRequest) {
  const adminToken = getAdminToken(request);
  if (!adminToken) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await request.json();
    await convexMutation("comingSoonFeatures:remove", { adminToken, id });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
