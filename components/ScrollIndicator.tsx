"use client";

import { useEffect, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

export function ScrollIndicator() {
  const [showIndicator, setShowIndicator] = useState(false);
  const [isAtBottom, setIsAtBottom] = useState(false);

  useEffect(() => {
    const checkScroll = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight;
      const clientHeight = document.documentElement.clientHeight;

      // Check if at bottom (with 20px threshold)
      const atBottom = scrollHeight - scrollTop - clientHeight <= 20;
      setIsAtBottom(atBottom);

      // Show indicator if not at top (with 100px threshold)
      const notAtTop = scrollTop > 100;
      setShowIndicator(notAtTop || (scrollHeight > clientHeight && scrollTop < 100));
    };

    // Check on mount and on scroll
    checkScroll();
    window.addEventListener("scroll", checkScroll);
    window.addEventListener("resize", checkScroll);

    return () => {
      window.removeEventListener("scroll", checkScroll);
      window.removeEventListener("resize", checkScroll);
    };
  }, []);

  if (!showIndicator) return null;

  const handleClick = () => {
    if (isAtBottom) {
      // Scroll to top
      window.scrollTo({
        top: 0,
        behavior: "smooth"
      });
    } else {
      // Scroll down
      window.scrollBy({
        top: window.innerHeight * 0.8,
        behavior: "smooth"
      });
    }
  };

  return (
    <button
      onClick={handleClick}
      className="fixed bottom-6 right-6 z-50 w-10 h-10 rounded-full border-2 border-gray-300 bg-white/90 backdrop-blur-sm flex items-center justify-center hover:border-gray-400 hover:bg-white transition-all shadow-sm"
      aria-label={isAtBottom ? "Scroll naar boven" : "Scroll naar beneden"}
    >
      {isAtBottom ? (
        <ChevronUp
          size={20}
          className="text-gray-500"
          strokeWidth={2}
        />
      ) : (
        <ChevronDown
          size={20}
          className="text-gray-500"
          strokeWidth={2}
        />
      )}
    </button>
  );
}
