"use client";

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

  return (
    <a href={href} onClick={() => trackCtaClick(buttonLabel)} className={className} style={style}>
      {children}
    </a>
  );
}
