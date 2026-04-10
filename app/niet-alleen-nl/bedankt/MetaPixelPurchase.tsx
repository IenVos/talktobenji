"use client";

import { useEffect } from "react";

export function MetaPixelPurchase() {
  useEffect(() => {
    if (typeof window !== "undefined" && typeof (window as any).fbq === "function") {
      (window as any).fbq("track", "Purchase", { currency: "EUR", value: 97 });
    }
  }, []);

  return null;
}
