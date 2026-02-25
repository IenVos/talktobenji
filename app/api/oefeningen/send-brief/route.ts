import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/auth";
import { Resend } from "resend";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const resend = new Resend(process.env.RESEND_API_KEY);
const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.talktobenji.com";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.userId || !session?.user?.email) {
    return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const letter = typeof body?.letter === "string" ? body.letter.trim() : "";
    const addressee = typeof body?.addressee === "string" ? body.addressee.trim() : "";
    const rawPhotoUrl: unknown = body?.photoUrl;
    const photoUrl =
      typeof rawPhotoUrl === "string" && rawPhotoUrl.startsWith("data:image/")
        ? rawPhotoUrl
        : null;

    if (!letter) {
      return NextResponse.json({ error: "Brief ontbreekt" }, { status: 400 });
    }

    // Zet brief om naar HTML paragrafen
    const letterHtml = letter
      .split("\n\n")
      .map((para: string) =>
        `<p style="font-size: 15px; line-height: 1.8; color: #2d3748; margin: 0 0 16px 0;">${para
          .replace(/\n/g, "<br/>")
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
        }</p>`
      )
      .join("\n");

    const photoHtml = photoUrl
      ? `<div style="margin-bottom: 20px;"><img src="${photoUrl}" alt="" width="72" height="72" style="width:72px;height:72px;border-radius:50%;object-fit:cover;display:block;" /></div>`
      : "";

    const html = `
      <div style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 16px; color: #2d3748;">
        <img src="${appUrl}/images/benji-logo-2.png" alt="Benji" width="36" height="36" style="display: block; margin-bottom: 24px;" />
        ${photoHtml}
        <p style="font-size: 13px; color: #718096; margin-bottom: 32px;">Je brief — geschreven via Talk To Benji</p>
        <div style="border-left: 3px solid #c7d4f0; padding: 24px 24px 8px 24px; background: #f7f9ff; border-radius: 0 8px 8px 0; margin-bottom: 32px;">
          ${addressee ? `<p style="font-size: 13px; color: #718096; margin: 0 0 20px 0;">Aan: ${addressee}</p>` : ""}
          ${letterHtml}
        </div>
        <p style="font-size: 13px; color: #a0aec0; line-height: 1.6;">
          Deze brief is alleen voor jou. Je kunt hem bewaren, uitprinten of nog een keer lezen.<br/>
          Met warme groet,<br/><strong>Benji</strong>
        </p>
      </div>
    `;

    await resend.emails.send({
      from: "Talk To Benji <noreply@talktobenji.com>",
      to: session.user.email,
      subject: "Jouw brief — Talk To Benji",
      html,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Send brief error:", error);
    return NextResponse.json({ error: "Er ging iets mis. Probeer het later opnieuw." }, { status: 500 });
  }
}
