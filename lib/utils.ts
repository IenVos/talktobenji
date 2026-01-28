import { type ClassValue, clsx } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return inputs.filter(Boolean).join(" ");
}

export function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString("nl-NL", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString("nl-NL", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDateTime(timestamp: number): string {
  return `${formatDate(timestamp)} ${formatTime(timestamp)}`;
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

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + "...";
}

export function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}
