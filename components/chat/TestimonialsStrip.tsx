"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

function Stars({ count }: { count: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <svg
          key={i}
          width="11"
          height="11"
          viewBox="0 0 24 24"
          fill={i <= count ? "#d4a84b" : "none"}
          stroke={i <= count ? "#d4a84b" : "#d1d5db"}
          strokeWidth="2"
        >
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ))}
    </div>
  );
}

export function TestimonialsStrip() {
  const items = useQuery(api.testimonials.listActive, {});

  if (!items || items.length === 0) return null;

  return (
    <div className="w-full mt-5">
      <div
        className="flex gap-2.5 overflow-x-auto pb-1"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {items.map((item) => (
          <div
            key={item._id}
            className="flex-shrink-0 w-48 bg-white/65 backdrop-blur-sm rounded-xl px-3.5 py-3 flex flex-col gap-2"
          >
            <Stars count={item.stars} />
            <p className="text-[11px] leading-relaxed text-gray-700 line-clamp-4">
              &ldquo;{item.quote}&rdquo;
            </p>
            <p className="text-[10px] text-gray-500 font-medium mt-auto">
              — {item.name}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
