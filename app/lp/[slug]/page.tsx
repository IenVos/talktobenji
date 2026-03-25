"use client";

import { useParams } from "next/navigation";
import { LandingPageView } from "@/components/LandingPageView";

export default function LandingPage() {
  const params = useParams();
  const rawSlug = params?.slug;
  const slug = typeof rawSlug === "string" ? rawSlug : Array.isArray(rawSlug) ? rawSlug[0] : "";

  return <LandingPageView slug={slug} />;
}
