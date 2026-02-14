"use client";

import Link from "next/link";
import {
  Flag,
  Radio,
  Trophy,
  Calendar,
  Newspaper,
  BookOpenText,
  ScrollText,
  MapPin,
  type LucideIcon,
} from "lucide-react";

interface QuickLink {
  label: string;
  href: string;
  icon: LucideIcon;
  color: string;
  bgColor: string;
}

const links: QuickLink[] = [
  { label: "Weekend Hub", href: "/weekend", icon: Flag, color: "text-rose-500", bgColor: "bg-rose-500/10" },
  { label: "Live", href: "/live", icon: Radio, color: "text-red-500", bgColor: "bg-red-500/10" },
  { label: "Standings", href: "/standings", icon: Trophy, color: "text-yellow-500", bgColor: "bg-yellow-500/10" },
  { label: "Calendar", href: "/calendar", icon: Calendar, color: "text-blue-500", bgColor: "bg-blue-500/10" },
  { label: "News", href: "/news", icon: Newspaper, color: "text-green-500", bgColor: "bg-green-500/10" },
  { label: "Glossary", href: "/glossary", icon: BookOpenText, color: "text-violet-500", bgColor: "bg-violet-500/10" },
  { label: "Recap", href: "/recap", icon: ScrollText, color: "text-amber-500", bgColor: "bg-amber-500/10" },
  { label: "Track Map", href: "/live/map", icon: MapPin, color: "text-teal-500", bgColor: "bg-teal-500/10" },
];

export function QuickLinksWidget() {
  return (
    <div className="grid grid-cols-4 gap-3">
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-muted/80 transition-all duration-200 group"
        >
          <div className={`p-2.5 rounded-lg ${link.bgColor} group-hover:scale-110 transition-transform duration-200`}>
            <link.icon className={`h-5 w-5 ${link.color}`} />
          </div>
          <span className="text-xs font-medium text-center leading-tight text-muted-foreground group-hover:text-foreground transition-colors">
            {link.label}
          </span>
        </Link>
      ))}
    </div>
  );
}
