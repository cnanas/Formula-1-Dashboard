import type { LucideIcon } from "lucide-react";
import {
  Home,
  Radio,
  Calendar,
  Trophy,
  Newspaper,
  GitCompareArrows,
  CircleDot,
  Gauge,
  CloudSun,
  MapPin,
  Gamepad2,
} from "lucide-react";

export interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: LucideIcon;
}

// Default order: Home, Live, Calendar, Game Setups, News, Standings, Track History, Compare, Pit Stops, Weather, Game Telemetry (last)
export const DEFAULT_NAV_ORDER: string[] = [
  "home",
  "live",
  "calendar",
  "game-setups",
  "news",
  "standings",
  "track-history",
  "compare",
  "pitstops",
  "weather",
  "game-telemetry",
];

export const NAV_ITEMS: Record<string, NavItem> = {
  home: { id: "home", label: "Home", href: "/", icon: Home },
  live: { id: "live", label: "Live", href: "/live", icon: Radio },
  calendar: { id: "calendar", label: "Calendar", href: "/calendar", icon: Calendar },
  standings: { id: "standings", label: "Standings", href: "/standings", icon: Trophy },
  "game-telemetry": { id: "game-telemetry", label: "Game Telemetry", href: "/game-telemetry", icon: Gauge },
  "game-setups": { id: "game-setups", label: "Game Setups", href: "/setups", icon: Gamepad2 },
  news: { id: "news", label: "News", href: "/news", icon: Newspaper },
  "track-history": { id: "track-history", label: "Track History", href: "/tracks", icon: MapPin },
  compare: { id: "compare", label: "Compare", href: "/compare", icon: GitCompareArrows },
  pitstops: { id: "pitstops", label: "Pit Stops", href: "/pitstops", icon: CircleDot },
  weather: { id: "weather", label: "Weather", href: "/weather", icon: CloudSun },
};

const STORAGE_KEY = "f1dash_nav_order_v1";

export function loadNavOrder(): string[] {
  if (typeof window === "undefined") return DEFAULT_NAV_ORDER;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return DEFAULT_NAV_ORDER;
    const parsed = JSON.parse(stored) as string[];
    if (Array.isArray(parsed) && parsed.length === DEFAULT_NAV_ORDER.length) {
      return parsed;
    }
  } catch {
    // ignore
  }
  return DEFAULT_NAV_ORDER;
}

export function saveNavOrder(order: string[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(order));
  } catch {
    // storage full
  }
}

export function getOrderedNavItems(order: string[]): NavItem[] {
  return order
    .map((id) => NAV_ITEMS[id])
    .filter(Boolean);
}
