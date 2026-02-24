import React from "react";

/**
 * Rendert platte tekst met ondersteuning voor inline links.
 * Gebruik: [link tekst](https://url.com)
 * Regeleinden (\n) worden als <br /> weergegeven.
 */
function renderLine(line: string, lineIndex: number): React.ReactNode {
  const pattern = /\[([^\]]+)\]\(([^)]+)\)/g;
  const nodes: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let keyIndex = 0;

  while ((match = pattern.exec(line)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(line.slice(lastIndex, match.index));
    }
    const href = match[2];
    const isExternal = href.startsWith("http");
    nodes.push(
      <a
        key={keyIndex++}
        href={href}
        {...(isExternal ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        className="text-primary-600 underline hover:text-primary-800 transition-colors"
      >
        {match[1]}
      </a>
    );
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < line.length) {
    nodes.push(line.slice(lastIndex));
  }

  return <React.Fragment key={lineIndex}>{nodes}</React.Fragment>;
}

export function renderRichText(text: string): React.ReactNode {
  const lines = text.split("\n");
  return (
    <>
      {lines.map((line, index) => (
        <React.Fragment key={index}>
          {renderLine(line, index)}
          {index < lines.length - 1 && <br />}
        </React.Fragment>
      ))}
    </>
  );
}
