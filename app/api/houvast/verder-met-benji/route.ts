import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { rateLimit, retryAfterMessage } from "@/lib/rate-limit";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// "Ik wil nog iets vertellen" op de Even Houvast "En nu?"-kaart (relatiebreuk).
// Maakt met het e-mailadres dat we al hebben (van de brief) een eenmalige Benji-
// instaplink, zodat de lead direct het gesprek in kan. Hergebruikt
// genereerTokenNaAfmelding: dat mint gewoon een benjiStartToken voor een e-mailadres
// (naam optioneel), met het interne ADMIN_SESSION_SECRET als gate. De link krijgt
// o=ennu mee, zodat Benji opent met een van de relatiebreuk-openers (variant en-nu)
// en direct het gesprek in gaat, zonder uitlegkaartje.
export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const { allowed, retryAfterMs } = rateLimit(`houvast-verder:${ip}`, {
    maxAttempts: 10,
    windowMs: 60 * 60 * 1000,
  });
  if (!allowed) {
    return NextResponse.json(
      { error: `Te veel verzoeken. ${retryAfterMessage(retryAfterMs)}` },
      { status: 429, headers: { "Retry-After": String(Math.ceil(retryAfterMs / 1000)) } }
    );
  }

  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Niet beschikbaar" }, { status: 500 });
  }

  const body = await req.json().catch(() => ({}));
  const email = typeof body?.email === "string" ? body.email.trim() : "";
  const naam =
    typeof body?.naam === "string" && body.naam.trim() ? body.naam.trim().slice(0, 80) : undefined;

  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "Ongeldig e-mailadres" }, { status: 400 });
  }

  try {
    const token: string = await convex.mutation(api.benjiStart.genereerTokenNaAfmelding, {
      email,
      naam,
      secret,
    });
    return NextResponse.json({ url: `/benji-start?token=${encodeURIComponent(token)}&o=ennu` });
  } catch {
    return NextResponse.json({ error: "Kon geen link maken" }, { status: 500 });
  }
}
