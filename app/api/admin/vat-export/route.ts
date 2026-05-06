import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function GET(req: NextRequest) {
  const adminToken = req.headers.get("authorization") ?? "";
  try {
    await convex.query(api.adminAuth.validateToken, { adminToken });
  } catch {
    return NextResponse.json({ error: "Niet geautoriseerd" }, { status: 401 });
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: "Stripe niet geconfigureerd" }, { status: 500 });
  }

  const { searchParams } = new URL(req.url);
  const yearParam = searchParams.get("year");
  const monthParam = searchParams.get("month");

  let createdGte: number;
  let createdLte: number;
  let filenameSuffix: string;

  if (yearParam && monthParam) {
    const year = parseInt(yearParam, 10);
    const month = parseInt(monthParam, 10); // 1-based
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 1);
    createdGte = Math.floor(start.getTime() / 1000);
    createdLte = Math.floor(end.getTime() / 1000);
    filenameSuffix = `${year}-${String(month).padStart(2, "0")}`;
  } else if (yearParam) {
    const year = parseInt(yearParam, 10);
    createdGte = Math.floor(new Date(year, 0, 1).getTime() / 1000);
    createdLte = Math.floor(new Date(year + 1, 0, 1).getTime() / 1000);
    filenameSuffix = `${year}`;
  } else {
    // Laatste 12 maanden
    const now = new Date();
    const past = new Date(now);
    past.setFullYear(past.getFullYear() - 1);
    createdGte = Math.floor(past.getTime() / 1000);
    createdLte = Math.floor(now.getTime() / 1000);
    filenameSuffix = "laatste-12-maanden";
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2025-02-24.acacia" });

  const rows: string[] = [];
  let hasMore = true;
  let startingAfter: string | undefined;

  while (hasMore) {
    const list = await stripe.paymentIntents.list({
      limit: 100,
      created: { gte: createdGte, lte: createdLte },
      ...(startingAfter && { starting_after: startingAfter }),
    });

    for (const pi of list.data) {
      if (pi.status !== "succeeded") continue;
      const m = pi.metadata;

      // Fallback factuurnummer voor betalingen van vóór de BTW-implementatie
      const invoiceNr = m.invoice_number ||
        `TTB-${new Date(pi.created * 1000).getFullYear()}-${pi.id.slice(-6).toUpperCase()}`;

      const datum = new Date(pi.created * 1000).toLocaleDateString("nl-NL", {
        day: "2-digit", month: "2-digit", year: "numeric",
      });
      const land = m.country_code ?? "";
      const vatRatePct = m.vat_rate ? `${Math.round(parseFloat(m.vat_rate) * 100)}` : "";
      const vatAmountEur = m.vat_amount_cents
        ? (parseInt(m.vat_amount_cents, 10) / 100).toFixed(2).replace(".", ",")
        : "";
      const baseEur = m.base_price_cents
        ? (parseInt(m.base_price_cents, 10) / 100).toFixed(2).replace(".", ",")
        : "";
      const totalEur = (pi.amount / 100).toFixed(2).replace(".", ",");
      const zakelijk = m.is_business === "true" ? "Ja" : "Nee";
      const vatNummer = m.vat_number ?? "";

      rows.push(
        [invoiceNr, datum, land, vatRatePct, vatAmountEur, baseEur, totalEur, zakelijk, vatNummer]
          .map((v) => `"${v.replace(/"/g, '""')}"`)
          .join(",")
      );
    }

    hasMore = list.has_more;
    if (list.data.length > 0) {
      startingAfter = list.data[list.data.length - 1].id;
    } else {
      hasMore = false;
    }
  }

  const header = "Factuurnummer,Datum,Land,BTW-tarief (%),BTW-bedrag (€),Nettobedrag (€),Totaalbedrag (€),Zakelijk,BTW-nummer klant";
  const csv = [header, ...rows].join("\r\n");

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="btw-export-${filenameSuffix}.csv"`,
    },
  });
}
