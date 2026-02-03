"use client";

type TypingTextProps = {
  content: string;
  className?: string;
};

/**
 * Toont tekst met een zachte fade-in: verschijnt soepel in plaats van abrupt.
 * Alleen CSS, geen JavaScript timers – stabiel en niet storingsgevoelig.
 */
export function TypingText({ content, className = "" }: TypingTextProps) {
  return <span className={`animate-fade-in ${className}`}>{content}</span>;
}
