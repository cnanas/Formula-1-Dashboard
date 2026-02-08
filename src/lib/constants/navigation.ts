import {
  Home,
  Radio,
  Calendar,
  Trophy,
  Users,
  Newspaper,
  BarChart3,
  GitCompareArrows,
  CircleDot,
  Gauge,
  Zap,
  CloudSun,
  MapPin,
  Gamepad2,
} from "lucide-react";
import type { NavSection } from "@/types/app";

export const NAV_SECTIONS: NavSection[] = [
  {
    items: [
      { label: "Dashboard", href: "/", icon: Home },
      { label: "Live Session", href: "/live", icon: Radio },
      { label: "Calendar", href: "/calendar", icon: Calendar },
      { label: "Track History", href: "/tracks", icon: MapPin },
      { label: "Teams", href: "/teams", icon: Users },
      { label: "Standings", href: "/standings", icon: Trophy },
      { label: "News", href: "/news", icon: Newspaper },
      { label: "Game Setups", href: "/setups", icon: Gamepad2 },
    ],
  },
  {
    title: "Analytics",
    items: [
      { label: "Head to Head", href: "/compare", icon: GitCompareArrows },
      { label: "Pit Stops", href: "/pitstops", icon: CircleDot },
      { label: "Overtakes", href: "/overtakes", icon: Zap },
      { label: "Speed Traps", href: "/speed-traps", icon: Gauge },
      { label: "Weather", href: "/weather", icon: CloudSun },
    ],
  },
];
