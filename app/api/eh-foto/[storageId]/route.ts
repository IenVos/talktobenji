import { NextResponse } from "next/server";
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";

/**
 * Proxy voor foto's uit de Even Houvast-brief. De brief-mail verwijst naar
 * https://www.talktobenji.com/api/eh-foto/<storageId> in plaats van de rauwe
 * convex.cloud-URL, zodat de afbeeldingen op het verzenddomein staan (Gmail/Resend
 * markeren "vreemde" image-hosts anders als verdacht). We halen de bytes hier op en
 * serveren ze vanaf het eigen domein, dus zonder redirect-hop naar convex.cloud.
 */
export async function GET(
  _req: Request,
  { params }: { params: { storageId: string } }
) {
  const { storageId } = params;
  if (!storageId) return new NextResponse("Not found", { status: 404 });

  const url = await fetchQuery(api.houvast.getEhFotoUrl, { storageId }).catch(() => null);
  if (!url) return new NextResponse("Not found", { status: 404 });

  const upstream = await fetch(url).catch(() => null);
  if (!upstream || !upstream.ok) return new NextResponse("Not found", { status: 404 });

  const buffer = await upstream.arrayBuffer();
  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type": upstream.headers.get("Content-Type") ?? "image/jpeg",
      // Foto's veranderen niet: lang cachen zodat mailclients ze snel laden.
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
