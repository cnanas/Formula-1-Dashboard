import type { LucideIcon } from "lucide-react";
import {
  Home,
  Flag,
  Radio,
  Calendar,
  Trophy,
  Newspaper,
  BookOpenText,
  Youtube,
  Gauge,
  MapPin,
  Gamepad2,
  BarChart3,
} from "lucide-react";

export interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: LucideIcon;
}

// Default order for bottom navigation
export const DEFAULT_NAV_ORDER: string[] = [
  "home",
  "weekend",
  "live",
  "calendar",
  "game-setups",
  "news",
  "youtube",
  "glossary",
  "standings",
  "track-history",
  "sessions",
  "game-telemetry",
];

export const NAV_ITEMS: Record<string, NavItem> = {
  home: { id: "home", label: "Home", href: "/", icon: Home },
  weekend: { id: "weekend", label: "Weekend", href: "/weekend", icon: Flag },
  live: { id: "live", label: "Live", href: "/live", icon: Radio },
  calendar: { id: "calendar", label: "Calendar", href: "/calendar", icon: Calendar },
  standings: { id: "standings", label: "Standings", href: "/standings", icon: Trophy },
  "game-telemetry": { id: "game-telemetry", label: "Game Telemetry", href: "/game-telemetry", icon: Gauge },
  "game-setups": { id: "game-setups", label: "Game Setups", href: "/setups", icon: Gamepad2 },
  news: { id: "news", label: "News", href: "/news", icon: Newspaper },
  youtube: { id: "youtube", label: "YouTube", href: "/youtube", icon: Youtube },
  glossary: { id: "glossary", label: "Glossary", href: "/glossary", icon: BookOpenText },
  "track-history": { id: "track-history", label: "Track History", href: "/tracks", icon: MapPin },
  sessions: { id: "sessions", label: "Sessions", href: "/sessions", icon: BarChart3 },
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
