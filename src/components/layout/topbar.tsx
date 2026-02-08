"use client";

import { useState, useEffect, useMemo } from "react";
import { usePathname } from "next/navigation";
import { Radio, Pencil, Check, Calendar, ChevronDown, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSessionStatus } from "@/hooks/use-session-status";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ThemeSelector } from "./theme-selector";
import { usePageTitle } from "@/providers/page-title-provider";
import { useDashboardEdit } from "@/providers/dashboard-edit-provider";
import { useSeason } from "@/providers/season-provider";
import { useTeamFilter } from "@/providers/team-filter-provider";
import { useCircuitTheme } from "@/providers/circuit-theme-provider";
import Image from "next/image";
import { useOpenF1 } from "@/hooks/use-openf1";
import { getTeamLogoUrl } from "@/lib/constants/team-logos";

const PAGE_TITLES: Record<string, string> = {
  "/": "Dashboard",
  "/live": "Live Session",
  "/live/map": "Track Map",
  "/calendar": "Calendar",
  "/tracks": "Track History",
  "/teams": "Teams",
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
  if (pathname.startsWith("/teams/") && pathname !== "/teams") return "Teams";
  return "Dashboard";
}

export function Topbar() {
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const { isLive, latestSession } = useSessionStatus();
  const { dynamicTitle, subtitle } = usePageTitle();
  const { isEditing, toggleEditing, showEditButton } = useDashboardEdit();
  const { season, setSeason, availableSeasons } = useSeason();
  const { selectedTeam, setSelectedTeam } = useTeamFilter();
  const { theme, themeMode, setTeamTheme, resetToDefault } = useCircuitTheme();
  const recentSeasons = [2026, 2025];
  const olderSeasons = availableSeasons.filter((y) => y < 2025);

  const { data: raceSessions } = useOpenF1("sessions", {
    year: season,
    session_type: "Race",
  });
  const latestRaceSession = useMemo(() => {
    const completed = raceSessions.filter((s) => new Date(s.date_start) < new Date());
    if (completed.length > 0) {
      return completed.sort((a, b) => new Date(b.date_start).getTime() - new Date(a.date_start).getTime())[0];
    }
    return undefined;
  }, [raceSessions]);

  // If selected season has no completed races (e.g. 2026 pre-season), fall back to previous season for teams
  const fallbackSeason = useMemo(() => {
    if (latestRaceSession) return null;
    const prev = availableSeasons.find((y) => y < season);
    return prev ?? null;
  }, [latestRaceSession, season, availableSeasons]);

  const { data: fallbackSessions } = useOpenF1(
    "sessions",
    { year: fallbackSeason ?? 0, session_type: "Race" },
    { enabled: !!fallbackSeason }
  );
  const fallbackSession = useMemo(() => {
    if (!fallbackSeason || !fallbackSessions?.length) return undefined;
    const completed = fallbackSessions.filter((s) => new Date(s.date_start) < new Date());
    return completed.sort((a, b) => new Date(b.date_start).getTime() - new Date(a.date_start).getTime())[0];
  }, [fallbackSeason, fallbackSessions]);

  const sessionKey = (latestRaceSession ?? fallbackSession)?.session_key?.toString();

  const { data: drivers } = useOpenF1("drivers", { session_key: sessionKey }, { enabled: !!sessionKey });

  const teams = useMemo(() => {
    const names = [...new Set(drivers.map((d) => d.team_name).filter(Boolean))];
    return names.sort((a, b) => a.localeCompare(b));
  }, [drivers]);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Sync theme when team filter is set (including when restored from localStorage)
  useEffect(() => {
    if (selectedTeam) {
      setTeamTheme(selectedTeam);
    }
    // "All teams" -> reset is handled in onValueChange only (avoids reset on initial null before hydration)
  }, [selectedTeam]);

  const pageTitle = dynamicTitle ?? getStaticPageTitle(pathname);
  const teamLogoUrl = selectedTeam ? getTeamLogoUrl(selectedTeam) : null;
  const [logoError, setLogoError] = useState(false);
  useEffect(() => {
    setLogoError(false);
  }, [selectedTeam]);

  return (
    <header className="sticky top-0 z-30 overflow-hidden">
      {/* Thin accent stripe - uses theme color when team/circuit theme is active */}
      <div
        className="h-0.5 w-full shrink-0 transition-colors duration-500"
        style={{
          background:
            themeMode !== "default"
              ? `linear-gradient(90deg, ${theme.primaryColor} 0%, ${theme.primaryColor}dd 50%, color-mix(in oklch, ${theme.primaryColor} 70%, transparent) 100%)`
              : "linear-gradient(90deg, var(--primary) 0%, color-mix(in oklch, var(--primary) 70%, transparent) 100%)",
        }}
      />
      <div className="flex h-14 items-center justify-between border-b border-border/60 bg-background/90 px-3 shadow-sm backdrop-blur-md sm:h-16 sm:px-6">
        <div className="flex min-w-0 items-center gap-2 sm:gap-4">
          {/* Mobile: title/team name is the team selector trigger */}
          <div className="flex min-w-0 sm:hidden">
            {mounted ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="flex min-w-0 items-center gap-2 rounded-lg p-1 -ml-1 text-left hover:bg-muted/50 active:bg-muted transition-colors w-full"
                    aria-label="Select team"
                  >
                    {selectedTeam && teamLogoUrl && !logoError ? (
                      <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-md bg-muted">
                        <Image
                          src={teamLogoUrl}
                          alt=""
                          width={32}
                          height={32}
                          className="object-contain p-0.5"
                          unoptimized
                          onError={() => setLogoError(true)}
                        />
                      </div>
                    ) : null}
                    <div className="flex min-w-0 flex-col gap-0">
                      <span className="flex items-center gap-1 truncate text-base font-semibold tracking-tight text-foreground">
                        {selectedTeam ?? "All teams"}
                        <ChevronDown className="h-4 w-4 shrink-0 opacity-60" />
                      </span>
                      <span className="truncate text-xs text-muted-foreground">
                        {pageTitle}
                      </span>
                    </div>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="max-h-[70vh] overflow-y-auto w-56">
                  <DropdownMenuItem
                    onClick={() => {
                      setSelectedTeam(null);
                      resetToDefault();
                    }}
                  >
                    <Users className="h-4 w-4 mr-2 text-muted-foreground" />
                    All teams
                  </DropdownMenuItem>
                  {teams.map((team) => (
                    <DropdownMenuItem
                      key={team}
                      onClick={() => {
                        setSelectedTeam(team);
                        setTeamTheme(team);
                      }}
                    >
                      <span className="flex items-center gap-2">
                        {getTeamLogoUrl(team) ? (
                          <span className="relative h-5 w-5 shrink-0 overflow-hidden rounded">
                            <Image
                              src={getTeamLogoUrl(team)!}
                              alt=""
                              width={20}
                              height={20}
                              className="object-contain"
                              unoptimized
                            />
                          </span>
                        ) : (
                          <span className="h-5 w-5 rounded bg-muted flex items-center justify-center text-[10px] font-bold text-muted-foreground shrink-0">
                            {team.slice(0, 2)}
                          </span>
                        )}
                        {team}
                      </span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex min-w-0 flex-col gap-0 py-1">
                <span className="truncate text-base font-semibold tracking-tight text-foreground">
                  {selectedTeam ? `${selectedTeam} · ${pageTitle}` : pageTitle}
                </span>
              </div>
            )}
          </div>

          {/* Desktop: title + optional logo (not a trigger) */}
          <div className="hidden sm:flex min-w-0 items-center gap-2 sm:gap-3">
            {selectedTeam && (
              <div className="relative h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted flex">
                {teamLogoUrl && !logoError ? (
                  <Image
                    src={teamLogoUrl}
                    alt={selectedTeam}
                    width={36}
                    height={36}
                    className="object-contain p-1"
                    unoptimized
                    onError={() => setLogoError(true)}
                  />
                ) : (
                  <span className="text-xs font-bold text-muted-foreground">
                    {selectedTeam.slice(0, 2).toUpperCase()}
                  </span>
                )}
              </div>
            )}
            <div className="flex min-w-0 flex-col gap-0.5">
              <h1 className="truncate text-base font-semibold tracking-tight text-foreground sm:text-xl">
                {selectedTeam ? `${selectedTeam} · ${pageTitle}` : pageTitle}
              </h1>
              {subtitle && (
                <span className="truncate text-xs text-muted-foreground">
                  {subtitle}
                </span>
              )}
            </div>
          </div>

          {/* Live session indicator */}
          {isLive && latestSession && (
            <Badge
              variant="destructive"
              className="ml-1 hidden shrink-0 items-center gap-1.5 animate-pulse rounded-full px-2.5 py-0.5 text-xs font-medium shadow-sm sm:flex"
            >
              <Radio className="h-3 w-3" />
              LIVE: {latestSession.session_name}
            </Badge>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          {/* Season selector: pill group - compact on mobile */}
          {mounted ? (
            <div className="flex items-center rounded-lg border border-border/50 bg-muted/30 p-0.5">
              {recentSeasons.map((y) => (
                <Button
                  key={y}
                  variant={season === y ? "secondary" : "ghost"}
                  size="sm"
                  className="h-7 min-w-[2.5rem] rounded-md px-2 text-xs font-medium transition-colors sm:h-8 sm:min-w-[2.75rem] sm:px-3 sm:text-sm"
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
                      className="h-7 gap-1 rounded-md border-0 px-2 text-xs font-medium sm:h-8 sm:gap-1.5 sm:px-2.5 sm:text-sm"
                    >
                      <Calendar className="h-3 w-3 text-muted-foreground sm:h-3.5 sm:w-3.5" />
                      <span className="hidden sm:inline">
                        {recentSeasons.includes(season) ? "Older" : season}
                      </span>
                      <ChevronDown className="h-3 w-3 opacity-70 sm:h-3.5 sm:w-3.5" />
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
            <div className="flex h-7 items-center gap-1 rounded-lg border border-border/50 bg-muted/30 px-2 text-xs font-medium text-muted-foreground sm:h-8 sm:gap-1.5 sm:px-3 sm:text-sm">
              <Calendar className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              {season}
            </div>
          )}

          {/* Team filter - hidden on mobile */}
          {mounted && (
            <Select
              value={selectedTeam ?? "all"}
              onValueChange={(v) => {
                const team = v === "all" ? null : v;
                setSelectedTeam(team);
                if (team) {
                  setTeamTheme(team);
                } else {
                  resetToDefault();
                }
              }}
            >
              <SelectTrigger className="hidden h-8 w-[140px] gap-1.5 rounded-lg border-border/50 bg-muted/30 text-sm font-medium sm:flex">
                <Users className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <SelectValue placeholder="Team" />
              </SelectTrigger>
              <SelectContent align="end">
                <SelectItem value="all">All teams</SelectItem>
                {teams.map((team) => (
                  <SelectItem key={team} value={team}>
                    {team}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* Divider before actions - hidden on mobile */}
          <div className="hidden h-6 w-px bg-border/60 sm:block" aria-hidden />

          {/* Edit + Theme */}
          <div className="flex items-center gap-1">
            {showEditButton && (
              <Button
                variant={isEditing ? "default" : "outline"}
                size="icon"
                className="h-7 w-7 rounded-lg border-border/60 shadow-sm sm:h-8 sm:w-auto sm:gap-1.5 sm:px-3"
                onClick={toggleEditing}
              >
                {isEditing ? (
                  <>
                    <Check className="h-4 w-4" />
                    <span className="hidden sm:inline">Done</span>
                  </>
                ) : (
                  <>
                    <Pencil className="h-4 w-4" />
                    <span className="hidden sm:inline">Edit</span>
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
