"use client";

import { useEffect, useState } from "react";
import { useTrackCtaClick } from "@/components/analytics/useTrackCtaClick";

interface Props {
  href: string;
  buttonLabel: string;
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}

export function KoopKnopLink({ href, buttonLabel, className, style, children }: Props) {
  const trackCtaClick = useTrackCtaClick();

  // Geef bij een link naar de checkout onzichtbaar mee vanaf welke pagina de bezoeker komt
  // (?from=...). Dit reist mee in de URL en kan dus niet door een mobiele browser worden
  // afgekapt — zo telt de server "checkout bereikt" betrouwbaar per LP.
  const [finalHref, setFinalHref] = useState(href);
  useEffect(() => {
    if (href.includes("/betalen") && !href.includes("from=")) {
      const sep = href.includes("?") ? "&" : "?";
      setFinalHref(`${href}${sep}from=${encodeURIComponent(window.location.pathname)}`);
    } else {
      setFinalHref(href);
    }
  }, [href]);

  return (
    <a href={finalHref} onClick={() => trackCtaClick(buttonLabel)} className={className} style={style}>
      {children}
    </a>
  );
}
