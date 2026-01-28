"use client";

interface SpiralIconProps {
  size?: number;
  className?: string;
  spinning?: boolean;
}

export function SpiralIcon({ size = 24, className = "", spinning = false }: SpiralIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={`${spinning ? "animate-spin-slow" : ""} ${className}`}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Spiral path - starts from outside, goes inward */}
      <path
        d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10c4.42 0 8.17-2.88 9.5-6.86"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M12 5c-3.87 0-7 3.13-7 7s3.13 7 7 7c3.17 0 5.85-2.11 6.71-5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4c1.86 0 3.41-1.28 3.86-3"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M12 11c-.55 0-1 .45-1 1s.45 1 1 1 1-.45 1-1"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}
