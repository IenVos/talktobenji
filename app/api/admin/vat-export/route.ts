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
    const month = parseInt(monthParam, 10);
    createdGte = Math.floor(new Date(year, month - 1, 1).getTime() / 1000);
    createdLte = Math.floor(new Date(year, month, 1).getTime() / 1000);
    filenameSuffix = `${year}-${String(month).padStart(2, "0")}`;
  } else if (yearParam) {
    const year = parseInt(yearParam, 10);
    createdGte = Math.floor(new Date(year, 0, 1).getTime() / 1000);
    createdLte = Math.floor(new Date(year + 1, 0, 1).getTime() / 1000);
    filenameSuffix = `${year}`;
  } else {
    const now = new Date();
    const past = new Date(now);
    past.setFullYear(past.getFullYear() - 1);
    createdGte = Math.floor(past.getTime() / 1000);
    createdLte = Math.floor(now.getTime() / 1000);
    filenameSuffix = "laatste-12-maanden";
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2025-02-24.acacia" });

  // Bouw een map van charge_id → uitbetaling-info via payouts in een ruimere periode
  const chargeToPayoutMap = new Map<string, { payoutId: string; payoutDate: string }>();
  const BUFFER = 14 * 24 * 3600; // 14 dagen buffer (betalingen komen vertraagd binnen)

  let payoutHasMore = true;
  let payoutStartingAfter: string | undefined;
  while (payoutHasMore) {
    const payoutList = await stripe.payouts.list({
      status: "paid",
      created: { gte: createdGte - BUFFER, lte: createdLte + BUFFER },
      limit: 100,
      ...(payoutStartingAfter && { starting_after: payoutStartingAfter }),
    });

    for (const payout of payoutList.data) {
      const payoutDate = new Date(payout.arrival_date * 1000).toLocaleDateString("nl-NL", {
        day: "2-digit", month: "2-digit", year: "numeric",
      });

      let btHasMore = true;
      let btStartingAfter: string | undefined;
      while (btHasMore) {
        const btList = await stripe.balanceTransactions.list({
          payout: payout.id,
          type: "payment",
          limit: 100,
          ...(btStartingAfter && { starting_after: btStartingAfter }),
        });

        for (const bt of btList.data) {
          const sourceId = typeof bt.source === "string" ? bt.source : (bt.source as Stripe.Charge | null)?.id;
          if (sourceId) chargeToPayoutMap.set(sourceId, { payoutId: payout.id, payoutDate });
        }

        btHasMore = btList.has_more;
        btStartingAfter = btList.data.length > 0 ? btList.data[btList.data.length - 1].id : undefined;
        if (!btStartingAfter) btHasMore = false;
      }
    }

    payoutHasMore = payoutList.has_more;
    payoutStartingAfter = payoutList.data.length > 0 ? payoutList.data[payoutList.data.length - 1].id : undefined;
    if (!payoutStartingAfter) payoutHasMore = false;
  }

  // Haal alle geslaagde betalingen op en bouw CSV-rijen
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

      // Zoek uitbetaling op via de charge ID van deze PaymentIntent
      const chargeId = typeof pi.latest_charge === "string"
        ? pi.latest_charge
        : (pi.latest_charge as Stripe.Charge | null)?.id ?? "";
      const payoutInfo = chargeId ? chargeToPayoutMap.get(chargeId) : undefined;
      const uitbetalingId = payoutInfo?.payoutId ?? "";
      const uitbetalingDatum = payoutInfo?.payoutDate ?? "";

      rows.push(
        [invoiceNr, datum, land, vatRatePct, vatAmountEur, baseEur, totalEur, zakelijk, vatNummer, uitbetalingId, uitbetalingDatum]
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

  const header = "Factuurnummer,Datum,Land,BTW-tarief (%),BTW-bedrag (€),Nettobedrag (€),Totaalbedrag (€),Zakelijk,BTW-nummer klant,Uitbetaling ID,Uitbetalingsdatum";
  const csv = [header, ...rows].join("\r\n");

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="btw-export-${filenameSuffix}.csv"`,
    },
  });
}
