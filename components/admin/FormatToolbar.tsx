"use client";

import { Bold, Italic, Quote, List } from "lucide-react";

type Props = {
  textareaRef: React.RefObject<HTMLTextAreaElement>;
  value: string;
  onChange: (v: string) => void;
};

function wrap(ta: HTMLTextAreaElement, val: string, before: string, after: string, onChange: (v: string) => void) {
  const s = ta.selectionStart, e = ta.selectionEnd;
  const sel = val.slice(s, e) || "tekst";
  const next = val.slice(0, s) + before + sel + after + val.slice(e);
  onChange(next);
  setTimeout(() => { ta.focus(); ta.setSelectionRange(s + before.length, s + before.length + sel.length); }, 0);
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
  onChange(val.slice(0, lineStart) + replaced + val.slice(end));
  setTimeout(() => ta.focus(), 0);
}

function setHeading(ta: HTMLTextAreaElement, val: string, prefix: string, onChange: (v: string) => void) {
  const s = ta.selectionStart;
  const lineStart = val.lastIndexOf("\n", s - 1) + 1;
  const lineEnd = val.indexOf("\n", s);
  const end = lineEnd === -1 ? val.length : lineEnd;
  const line = val.slice(lineStart, end);
  const cleaned = line.replace(/^#{1,3} /, "");
  const newLine = line.startsWith(prefix) ? cleaned : prefix + cleaned;
  onChange(val.slice(0, lineStart) + newLine + val.slice(end));
  setTimeout(() => ta.focus(), 0);
}

export function FormatToolbar({ textareaRef, value, onChange }: Props) {
  const btn = "p-1.5 rounded hover:bg-primary-100 text-gray-600 hover:text-primary-700 transition-colors";
  const btnText = "px-1.5 py-1 rounded hover:bg-primary-100 text-gray-600 hover:text-primary-700 transition-colors text-xs font-bold leading-none";
  const ta = () => textareaRef.current!;

  return (
    <div className="flex items-center gap-0.5 px-2 py-1.5 bg-gray-50 border border-primary-200 rounded-t-lg border-b-0 flex-wrap">
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
    </div>
  );
}
