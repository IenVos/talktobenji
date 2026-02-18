import { NextResponse, NextRequest } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { Resend } from "resend";
import { rateLimit } from "@/lib/rate-limit";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
const resend = new Resend(process.env.RESEND_API_KEY);
const secret = process.env.CONVEX_AUTH_ADAPTER_SECRET!;
const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.talktobenji.com";

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const { allowed, retryAfterMs } = rateLimit(ip, { maxAttempts: 3, windowMs: 15 * 60 * 1000 });
  if (!allowed) {
    return NextResponse.json(
      { error: "Te veel verzoeken. Probeer het later opnieuw." },
      { status: 429, headers: { "Retry-After": String(Math.ceil(retryAfterMs / 1000)) } }
    );
  }

  try {
    const body = await req.json();
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";

    if (!email) {
      return NextResponse.json({ error: "E-mailadres is verplicht" }, { status: 400 });
    }

    // Genereer token
    const token = crypto.randomUUID() + crypto.randomUUID();
    // Hash het token voor veilige opslag - plaintext token gaat alleen in de e-mail
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
    const expiresAt = Date.now() + 60 * 60 * 1000; // 1 uur

    // Maak reset-token aan in Convex (retourneert null als email niet bestaat)
    const result = await convex.mutation(api.credentials.createPasswordResetToken, {
      secret,
      email,
      token: hashedToken,
      expiresAt,
    });

    // Als email bestaat, stuur reset mail
    if (result) {
      const resetUrl = `${appUrl}/wachtwoord-resetten?token=${token}`;

      await resend.emails.send({
        from: "Talk To Benji <noreply@talktobenji.com>",
        to: email,
        subject: "Wachtwoord resetten — Talk To Benji",
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 16px;">
            <img src="${appUrl}/images/benji-logo-2.png" alt="Benji" width="40" height="40" style="display: block; margin: 0 auto 16px;" />
            <h1 style="font-size: 20px; text-align: center; color: #1a1a2e; margin-bottom: 8px;">Wachtwoord resetten</h1>
            <p style="font-size: 14px; color: #555; text-align: center; line-height: 1.5;">
              Je hebt gevraagd om je wachtwoord te resetten. Klik op de knop hieronder om een nieuw wachtwoord in te stellen.
            </p>
            <div style="text-align: center; margin: 24px 0;">
              <a href="${resetUrl}" style="display: inline-block; padding: 12px 32px; background-color: #6d84a8; color: white; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px;">
                Nieuw wachtwoord instellen
              </a>
            </div>
            <p style="font-size: 12px; color: #999; text-align: center; line-height: 1.5;">
              Deze link is 1 uur geldig. Als je dit niet hebt aangevraagd, kun je deze e-mail negeren.
            </p>
          </div>
        `,
      });
    }

    // Altijd success retourneren (verraad niet of email bestaat)
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Password reset error:", error);
    return NextResponse.json({ error: "Er ging iets mis" }, { status: 500 });
  }
}
