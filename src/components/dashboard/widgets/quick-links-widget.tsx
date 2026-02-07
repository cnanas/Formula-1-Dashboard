"use client";

import Link from "next/link";
import {
  Radio,
  Trophy,
  Calendar,
  Newspaper,
  GitCompareArrows,
  CircleDot,
  Zap,
  Gauge,
  CloudSun,
  History,
  MapPin,
} from "lucide-react";

const links = [
  { label: "Live", href: "/live", icon: Radio, color: "text-red-500" },
  { label: "Standings", href: "/standings", icon: Trophy, color: "text-yellow-500" },
  { label: "Calendar", href: "/calendar", icon: Calendar, color: "text-blue-500" },
  { label: "News", href: "/news", icon: Newspaper, color: "text-green-500" },
  { label: "Compare", href: "/compare", icon: GitCompareArrows, color: "text-orange-500" },
  { label: "Pit Stops", href: "/pitstops", icon: CircleDot, color: "text-cyan-500" },
  { label: "Overtakes", href: "/overtakes", icon: Zap, color: "text-purple-500" },
  { label: "Speed", href: "/speed-traps", icon: Gauge, color: "text-pink-500" },
  { label: "Weather", href: "/weather", icon: CloudSun, color: "text-sky-500" },
  { label: "History", href: "/history", icon: History, color: "text-amber-500" },
  { label: "Track Map", href: "/live/map", icon: MapPin, color: "text-teal-500" },
];

export function QuickLinksWidget() {
  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className="flex flex-col items-center gap-1.5 p-2.5 rounded-lg hover:bg-muted transition-colors"
        >
          <link.icon className={`h-5 w-5 ${link.color}`} />
          <span className="text-[11px] font-medium text-center leading-tight">
            {link.label}
          </span>
        </Link>
      ))}
    </div>
  );
}
