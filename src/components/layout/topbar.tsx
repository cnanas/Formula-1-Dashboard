"use client";

import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { Moon, Sun, Radio, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSessionStatus } from "@/hooks/use-session-status";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";
import { MobileNav } from "./mobile-nav";
import { usePageTitle } from "@/providers/page-title-provider";

const PAGE_TITLES: Record<string, string> = {
  "/": "Dashboard",
  "/live": "Live Session",
  "/live/map": "Track Map",
  "/calendar": "Calendar",
  "/standings": "Standings",
  "/news": "News",
  "/compare": "Head to Head",
  "/pitstops": "Pit Stop Analytics",
  "/overtakes": "Overtake Tracker",
  "/speed-traps": "Speed Traps",
  "/weather": "Weather",
  "/history": "History",
};

function getStaticPageTitle(pathname: string): string {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname];
  if (pathname.includes("/strategy")) return "Tire Strategy";
  if (pathname.includes("/race/")) return "Race Analysis";
  if (pathname.includes("/results/")) return "Results";
  return "Dashboard";
}

export function Topbar() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const { isLive, latestSession } = useSessionStatus();
  const { dynamicTitle, subtitle } = usePageTitle();
  
  // Use dynamic title if set, otherwise fall back to static title
  const pageTitle = dynamicTitle ?? getStaticPageTitle(pathname);

  return (
    <header
      className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-background/80 px-4 backdrop-blur-sm"
    >
      <div className="flex items-center gap-3">
        {/* Mobile menu trigger */}
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden h-8 w-8">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <SheetTitle className="sr-only">Navigation</SheetTitle>
            <MobileNav />
          </SheetContent>
        </Sheet>

        <div className="flex flex-col">
          <h1 className="text-lg font-semibold leading-tight">{pageTitle}</h1>
          {subtitle && (
            <span className="text-xs text-muted-foreground">{subtitle}</span>
          )}
        </div>

        {/* Live session indicator */}
        {isLive && latestSession && (
          <Badge
            variant="destructive"
            className="flex items-center gap-1.5 animate-pulse"
          >
            <Radio className="h-3 w-3" />
            <span className="text-xs font-medium">
              LIVE: {latestSession.session_name}
            </span>
          </Badge>
        )}
      </div>

      <div className="flex items-center gap-2">
        {/* Theme toggle */}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </div>
    </header>
  );
}
