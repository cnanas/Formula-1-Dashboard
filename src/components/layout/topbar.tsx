"use client";

import { useState, useEffect, useMemo } from "react";
import { usePathname } from "next/navigation";
import { Radio, Pencil, Check, Calendar, ChevronDown, Users, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSessionStatus } from "@/hooks/use-session-status";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeSelector } from "./theme-selector";
import { usePageTitle } from "@/providers/page-title-provider";
import { useDashboardEdit } from "@/providers/dashboard-edit-provider";
import { useSeason } from "@/providers/season-provider";
import { useTeamFilter } from "@/providers/team-filter-provider";
import { useCircuitTheme } from "@/providers/circuit-theme-provider";
import Image from "next/image";
import { useOpenF1 } from "@/hooks/use-openf1";
import { getTeamLogoUrl } from "@/lib/constants/team-logos";
import { F1_APPLE_TV_US_URL } from "@/lib/constants/watch";
import { getCircuitTheme } from "@/lib/constants/circuits";
import { getCountryFlagCode } from "@/lib/constants/country-codes";
import type { Session } from "@/types/openf1";

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

function formatCountdown(targetDate: Date): string {
  const now = new Date();
  const diff = targetDate.getTime() - now.getTime();
  if (diff <= 0) return "0d 0h 0m 0s";
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);
  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  parts.push(`${hours}h`);
  parts.push(`${minutes}m`);
  parts.push(`${seconds}s`);
  return parts.join(" ");
}

function HeaderCountdown({ targetDate }: { targetDate: Date }) {
  const [str, setStr] = useState(() => formatCountdown(targetDate));
  useEffect(() => {
    const tick = () => setStr(formatCountdown(targetDate));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [targetDate]);
  return <span className="tabular-nums font-medium">{str}</span>;
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

  // Next race/event: upcoming meeting + first upcoming session
  const { data: meetings } = useOpenF1("meetings", { year: season });
  const upcomingMeeting = useMemo(() => {
    const now = new Date();
    return meetings.find((m) => new Date(m.date_end) > now);
  }, [meetings]);
  const { data: upcomingSessions } = useOpenF1(
    "sessions",
    { meeting_key: upcomingMeeting?.meeting_key?.toString() ?? "" },
    { enabled: !!upcomingMeeting }
  );
  const nextSession = useMemo((): Session | null => {
    const now = new Date();
    const sorted = [...(upcomingSessions ?? [])].sort(
      (a, b) => new Date(a.date_start).getTime() - new Date(b.date_start).getTime()
    );
    return sorted.find((s) => new Date(s.date_start) > now) ?? null;
  }, [upcomingSessions]);
  // Parse session start: API returns UTC, but some events (e.g. Pre-Season Testing) use US broadcast time (10am EST)
  const nextSessionDate = useMemo(() => {
    if (!nextSession?.date_start) return null;
    const raw = nextSession.date_start;
    const hasTz = /(Z|[+-]\d{2}:?\d{2})$/.test(raw);
    const iso = hasTz ? raw : raw.replace(/\.\d+$/, "") + "Z";
    let date = new Date(iso);
    // Pre-Season Testing in Bahrain: API has 07:00 UTC (10am local); official US start is 10am EST (15:00 UTC)
    const isPreSeasonBahrain =
      nextSession.circuit_short_name === "Sakhir" &&
      nextSession.country_code === "BRN" &&
      (nextSession.session_name === "Day 1" || nextSession.session_name === "Day 2" || nextSession.session_name === "Day 3");
    if (isPreSeasonBahrain) {
      const utcHours = date.getUTCHours();
      const utcMins = date.getUTCMinutes();
      // 07:00 UTC = 2am EST; correct to 15:00 UTC = 10am EST
      if (utcHours === 7 && utcMins === 0) {
        date = new Date(date.getTime() + 8 * 60 * 60 * 1000);
      }
    }
    return date;
  }, [nextSession?.date_start, nextSession?.circuit_short_name, nextSession?.country_code, nextSession?.session_name]);

  const nextSessionLocalTime = useMemo(() => {
    if (!nextSessionDate) return "";
    return nextSessionDate.toLocaleString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      timeZoneName: "short",
    });
  }, [nextSessionDate]);

  const nextSessionLocalTimeShort = useMemo(() => {
    if (!nextSessionDate) return "";
    return nextSessionDate.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      timeZoneName: "short",
    });
  }, [nextSessionDate]);

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
    <header className="sticky top-0 z-30">
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
      <div className="flex min-h-14 items-center justify-between border-b border-border/60 bg-background/90 px-3 py-2 shadow-sm backdrop-blur-md sm:min-h-16 sm:px-6">
        <div className="flex min-w-0 items-center gap-2 sm:gap-4">
          {/* Team selector: account-style box + dropdown (all breakpoints) */}
          {mounted ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="flex items-center gap-2.5 rounded-xl border border-border/60 bg-background/80 px-3 py-2 my-1.5 shadow-sm transition-colors hover:bg-muted/50 hover:border-border focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
                  aria-label="Select team"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted">
                    {selectedTeam && teamLogoUrl && !logoError ? (
                      <Image
                        src={teamLogoUrl}
                        alt=""
                        width={32}
                        height={32}
                        className="object-contain p-0.5"
                        unoptimized
                        onError={() => setLogoError(true)}
                      />
                    ) : (
                      <Users className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex min-w-0 flex-col items-start gap-0">
                    <span className="flex items-center gap-1 truncate text-sm font-semibold tracking-tight text-foreground">
                      {selectedTeam ?? "All teams"}
                      <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-50" />
                    </span>
                    <span className="truncate text-xs text-muted-foreground">
                      {pageTitle}
                      {subtitle ? ` · ${subtitle}` : ""}
                    </span>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="max-h-[70vh] w-56 overflow-y-auto rounded-xl border-border/60 shadow-lg">
                <DropdownMenuItem
                  onClick={() => {
                    setSelectedTeam(null);
                    resetToDefault();
                  }}
                  className="rounded-lg py-2.5"
                >
                  <Users className="mr-2.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  All teams
                </DropdownMenuItem>
                {teams.map((team) => (
                  <DropdownMenuItem
                    key={team}
                    onClick={() => {
                      setSelectedTeam(team);
                      setTeamTheme(team);
                    }}
                    className="rounded-lg py-2.5"
                  >
                    <span className="flex items-center gap-2.5">
                      {getTeamLogoUrl(team) ? (
                        <span className="relative h-5 w-5 shrink-0 overflow-hidden rounded-md">
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
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-muted text-[10px] font-bold text-muted-foreground">
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
            <div className="flex items-center gap-2.5 rounded-xl border border-border/60 bg-background/80 px-3 py-2 my-1.5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
                <Users className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex min-w-0 flex-col gap-0">
                <span className="truncate text-sm font-semibold text-foreground">
                  {selectedTeam ?? "All teams"}
                </span>
                <span className="truncate text-xs text-muted-foreground">
                  {pageTitle}
                </span>
              </div>
            </div>
          )}

          {/* Live session indicator + Watch now (US: Apple TV) - only after mount to avoid hydration mismatch */}
          {mounted && isLive && latestSession && (
            <div className="ml-1 hidden shrink-0 items-center gap-1.5 sm:flex">
              <Badge
                variant="destructive"
                className="animate-pulse rounded-full px-2.5 py-0.5 text-xs font-medium shadow-sm"
              >
                <Radio className="h-3 w-3" />
                LIVE: {latestSession.session_name}
              </Badge>
              <Button
                variant="outline"
                size="sm"
                className="h-7 gap-1 rounded-full border-red-500/50 bg-red-500/10 px-2.5 text-xs font-medium text-red-600 hover:bg-red-500/20 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                asChild
              >
                <a
                  href={F1_APPLE_TV_US_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Watch on Apple TV (US)"
                >
                  <Play className="h-3 w-3" />
                  Watch now
                </a>
              </Button>
            </div>
          )}

          {/* Next race/event countdown: flag, circuit, session name, local time, countdown */}
          {mounted && !isLive && nextSession && nextSessionDate && (
            <div className="ml-1 hidden shrink-0 items-center gap-2 rounded-lg border border-border/60 bg-muted/30 px-2.5 py-1.5 sm:flex">
              <span className="relative h-4 w-5 shrink-0 overflow-hidden rounded-sm">
                <Image
                  src={`https://flagcdn.com/24x18/${(getCircuitTheme(nextSession.circuit_short_name).countryCode || getCountryFlagCode(nextSession.country_code)).toLowerCase()}.png`}
                  alt=""
                  width={24}
                  height={18}
                  className="object-cover"
                  unoptimized
                />
              </span>
              <span className="truncate text-xs font-medium text-foreground">
                {nextSession.circuit_short_name}
              </span>
              <span className="text-muted-foreground">·</span>
              <span className="truncate text-xs text-muted-foreground" title={nextSessionLocalTime}>
                {nextSession.session_name}
              </span>
              <span className="text-muted-foreground">·</span>
              <span className="truncate text-[10px] text-muted-foreground" title={nextSessionLocalTime}>
                {nextSessionLocalTimeShort}
              </span>
              <span className="text-muted-foreground">·</span>
              <HeaderCountdown targetDate={nextSessionDate} />
            </div>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          {/* Season selector: on mobile single dropdown with all seasons; on desktop pill group + older dropdown */}
          {mounted ? (
            <>
              {/* Mobile: all seasons in one dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="h-7 gap-1 rounded-md border-0 px-2 text-xs font-medium sm:hidden"
                  >
                    <Calendar className="h-3 w-3 text-muted-foreground" />
                    {season}
                    <ChevronDown className="h-3 w-3 opacity-70" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="min-w-[8rem] max-h-[70vh] overflow-y-auto">
                  {availableSeasons.map((y) => (
                    <DropdownMenuItem
                      key={y}
                      onClick={() => setSeason(y)}
                    >
                      Season {y}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              {/* Desktop: pill group + older dropdown */}
              <div className="hidden sm:flex items-center rounded-lg border border-border/50 bg-muted/30 p-0.5">
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
                        {recentSeasons.includes(season) ? "Older" : season}
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
            </>
          ) : (
            <div className="flex h-7 items-center gap-1 rounded-lg border border-border/50 bg-muted/30 px-2 text-xs font-medium text-muted-foreground sm:h-8 sm:gap-1.5 sm:px-3 sm:text-sm">
              <Calendar className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              {season}
            </div>
          )}

          {/* Divider before actions */}
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

      {/* Mobile-only: second row for countdown or live - white background on mobile */}
      {mounted && !isLive && nextSession && nextSessionDate && (
        <div className="flex sm:hidden w-full flex-wrap items-center gap-2 border-t border-border/50 bg-background px-3 py-2">
          <span className="relative h-4 w-5 shrink-0 overflow-hidden rounded-sm">
            <Image
              src={`https://flagcdn.com/24x18/${(getCircuitTheme(nextSession.circuit_short_name).countryCode || getCountryFlagCode(nextSession.country_code)).toLowerCase()}.png`}
              alt=""
              width={24}
              height={18}
              className="object-cover"
              unoptimized
            />
          </span>
          <span className="truncate text-xs font-medium text-foreground min-w-0">
            {nextSession.circuit_short_name}
          </span>
          <span className="text-muted-foreground shrink-0">·</span>
          <span className="truncate text-xs text-muted-foreground">
            {nextSession.session_name}
          </span>
          <span className="text-muted-foreground shrink-0">·</span>
          <span className="truncate text-[10px] text-muted-foreground" title={nextSessionLocalTime}>
            {nextSessionLocalTimeShort}
          </span>
          <span className="text-muted-foreground shrink-0">·</span>
          <HeaderCountdown targetDate={nextSessionDate} />
        </div>
      )}
      {mounted && isLive && latestSession && (
        <div className="flex sm:hidden w-full items-center justify-between gap-2 border-t border-border/50 bg-red-500/10 px-3 py-2">
          <div className="flex min-w-0 items-center gap-2">
            <Badge variant="destructive" className="shrink-0 animate-pulse rounded-full px-2 py-0.5 text-xs font-medium">
              <Radio className="h-3 w-3" />
              LIVE: {latestSession.session_name}
            </Badge>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="h-7 shrink-0 gap-1 rounded-full border-red-500/50 bg-red-500/10 px-2.5 text-xs font-medium text-red-600 dark:text-red-400"
            asChild
          >
            <a href={F1_APPLE_TV_US_URL} target="_blank" rel="noopener noreferrer" title="Watch on Apple TV (US)">
              <Play className="h-3 w-3" />
              Watch now
            </a>
          </Button>
        </div>
      )}

    </header>
  );
}
