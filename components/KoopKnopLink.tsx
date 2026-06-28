"use client";

import { useTrackCtaClick } from "@/components/analytics/useTrackCtaClick";
import { onthoudBronLp } from "@/components/analytics/bronLp";

interface Props {
  href: string;
  buttonLabel: string;
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}

export function KoopKnopLink({ href, buttonLabel, className, style, children }: Props) {
  const trackCtaClick = useTrackCtaClick();

  // Schone checkout-URL: onthoud de bron-LP in sessionStorage i.p.v. als ?from= in
  // de URL. De checkout leest die uit voor de "checkout bereikt"-meting per LP.
  const handleClick = () => {
    onthoudBronLp(href);
    trackCtaClick(buttonLabel);
  };

  return (
    <a data-lp-cta href={href} onClick={handleClick} className={className} style={style}>
      {children}
    </a>
  );
}
