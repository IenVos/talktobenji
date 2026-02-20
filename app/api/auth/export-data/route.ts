import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/auth";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
const secret = process.env.CONVEX_AUTH_ADAPTER_SECRET!;

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.userId || !session?.user?.email) {
    return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });
  }

  try {
    const data = await convex.query(api.dataExport.getUserExportData, {
      secret,
      userId: session.userId,
    });

    const lines: string[] = [];
    const hr = "─".repeat(50);

    const formatDate = (iso: string) =>
      new Date(iso).toLocaleDateString("nl-NL", {
        day: "numeric", month: "long", year: "numeric",
        hour: "2-digit", minute: "2-digit",
      });

    lines.push("BENJI — MIJN GEGEVENS");
    lines.push(`Geëxporteerd op: ${formatDate(data.exportedAt)}`);
    lines.push(hr);
    lines.push("");

    // Gesprekken
    lines.push(`GESPREKKEN (${data.gesprekken.length})`);
    lines.push(hr);
    if (data.gesprekken.length === 0) {
      lines.push("Geen gesprekken.");
    } else {
      data.gesprekken.forEach((s, i) => {
        lines.push(`\nGesprek ${i + 1} — ${formatDate(s.startedAt)}${s.topic ? ` · ${s.topic}` : ""}`);
        s.messages.forEach((m) => {
          const wie = m.role === "user" ? "Jij" : "Benji";
          lines.push(`  ${wie}: ${m.content}`);
        });
      });
    }
    lines.push("");

    // Notities
    lines.push(`NOTITIES (${data.notities.length})`);
    lines.push(hr);
    if (data.notities.length === 0) {
      lines.push("Geen notities.");
    } else {
      data.notities.forEach((n) => {
        lines.push(`\n${n.title ? `${n.title} — ` : ""}${formatDate(n.createdAt)}`);
        lines.push(n.content);
      });
    }
    lines.push("");

    // Check-ins
    lines.push(`DAGELIJKSE CHECK-INS (${data.checkIns.length})`);
    lines.push(hr);
    if (data.checkIns.length === 0) {
      lines.push("Geen check-ins.");
    } else {
      data.checkIns.forEach((c) => {
        lines.push(`\n${formatDate(c.createdAt)}`);
        lines.push(`  Hoe voel ik me: ${c.hoe_voel}`);
        lines.push(`  Wat hielp: ${c.wat_hielp}`);
        lines.push(`  Dankbaar voor: ${c.waar_dankbaar}`);
      });
    }
    lines.push("");

    // Doelen
    lines.push(`PERSOONLIJKE DOELEN (${data.doelen.length})`);
    lines.push(hr);
    if (data.doelen.length === 0) {
      lines.push("Geen doelen.");
    } else {
      data.doelen.forEach((g) => {
        lines.push(`  ${g.completed ? "✓" : "○"} ${g.content}`);
      });
    }
    lines.push("");

    // Herinneringen
    lines.push(`HERINNERINGEN (${data.herinneringen.length})`);
    lines.push(hr);
    if (data.herinneringen.length === 0) {
      lines.push("Geen herinneringen.");
    } else {
      data.herinneringen.forEach((m) => {
        const datum = m.memoryDate || formatDate(m.createdAt);
        lines.push(`\n${datum}${m.emotion ? ` · ${m.emotion}` : ""}`);
        lines.push(`  ${m.text}`);
      });
    }
    lines.push("");

    // Stemming
    lines.push(`STEMMING (${data.stemming.length})`);
    lines.push(hr);
    if (data.stemming.length === 0) {
      lines.push("Geen stemmingen.");
    } else {
      data.stemming.forEach((e) => {
        const sterren = "★".repeat(e.mood) + "☆".repeat(5 - e.mood);
        lines.push(`  ${e.date}  ${sterren}${e.note ? `  — ${e.note}` : ""}`);
      });
    }

    lines.push("");
    lines.push(hr);
    lines.push("Dit bestand bevat al je persoonlijke gegevens van Talk To Benji.");

    const text = lines.join("\n");
    const date = new Date().toISOString().slice(0, 10);
    const filename = `benji-mijn-gegevens-${date}.txt`;

    return new NextResponse(text, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Export error:", error);
    return NextResponse.json({ error: "Export mislukt. Probeer het opnieuw." }, { status: 500 });
  }
}
