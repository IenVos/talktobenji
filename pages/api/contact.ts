import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();

  const { naam, email, bericht, _t } = req.body;
  if (!naam || !email || !bericht) return res.status(400).json({ error: "Velden ontbreken" });
  // Spam: honeypot (website-veld) of te snel ingediend (< 3 sec)
  if (req.body.website) return res.status(200).json({ ok: true }); // stil afwijzen
  if (_t && Date.now() - Number(_t) < 3000) return res.status(200).json({ ok: true }); // stil afwijzen

  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  if (!RESEND_API_KEY) return res.status(500).json({ error: "Email niet geconfigureerd" });

  const html = `
    <h2>Nieuw contactformulier bericht</h2>
    <p><strong>Naam:</strong> ${naam}</p>
    <p><strong>E-mail:</strong> ${email}</p>
    <hr />
    <p style="white-space: pre-wrap;">${bericht}</p>
    <hr />
    <p style="color: #666; font-size: 12px;">Reageer op dit bericht om contact op te nemen met ${email}.</p>
  `;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: "Talk To Benji <noreply@talktobenji.com>",
      to: ["contactmetien@talktobenji.com"],
      reply_to: email,
      subject: `Contact: ${naam}`,
      html,
    }),
  });

  if (!response.ok) return res.status(500).json({ error: "Versturen mislukt" });
  return res.status(200).json({ ok: true });
}
