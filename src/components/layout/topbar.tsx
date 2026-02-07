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
    <header className="sticky top-0 z-30 overflow-hidden">
      {/* Thin accent stripe at top */}
      <div
        className="h-0.5 w-full shrink-0"
        style={{
          background:
            "linear-gradient(90deg, var(--primary) 0%, color-mix(in oklch, var(--primary) 70%, transparent) 100%)",
        }}
      />
      <div className="flex h-16 items-center justify-between border-b border-border/60 bg-background/90 px-4 shadow-sm backdrop-blur-md sm:px-6">
        <div className="flex min-w-0 items-center gap-4">
          {/* Mobile menu trigger - only render Radix Sheet after mount to avoid hydration mismatch (aria-controls ID) */}
          {mounted ? (
            <Sheet>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden h-9 w-9 shrink-0 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 p-0">
                <SheetTitle className="sr-only">Navigation</SheetTitle>
                <MobileNav />
              </SheetContent>
            </Sheet>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden h-9 w-9 shrink-0 rounded-lg"
              type="button"
              aria-hidden
            >
              <Menu className="h-5 w-5" />
            </Button>
          )}

          <div className="flex min-w-0 flex-col gap-0.5">
            <h1 className="truncate text-xl font-semibold tracking-tight text-foreground">
              {pageTitle}
            </h1>
            {subtitle && (
              <span className="truncate text-xs text-muted-foreground">
                {subtitle}
              </span>
            )}
          </div>

          {/* Live session indicator */}
          {isLive && latestSession && (
            <Badge
              variant="destructive"
              className="ml-1 flex shrink-0 items-center gap-1.5 animate-pulse rounded-full px-2.5 py-0.5 text-xs font-medium shadow-sm"
            >
              <Radio className="h-3 w-3" />
              LIVE: {latestSession.session_name}
            </Badge>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {/* Season selector: pill group */}
          {mounted ? (
            <div className="flex items-center rounded-lg border border-border/50 bg-muted/30 p-0.5">
              {recentSeasons.map((y) => (
                <Button
                  key={y}
                  variant={season === y ? "secondary" : "ghost"}
                  size="sm"
                  className="h-8 min-w-[2.75rem] rounded-md px-3 text-sm font-medium transition-colors"
                  onClick={() => setSeason(y)}
                >
                  {y}
                </Button>
              ))}
              {olderSeasons.length > 0 && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant={recentSeasons.includes(season) ? "ghost" : "secondary"}
                      size="sm"
                      className="h-8 gap-1.5 rounded-md border-0 px-2.5 text-sm font-medium"
                    >
                      <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                      {recentSeasons.includes(season)
                        ? "Older"
                        : season}
                      <ChevronDown className="h-3.5 w-3.5 opacity-70" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="min-w-[8rem]">
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
            </div>
          ) : (
            <div className="flex h-8 items-center gap-1.5 rounded-lg border border-border/50 bg-muted/30 px-3 text-sm font-medium text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" />
              {season}
            </div>
          )}

          {/* Divider before actions */}
          <div className="h-6 w-px bg-border/60" aria-hidden />

          {/* Edit + Theme */}
          <div className="flex items-center gap-1">
            {showEditButton && (
              <Button
                variant={isEditing ? "default" : "outline"}
                size="sm"
                className="h-8 gap-1.5 rounded-lg border-border/60 font-medium shadow-sm"
                onClick={toggleEditing}
              >
                {isEditing ? (
                  <>
                    <Check className="h-4 w-4" />
                    Done
                  </>
                ) : (
                  <>
                    <Pencil className="h-4 w-4" />
                    Edit
                  </>
                )}
              </Button>
            )}
            <ThemeSelector />
          </div>
        </div>
      </div>
    </header>
  );
}
