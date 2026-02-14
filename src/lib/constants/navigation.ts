import {
  Home,
  Radio,
  Calendar,
  Trophy,
  Users,
  Flag,
  Newspaper,
  BookOpenText,
  Youtube,
  BarChart3,
  MapPin,
  Gamepad2,
  ScrollText,
} from "lucide-react";
import type { NavSection } from "@/types/app";

export const NAV_SECTIONS: NavSection[] = [
  {
    items: [
      { label: "Dashboard", href: "/", icon: Home },
      { label: "Weekend Hub", href: "/weekend", icon: Flag },
      { label: "Race Recap", href: "/recap", icon: ScrollText },
      { label: "Live Session", href: "/live", icon: Radio },
      { label: "Calendar", href: "/calendar", icon: Calendar },
      { label: "Track History", href: "/tracks", icon: MapPin },
      { label: "Teams", href: "/teams", icon: Users },
      { label: "Standings", href: "/standings", icon: Trophy },
      { label: "News", href: "/news", icon: Newspaper },
      { label: "YouTube", href: "/youtube", icon: Youtube },
      { label: "Glossary", href: "/glossary", icon: BookOpenText },
      { label: "Game Setups", href: "/setups", icon: Gamepad2 },
    ],
  },
  {
    title: "Analytics",
    items: [
      { label: "Sessions", href: "/sessions", icon: BarChart3 },
    ],
  },
];
