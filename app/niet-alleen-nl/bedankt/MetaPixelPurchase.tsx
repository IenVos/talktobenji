"use client";

import { useEffect } from "react";

export function MetaPixelPurchase() {
  useEffect(() => {
    if (typeof window !== "undefined" && typeof (window as any).fbq === "function") {
      (window as any).fbq("track", "Purchase", { currency: "EUR", value: 97 });
    }
    if (typeof window !== "undefined" && typeof (window as any).gtag === "function") {
      (window as any).gtag("event", "conversion", {
        send_to: "AW-11471624930/Tc0WCKDwo5wcEOK1jN4q",
      });
    }
  }, []);

  return null;
}
