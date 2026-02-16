import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(request: NextRequest) {
  const session = request.cookies.get("admin_session");

  // Verwijder Convex admin sessie
  if (session?.value) {
    const dotIndex = session.value.indexOf(".");
    if (dotIndex !== -1) {
      const token = session.value.slice(0, dotIndex);
      try {
        await convex.mutation(api.adminAuth.deleteSession, {
          token,
          secret: process.env.ADMIN_SESSION_SECRET || "",
        });
      } catch {
        // Negeer fouten bij het verwijderen
      }
    }
  }

  const response = NextResponse.json({ success: true });
  response.cookies.delete("admin_session");
  return response;
}
