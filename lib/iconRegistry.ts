import {
  BookOpen, BookMarked, Library, Leaf, Sun, Moon,
  MessageCircleHeart, Heart, CalendarHeart, CalendarDays,
  Gem, Sparkles, HandHelping, Music, Headphones, Coffee,
  Feather, Star, type LucideIcon,
} from "lucide-react";

export const ICON_REGISTRY: Record<string, LucideIcon> = {
  BookOpen, BookMarked, Library,
  Leaf, Sun, Moon,
  MessageCircleHeart, Heart,
  CalendarHeart, CalendarDays,
  Gem, Sparkles, HandHelping,
  Music, Headphones, Coffee,
  Feather, Star,
};

export const ICON_OPTIONS = Object.keys(ICON_REGISTRY);

export function getIcon(name: string): LucideIcon {
  return ICON_REGISTRY[name] ?? BookOpen;
}
