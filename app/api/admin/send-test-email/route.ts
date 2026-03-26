import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { Resend } from "resend";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(req: NextRequest) {
  const { adminToken, toEmail, subject, body } = await req.json();

  if (!adminToken || !toEmail || !subject || !body) {
    return NextResponse.json({ error: "Velden ontbreken" }, { status: 400 });
  }

  // Valideer admin token via Convex
  try {
    await convex.query(api.adminAuth.validateToken, { token: adminToken });
  } catch {
    return NextResponse.json({ error: "Geen toegang" }, { status: 401 });
  }

  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ error: "Resend niet geconfigureerd" }, { status: 500 });
  }

  const voornaam = "Testpersoon";
  const toHtml = (text: string) =>
    text
      .replace(/\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/g, '<a href="$2" style="color:#6d84a8;">$1</a>')
      .replace(/\n/g, "<br/>");

  const bodyHtml = body
    .replace(/{naam}/g, voornaam)
    .split("\n\n")
    .map((p: string) => `<p style="font-size:15px;line-height:1.8;color:#4a5568;">${toHtml(p)}</p>`)
    .join("");

  const resend = new Resend(process.env.RESEND_API_KEY);
  await resend.emails.send({
    from: "Talk To Benji <noreply@talktobenji.com>",
    to: toEmail,
    subject: `[TEST] ${subject.replace("{naam}", voornaam)}`,
    html: `<div style="font-family:system-ui,-apple-system,sans-serif;max-width:560px;margin:0 auto;color:#2d3748;background:#fdf9f4;padding:32px 24px;">
      <p style="font-size:11px;color:#a0aec0;margin-bottom:16px;">— Dit is een testmail —</p>
      <p style="font-size:16px;margin-bottom:8px;">Hi ${voornaam},</p>
      ${bodyHtml}
      <p style="font-size:14px;color:#718096;margin-top:24px;">Vragen? Stuur een mail naar <a href="mailto:contactmetien@talktobenji.com" style="color:#6d84a8;">contactmetien@talktobenji.com</a>.</p>
    </div>`,
  });

  return NextResponse.json({ ok: true });
}
