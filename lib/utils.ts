/** Maak een lichtere tint van een hex-kleur (voor achtergrond) */
export function hexToLightTint(hex: string, mixPercent = 12): string {
  const h = hex.replace("#", "");
  if (h.length !== 6) return hex;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  const mix = mixPercent / 100;
  const nr = Math.round(r * mix + 255 * (1 - mix));
  const ng = Math.round(g * mix + 255 * (1 - mix));
  const nb = Math.round(b * mix + 255 * (1 - mix));
  return `#${nr.toString(16).padStart(2, "0")}${ng.toString(16).padStart(2, "0")}${nb.toString(16).padStart(2, "0")}`;
}

export function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString("nl-NL", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "Zojuist";
  if (minutes < 60) return `${minutes} min geleden`;
  if (hours < 24) return `${hours} uur geleden`;
  if (days < 7) return `${days} dagen geleden`;

  return formatDate(timestamp);
}
