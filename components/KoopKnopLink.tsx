"use client";

import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

interface Props {
  href: string;
  buttonLabel: string;
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}

export function KoopKnopLink({ href, buttonLabel, className, style, children }: Props) {
  const trackButtonClick = useMutation(api.siteAnalytics.trackButtonClick);

  const handleClick = () => {
    const sessionId = localStorage.getItem("ttb_sid") ?? "";
    const path = window.location.pathname;
    fetch("/api/my-ip")
      .then((r) => r.json())
      .then((d) => {
        trackButtonClick({
          path,
          buttonLabel,
          sessionId,
          ip: d.ip && d.ip !== "unknown" ? d.ip : undefined,
        }).catch(() => {});
      })
      .catch(() => {
        trackButtonClick({ path, buttonLabel, sessionId }).catch(() => {});
      });
  };

  return (
    <a href={href} onClick={handleClick} className={className} style={style}>
      {children}
    </a>
  );
}
