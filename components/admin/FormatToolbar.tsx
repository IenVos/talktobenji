"use client";

import { useState, useRef } from "react";
import { Bold, Italic, Quote, List, ChevronDown, Link as LinkIcon } from "lucide-react";

const NA_COLORS = [
  { color: "#6d84a8", label: "Blauw" },
  { color: "#4a7c59", label: "Groen" },
  { color: "#c07a5a", label: "Terra" },
  { color: "#7c6d9e", label: "Paars" },
  { color: "#374151", label: "Donker" },
  { color: "#be185d", label: "Roze" },
];

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
  const [naOpen, setNaOpen] = useState(false);
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const linkInputRef = useRef<HTMLInputElement>(null);
  const savedSel = useRef<{ s: number; e: number }>({ s: 0, e: 0 });

  // Prevent focus loss on toolbar button clicks
  const noFocus = (e: React.MouseEvent) => e.preventDefault();

  function insertAtEnd(t: HTMLTextAreaElement, block: string, afterInsert: () => void) {
    // Als textarea geen focus had, voeg in aan het eind van de tekst
    const s = document.activeElement === t ? t.selectionStart : value.length;
    const next = value.slice(0, s) + block + value.slice(s);
    withScrollLock(t, () => onChange(next), () => {
      t.focus();
      const pos = s + block.length;
      t.setSelectionRange(pos, pos);
      // Scroll textarea zodat de ingevoegde plek zichtbaar is
      const lineHeight = parseInt(getComputedStyle(t).lineHeight) || 18;
      const lines = next.slice(0, pos).split("\n").length;
      t.scrollTop = Math.max(0, lines * lineHeight - t.clientHeight / 2);
      afterInsert();
    });
  }

  function insertCta(key?: string) {
    const t = ta();
    const block = key ? `\n\n[cta:${key}]\n\n` : "\n\n[cta]\n\n";
    insertAtEnd(t, block, () => setCtaOpen(false));
  }

  function insertNietAlleen(color: string) {
    const t = ta();
    const block = `\n\n[niet-alleen:${color}]\n\n`;
    insertAtEnd(t, block, () => setNaOpen(false));
  }

  function insertBenji(type: string) {
    const t = ta();
    const block = `\n\n[benji:${type}]\n\n`;
    insertAtEnd(t, block, () => setBenjiOpen(false));
  }

  function handleLinkMouseDown() {
    // Sla selectie op vóór focus verlies (mousedown treedt op vóór blur)
    const t = textareaRef.current;
    if (t) savedSel.current = { s: t.selectionStart, e: t.selectionEnd };
  }

  function handleLinkOpen() {
    setLinkOpen(o => !o);
    setBenjiOpen(false);
    setCtaOpen(false);
    requestAnimationFrame(() => linkInputRef.current?.focus());
  }

  function confirmLink() {
    if (!linkUrl.trim()) { setLinkOpen(false); return; }
    const t = ta();
    const { s, e } = savedSel.current;
    const sel = value.slice(s, e) || "link";
    const block = `[${sel}](${linkUrl.trim()})`;
    const next = value.slice(0, s) + block + value.slice(e);
    onChange(next);
    setLinkUrl("");
    setLinkOpen(false);
    requestAnimationFrame(() => { t.focus(); t.setSelectionRange(s + block.length, s + block.length); });
  }

  return (
    <>
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
          <button type="button" title="Link invoegen" onMouseDown={handleLinkMouseDown} onClick={handleLinkOpen} className={btn}>
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
                <button key={type} type="button" onMouseDown={noFocus} onClick={() => insertBenji(type)}
                  className="w-full text-left px-3 py-1.5 text-xs text-gray-700 hover:bg-indigo-50 hover:text-indigo-800">
                  {label} <span className="text-gray-400 font-mono text-[10px]">[benji:{type}]</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="w-px h-4 bg-gray-300 mx-1" />

        {/* Niet Alleen CTA dropdown */}
        <div className="relative">
          <button type="button" title="Niet Alleen CTA invoegen" onMouseDown={noFocus}
            onClick={() => { setNaOpen(o => !o); setBenjiOpen(false); setCtaOpen(false); setLinkOpen(false); }}
            className="flex items-center gap-0.5 px-1.5 py-1 rounded hover:bg-rose-100 text-rose-600 hover:text-rose-800 transition-colors text-xs font-bold leading-none">
            Niet Alleen <ChevronDown size={11} />
          </button>
          {naOpen && (
            <div className="absolute left-0 top-full mt-1 z-50 bg-white border border-gray-200 rounded-lg shadow-lg py-1.5 px-2 min-w-[160px]">
              <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1.5 px-1">Kies kleur</p>
              <div className="flex flex-wrap gap-1.5 px-1">
                {NA_COLORS.map(({ color, label }) => (
                  <button
                    key={color}
                    type="button"
                    onMouseDown={noFocus}
                    onClick={() => insertNietAlleen(color)}
                    title={label}
                    className="w-6 h-6 rounded-full border-2 border-white shadow hover:scale-110 transition-transform"
                    style={{ background: color, outline: "1px solid #e5e7eb" }}
                  />
                ))}
              </div>
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
              <button type="button" onMouseDown={noFocus} onClick={() => insertCta()}
                className="w-full text-left px-3 py-1.5 text-xs text-gray-700 hover:bg-amber-50 hover:text-amber-800">
                Standaard <span className="text-gray-400 font-mono">[cta]</span>
              </button>
              <div className="border-t border-gray-100 my-1" />
              {ctaBlocks.map((c) => (
                <button key={c.key} type="button" onMouseDown={noFocus} onClick={() => insertCta(c.key)}
                  className="w-full text-left px-3 py-1.5 text-xs text-gray-700 hover:bg-amber-50 hover:text-amber-800">
                  {c.label} <span className="text-gray-400 font-mono text-[10px]">{c.key}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        {/* Sluit dropdowns bij klik buiten — inside toolbar stacking context zodat z-50 dropdowns erboven blijven */}
        {(ctaOpen || benjiOpen || naOpen || linkOpen) && (
          <div className="fixed inset-0 z-40" onClick={() => { setCtaOpen(false); setBenjiOpen(false); setNaOpen(false); setLinkOpen(false); }} />
        )}
      </div>
    </>
  );
}
