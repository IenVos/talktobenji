"use client";

import { useState, useRef } from "react";
import { Bold, Italic, Quote, List, ChevronDown, Link as LinkIcon } from "lucide-react";

type CtaOption = { key: string; label: string };

type Props = {
  textareaRef: React.RefObject<HTMLTextAreaElement>;
  value: string;
  onChange: (v: string) => void;
  ctaBlocks?: CtaOption[];
};

const BENJI_TYPES = [
  { type: "reflectie", label: "Reflectie" },
  { type: "nacht", label: "Nacht" },
  { type: "herinnering", label: "Herinnering" },
  { type: "landing", label: "Landing" },
  { type: "emotie", label: "Emotie" },
  { type: "checkin", label: "Check-in" },
  { type: "memories", label: "Herinneringen" },
];

// Slaat ta.scrollTop + window.scrollY op vóór fn(), herstelt beide in rAF
function withScrollLock(ta: HTMLTextAreaElement, fn: () => void, after?: () => void) {
  const taScroll = ta.scrollTop;
  const winY = window.scrollY;
  fn();
  requestAnimationFrame(() => {
    ta.scrollTop = taScroll;
    window.scrollTo({ top: winY, behavior: "instant" as ScrollBehavior });
    after?.();
  });
}

function wrap(ta: HTMLTextAreaElement, val: string, before: string, after: string, onChange: (v: string) => void) {
  const s = ta.selectionStart, e = ta.selectionEnd;
  const sel = val.slice(s, e) || "tekst";
  const next = val.slice(0, s) + before + sel + after + val.slice(e);
  withScrollLock(ta, () => onChange(next), () => {
    ta.focus();
    ta.setSelectionRange(s + before.length, s + before.length + sel.length);
  });
}

function prefixLines(ta: HTMLTextAreaElement, val: string, prefix: string, onChange: (v: string) => void) {
  const s = ta.selectionStart, e = ta.selectionEnd;
  const lineStart = val.lastIndexOf("\n", s - 1) + 1;
  const lineEnd = val.indexOf("\n", e);
  const end = lineEnd === -1 ? val.length : lineEnd;
  const chunk = val.slice(lineStart, end);
  const lines = chunk.split("\n");
  const allHave = lines.every(l => l.startsWith(prefix));
  const replaced = lines.map(l => allHave ? l.slice(prefix.length) : prefix + l).join("\n");
  withScrollLock(ta, () => onChange(val.slice(0, lineStart) + replaced + val.slice(end)), () => ta.focus());
}

function setHeading(ta: HTMLTextAreaElement, val: string, prefix: string, onChange: (v: string) => void) {
  const s = ta.selectionStart;
  const lineStart = val.lastIndexOf("\n", s - 1) + 1;
  const lineEnd = val.indexOf("\n", s);
  const end = lineEnd === -1 ? val.length : lineEnd;
  const line = val.slice(lineStart, end);
  const cleaned = line.replace(/^#{1,3} /, "");
  const newLine = line.startsWith(prefix) ? cleaned : prefix + cleaned;
  withScrollLock(ta, () => onChange(val.slice(0, lineStart) + newLine + val.slice(end)), () => ta.focus());
}

export function FormatToolbar({ textareaRef, value, onChange, ctaBlocks }: Props) {
  const btn = "p-1.5 rounded hover:bg-primary-100 text-gray-600 hover:text-primary-700 transition-colors";
  const btnText = "px-1.5 py-1 rounded hover:bg-primary-100 text-gray-600 hover:text-primary-700 transition-colors text-xs font-bold leading-none";
  const ta = () => textareaRef.current!;
  const [ctaOpen, setCtaOpen] = useState(false);
  const [benjiOpen, setBenjiOpen] = useState(false);
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const linkInputRef = useRef<HTMLInputElement>(null);

  // Prevent focus loss on toolbar button clicks
  const noFocus = (e: React.MouseEvent) => e.preventDefault();

  function insertCta(key?: string) {
    const t = ta();
    const s = t.selectionStart;
    const block = key ? `\n\n[cta:${key}]\n\n` : "\n\n[cta]\n\n";
    withScrollLock(t, () => onChange(value.slice(0, s) + block + value.slice(s)), () => {
      t.focus();
      t.setSelectionRange(s + block.length, s + block.length);
    });
    setCtaOpen(false);
  }

  function insertBenji(type: string) {
    const t = ta();
    const s = t.selectionStart;
    const block = `\n\n[benji:${type}]\n\n`;
    withScrollLock(t, () => onChange(value.slice(0, s) + block + value.slice(s)), () => {
      t.focus();
      t.setSelectionRange(s + block.length, s + block.length);
    });
    setBenjiOpen(false);
  }

  function handleLinkOpen(e: React.MouseEvent) {
    // Don't prevent default here — we WANT the input to receive focus
    setLinkOpen(o => !o);
    setBenjiOpen(false);
    setCtaOpen(false);
    requestAnimationFrame(() => linkInputRef.current?.focus());
  }

  function confirmLink() {
    if (!linkUrl.trim()) { setLinkOpen(false); return; }
    const t = ta();
    const s = t.selectionStart, e = t.selectionEnd;
    const sel = value.slice(s, e) || "link";
    const block = `[${sel}](${linkUrl.trim()})`;
    const next = value.slice(0, s) + block + value.slice(e);
    onChange(next);
    setLinkUrl("");
    setLinkOpen(false);
    requestAnimationFrame(() => { t.focus(); t.setSelectionRange(s + block.length, s + block.length); });
  }

  return (
    <div className="relative">
      <div className="flex items-center gap-0.5 px-2 py-1.5 bg-gray-50 border border-primary-200 rounded-t-lg border-b-0 flex-wrap sticky top-0 z-20 shadow-sm">
        {/* Headings */}
        <button type="button" title="Kop 1" onMouseDown={noFocus} onClick={() => setHeading(ta(), value, "# ", onChange)} className={btnText}>H1</button>
        <button type="button" title="Kop 2" onMouseDown={noFocus} onClick={() => setHeading(ta(), value, "## ", onChange)} className={btnText}>H2</button>
        <button type="button" title="Kop 3" onMouseDown={noFocus} onClick={() => setHeading(ta(), value, "### ", onChange)} className={btnText}>H3</button>
        <div className="w-px h-4 bg-gray-300 mx-1" />

        {/* Inline opmaak */}
        <button type="button" title="Vet" onMouseDown={noFocus} onClick={() => wrap(ta(), value, "**", "**", onChange)} className={btn}>
          <Bold size={15} />
        </button>
        <button type="button" title="Cursief" onMouseDown={noFocus} onClick={() => wrap(ta(), value, "*", "*", onChange)} className={btn}>
          <Italic size={15} />
        </button>

        {/* Link */}
        <div className="relative">
          <button type="button" title="Link invoegen" onClick={handleLinkOpen} className={btn}>
            <LinkIcon size={15} />
          </button>
          {linkOpen && (
            <div className="absolute left-0 top-full mt-1 z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-2 flex gap-1.5 min-w-[240px]">
              <input
                ref={linkInputRef}
                type="url"
                value={linkUrl}
                onChange={e => setLinkUrl(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") confirmLink(); if (e.key === "Escape") setLinkOpen(false); }}
                placeholder="https://…"
                className="flex-1 px-2 py-1 text-xs border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-primary-400"
              />
              <button type="button" onClick={confirmLink}
                className="px-2 py-1 bg-primary-600 text-white text-xs rounded hover:bg-primary-700">OK</button>
              <button type="button" onClick={() => setLinkOpen(false)}
                className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded hover:bg-gray-200">×</button>
            </div>
          )}
        </div>

        <div className="w-px h-4 bg-gray-300 mx-1" />

        {/* Lijsten */}
        <button type="button" title="Citaat" onMouseDown={noFocus} onClick={() => prefixLines(ta(), value, "> ", onChange)} className={btn}>
          <Quote size={15} />
        </button>
        <button type="button" title="Opsomming" onMouseDown={noFocus} onClick={() => prefixLines(ta(), value, "- ", onChange)} className={btn}>
          <List size={15} />
        </button>
        <button type="button" title="Vinkjes" onMouseDown={noFocus}
          onClick={() => prefixLines(ta(), value, "✓ ", onChange)}
          className="p-1.5 rounded hover:bg-primary-100 text-primary-600 hover:text-primary-700 transition-colors text-sm font-bold leading-none">
          ✓
        </button>

        <div className="w-px h-4 bg-gray-300 mx-1" />

        {/* Benji dropdown */}
        <div className="relative">
          <button type="button" title="Benji blok invoegen" onMouseDown={noFocus}
            onClick={() => { setBenjiOpen(o => !o); setCtaOpen(false); setLinkOpen(false); }}
            className="flex items-center gap-0.5 px-1.5 py-1 rounded hover:bg-indigo-100 text-indigo-600 hover:text-indigo-800 transition-colors text-xs font-bold leading-none">
            Benji <ChevronDown size={11} />
          </button>
          {benjiOpen && (
            <div className="absolute left-0 top-full mt-1 z-50 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[150px]">
              {BENJI_TYPES.map(({ type, label }) => (
                <button key={type} type="button" onClick={() => insertBenji(type)}
                  className="w-full text-left px-3 py-1.5 text-xs text-gray-700 hover:bg-indigo-50 hover:text-indigo-800">
                  {label} <span className="text-gray-400 font-mono text-[10px]">[benji:{type}]</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="w-px h-4 bg-gray-300 mx-1" />

        {/* CTA dropdown */}
        <div className="relative">
          <div className="flex items-center">
            <button type="button" title="Standaard CTA invoegen" onMouseDown={noFocus}
              onClick={() => insertCta()}
              className="px-1.5 py-1 rounded-l hover:bg-amber-100 text-amber-700 hover:text-amber-800 transition-colors text-xs font-bold leading-none">
              CTA
            </button>
            {ctaBlocks && ctaBlocks.length > 0 && (
              <button type="button" title="Kies CTA" onMouseDown={noFocus}
                onClick={() => { setCtaOpen(o => !o); setBenjiOpen(false); setLinkOpen(false); }}
                className="px-0.5 py-1 rounded-r hover:bg-amber-100 text-amber-600 hover:text-amber-800 transition-colors">
                <ChevronDown size={11} />
              </button>
            )}
          </div>
          {ctaOpen && ctaBlocks && ctaBlocks.length > 0 && (
            <div className="absolute left-0 top-full mt-1 z-50 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[160px]">
              <button type="button" onClick={() => insertCta()}
                className="w-full text-left px-3 py-1.5 text-xs text-gray-700 hover:bg-amber-50 hover:text-amber-800">
                Standaard <span className="text-gray-400 font-mono">[cta]</span>
              </button>
              <div className="border-t border-gray-100 my-1" />
              {ctaBlocks.map((c) => (
                <button key={c.key} type="button" onClick={() => insertCta(c.key)}
                  className="w-full text-left px-3 py-1.5 text-xs text-gray-700 hover:bg-amber-50 hover:text-amber-800">
                  {c.label} <span className="text-gray-400 font-mono text-[10px]">{c.key}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Sluit dropdowns bij klik buiten */}
      {(ctaOpen || benjiOpen || linkOpen) && (
        <div className="fixed inset-0 z-40" onClick={() => { setCtaOpen(false); setBenjiOpen(false); setLinkOpen(false); }} />
      )}
    </div>
  );
}
