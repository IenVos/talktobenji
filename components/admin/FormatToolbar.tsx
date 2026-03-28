"use client";

import { useState } from "react";
import { Bold, Italic, Quote, List, ChevronDown } from "lucide-react";

type CtaOption = { key: string; label: string };

type Props = {
  textareaRef: React.RefObject<HTMLTextAreaElement>;
  value: string;
  onChange: (v: string) => void;
  ctaBlocks?: CtaOption[];
};

function restoreScroll(ta: HTMLTextAreaElement, scrollTop: number, fn: () => void) {
  fn();
  requestAnimationFrame(() => { ta.scrollTop = scrollTop; });
}

function wrap(ta: HTMLTextAreaElement, val: string, before: string, after: string, onChange: (v: string) => void) {
  const scrollTop = ta.scrollTop;
  const s = ta.selectionStart, e = ta.selectionEnd;
  const sel = val.slice(s, e) || "tekst";
  const next = val.slice(0, s) + before + sel + after + val.slice(e);
  restoreScroll(ta, scrollTop, () => onChange(next));
  requestAnimationFrame(() => { ta.focus(); ta.setSelectionRange(s + before.length, s + before.length + sel.length); });
}

function prefixLines(ta: HTMLTextAreaElement, val: string, prefix: string, onChange: (v: string) => void) {
  const scrollTop = ta.scrollTop;
  const s = ta.selectionStart, e = ta.selectionEnd;
  const lineStart = val.lastIndexOf("\n", s - 1) + 1;
  const lineEnd = val.indexOf("\n", e);
  const end = lineEnd === -1 ? val.length : lineEnd;
  const chunk = val.slice(lineStart, end);
  const lines = chunk.split("\n");
  const allHave = lines.every(l => l.startsWith(prefix));
  const replaced = lines.map(l => allHave ? l.slice(prefix.length) : prefix + l).join("\n");
  restoreScroll(ta, scrollTop, () => onChange(val.slice(0, lineStart) + replaced + val.slice(end)));
  requestAnimationFrame(() => ta.focus());
}

function setHeading(ta: HTMLTextAreaElement, val: string, prefix: string, onChange: (v: string) => void) {
  const scrollTop = ta.scrollTop;
  const s = ta.selectionStart;
  const lineStart = val.lastIndexOf("\n", s - 1) + 1;
  const lineEnd = val.indexOf("\n", s);
  const end = lineEnd === -1 ? val.length : lineEnd;
  const line = val.slice(lineStart, end);
  const cleaned = line.replace(/^#{1,3} /, "");
  const newLine = line.startsWith(prefix) ? cleaned : prefix + cleaned;
  restoreScroll(ta, scrollTop, () => onChange(val.slice(0, lineStart) + newLine + val.slice(end)));
  requestAnimationFrame(() => ta.focus());
}

export function FormatToolbar({ textareaRef, value, onChange, ctaBlocks }: Props) {
  const btn = "p-1.5 rounded hover:bg-primary-100 text-gray-600 hover:text-primary-700 transition-colors";
  const btnText = "px-1.5 py-1 rounded hover:bg-primary-100 text-gray-600 hover:text-primary-700 transition-colors text-xs font-bold leading-none";
  const ta = () => textareaRef.current!;
  const [ctaOpen, setCtaOpen] = useState(false);

  function insertCta(key?: string) {
    const t = ta();
    const scrollTop = t.scrollTop;
    const s = t.selectionStart;
    const block = key ? `\n\n[cta:${key}]\n\n` : "\n\n[cta]\n\n";
    restoreScroll(t, scrollTop, () => onChange(value.slice(0, s) + block + value.slice(s)));
    requestAnimationFrame(() => { t.focus(); t.setSelectionRange(s + block.length, s + block.length); });
    setCtaOpen(false);
  }

  return (
    <div className="flex items-center gap-0.5 px-2 py-1.5 bg-gray-50 border border-primary-200 rounded-t-lg border-b-0 flex-wrap sticky top-0 z-20 shadow-sm">
      <button type="button" title="Kop 1 (grote titel)" onClick={() => setHeading(ta(), value, "# ", onChange)} className={btnText}>
        H1
      </button>
      <button type="button" title="Kop 2 (sectietitel)" onClick={() => setHeading(ta(), value, "## ", onChange)} className={btnText}>
        H2
      </button>
      <button type="button" title="Kop 3 (subtitel)" onClick={() => setHeading(ta(), value, "### ", onChange)} className={btnText}>
        H3
      </button>
      <div className="w-px h-4 bg-gray-300 mx-1" />
      <button type="button" title="Vet" onClick={() => wrap(ta(), value, "**", "**", onChange)} className={btn}>
        <Bold size={15} />
      </button>
      <button type="button" title="Cursief" onClick={() => wrap(ta(), value, "*", "*", onChange)} className={btn}>
        <Italic size={15} />
      </button>
      <div className="w-px h-4 bg-gray-300 mx-1" />
      <button type="button" title="Quote / citaat" onClick={() => prefixLines(ta(), value, "> ", onChange)} className={btn}>
        <Quote size={15} />
      </button>
      <button type="button" title="Opsomming met puntjes" onClick={() => prefixLines(ta(), value, "- ", onChange)} className={btn}>
        <List size={15} />
      </button>
      <button
        type="button"
        title="Opsomming met blauwe vinkjes"
        onClick={() => prefixLines(ta(), value, "✓ ", onChange)}
        className="p-1.5 rounded hover:bg-primary-100 text-primary-600 hover:text-primary-700 transition-colors text-sm font-bold leading-none"
      >
        ✓
      </button>
      <div className="w-px h-4 bg-gray-300 mx-1" />
      {/* CTA dropdown */}
      <div className="relative">
        <div className="flex items-center">
          <button
            type="button"
            title="Standaard CTA invoegen"
            onClick={() => insertCta()}
            className="px-1.5 py-1 rounded-l hover:bg-amber-100 text-amber-700 hover:text-amber-800 transition-colors text-xs font-bold leading-none"
          >
            CTA
          </button>
          {ctaBlocks && ctaBlocks.length > 0 && (
            <button
              type="button"
              title="Kies een specifieke CTA"
              onClick={() => setCtaOpen((o) => !o)}
              className="px-0.5 py-1 rounded-r hover:bg-amber-100 text-amber-600 hover:text-amber-800 transition-colors"
            >
              <ChevronDown size={11} />
            </button>
          )}
        </div>
        {ctaOpen && ctaBlocks && ctaBlocks.length > 0 && (
          <div className="absolute left-0 top-full mt-1 z-50 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[160px]">
            <button
              type="button"
              onClick={() => insertCta()}
              className="w-full text-left px-3 py-1.5 text-xs text-gray-700 hover:bg-amber-50 hover:text-amber-800"
            >
              Standaard <span className="text-gray-400 font-mono">[cta]</span>
            </button>
            <div className="border-t border-gray-100 my-1" />
            {ctaBlocks.map((c) => (
              <button
                key={c.key}
                type="button"
                onClick={() => insertCta(c.key)}
                className="w-full text-left px-3 py-1.5 text-xs text-gray-700 hover:bg-amber-50 hover:text-amber-800"
              >
                {c.label} <span className="text-gray-400 font-mono text-[10px]">{c.key}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
