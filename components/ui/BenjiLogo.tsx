"use client";

interface BenjiLogoProps {
  size?: number;
  className?: string;
}

export function BenjiLogo({ size = 40, className = "" }: BenjiLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 512 512"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Circle */}
      <circle cx="256" cy="256" r="220" fill="none" stroke="currentColor" strokeWidth="6"/>
      
      {/* Stylized calligraphic letter B */}
      <g fill="none" stroke="currentColor" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round">
        {/* Main vertical stem with extended bottom */}
        <path d="M 200 100
                 L 200 400"/>
        
        {/* Top flourish - elongated sweeping loop */}
        <path d="M 200 100
                 C 200 80, 220 70, 240 85
                 C 260 100, 270 130, 260 160
                 C 250 180, 230 190, 220 180
                 C 210 170, 200 150, 200 130"/>
        
        {/* Top bowl of B */}
        <path d="M 200 130
                 C 200 150, 220 160, 240 150
                 C 260 140, 270 120, 260 100
                 C 250 90, 230 100, 220 110
                 C 210 120, 200 130, 200 150"/>
        
        {/* Lower bowl of B */}
        <path d="M 200 220
                 C 200 240, 220 250, 240 240
                 C 260 230, 270 210, 260 190
                 C 250 180, 230 190, 220 200
                 C 210 210, 200 220, 200 240"/>
      </g>
      
      {/* Decorative dot near bottom of extended stem */}
      <circle cx="200" cy="400" r="6" fill="currentColor"/>
    </svg>
  );
}
