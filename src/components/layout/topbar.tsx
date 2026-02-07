"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Radio, Menu, Pencil, Check, Calendar, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSessionStatus } from "@/hooks/use-session-status";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MobileNav } from "./mobile-nav";
import { ThemeSelector } from "./theme-selector";
import { usePageTitle } from "@/providers/page-title-provider";
import { useDashboardEdit } from "@/providers/dashboard-edit-provider";
import { useSeason } from "@/providers/season-provider";

const PAGE_TITLES: Record<string, string> = {
  "/": "Dashboard",
  "/live": "Live Session",
  "/live/map": "Track Map",
  "/calendar": "Calendar",
  "/tracks": "Track History",
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
  if (pathname.startsWith("/tracks/")) return "Track History";
  return "Dashboard";
}

export function Topbar() {
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const { isLive, latestSession } = useSessionStatus();
  const { dynamicTitle, subtitle } = usePageTitle();
  const { isEditing, toggleEditing, showEditButton } = useDashboardEdit();
  const { season, setSeason, availableSeasons } = useSeason();
  const recentSeasons = [2026, 2025];
  const olderSeasons = availableSeasons.filter((y) => y < 2025);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Use dynamic title if set, otherwise fall back to static title
  const pageTitle = dynamicTitle ?? getStaticPageTitle(pathname);

  return (
    <header
      className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-background/80 px-4 backdrop-blur-sm"
    >
      <div className="flex items-center gap-3">
        {/* Mobile menu trigger - only render Radix Sheet after mount to avoid hydration mismatch (aria-controls ID) */}
        {mounted ? (
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
        ) : (
          <Button variant="ghost" size="icon" className="md:hidden h-8 w-8" type="button" aria-hidden>
            <Menu className="h-5 w-5" />
          </Button>
        )}

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

      <div className="flex items-center gap-1.5">
        {/* Season: 2026 and 2025 as buttons, older years in dropdown */}
        {mounted ? (
          <>
            {recentSeasons.map((y) => (
              <Button
                key={y}
                variant={season === y ? "default" : "outline"}
                size="sm"
                className="h-8 px-3 text-sm font-medium"
                onClick={() => setSeason(y)}
              >
                {y}
              </Button>
            ))}
            {olderSeasons.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant={recentSeasons.includes(season) ? "outline" : "default"}
                    size="sm"
                    className="h-8 gap-1.5 text-sm font-medium border-border/50"
                  >
                    <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                    {recentSeasons.includes(season)
                      ? "Older"
                      : `Season ${season}`}
                    <ChevronDown className="h-3.5 w-3.5 opacity-70" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {olderSeasons.map((y) => (
                    <DropdownMenuItem
                      key={y}
                      onClick={() => setSeason(y)}
                    >
                      Season {y}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </>
        ) : (
          <div className="h-8 px-3 flex items-center gap-1.5 text-sm font-medium border border-border/50 rounded-md bg-background">
            <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-muted-foreground">{season}</span>
          </div>
        )}

        {/* Edit Dashboard button - only shown on dashboard page */}
        {showEditButton && (
          <Button
            variant={isEditing ? "default" : "outline"}
            size="sm"
            className="h-8"
            onClick={toggleEditing}
          >
            {isEditing ? (
              <>
                <Check className="h-4 w-4 mr-1.5" />
                Done
              </>
            ) : (
              <>
                <Pencil className="h-4 w-4 mr-1.5" />
                Edit
              </>
            )}
          </Button>
        )}

        {/* Theme selector for dynamic backgrounds */}
        <ThemeSelector />
      </div>
    </header>
  );
}
