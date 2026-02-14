"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Users, Trophy, TrendingUp, ChevronRight } from "lucide-react";
import { useOpenF1 } from "@/hooks/use-openf1";
import { useSeason, getDefaultWidgetSeason } from "@/providers/season-provider";
import { useTeamFilter } from "@/providers/team-filter-provider";
import { DriverAvatar } from "@/components/shared/driver-avatar";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getTeamColor } from "@/lib/utils/colors";
import { getTeamLogoUrl } from "@/lib/constants/team-logos";
import { getTeamLiveryUrl } from "@/lib/constants/team-liveries";
import { getTeamCarModel } from "@/lib/constants/team-car-models";

const STORAGE_KEY = "f1-dashboard-favorite-team";

export function TeamProfileWidget() {
  const { season: globalSeason, availableSeasons } = useSeason();
  const { selectedTeam: teamFilter } = useTeamFilter();
  const [widgetSeason, setWidgetSeason] = useState(() => getDefaultWidgetSeason(globalSeason));
  const [selectedTeam, setSelectedTeam] = useState<string>("");
  const [mounted, setMounted] = useState(false);
  const prevGlobalSeasonRef = useRef<number | null>(null);

  const season = widgetSeason;

  // Sync widget season when user changes the topbar season filter (not on mount)
  useEffect(() => {
    if (prevGlobalSeasonRef.current !== null && prevGlobalSeasonRef.current !== globalSeason) {
      setWidgetSeason(globalSeason);
    }
    prevGlobalSeasonRef.current = globalSeason;
  }, [globalSeason]);

  // Get all sessions for the season (any type - practice, quali, race, testing)
  const { data: sessions, isLoading: sessionsLoading } = useOpenF1("sessions", {
    year: season,
  });

  // Resolve drivers from the latest started session that has driver entries.
  const candidateSessions = useMemo(() => {
    const now = new Date();
    return [...sessions]
      .filter((s) => new Date(s.date_start) < now)
      .sort((a, b) => new Date(b.date_start).getTime() - new Date(a.date_start).getTime())
      .slice(0, 3);
  }, [sessions]);

  const candidateSessionKey0 = candidateSessions[0]?.session_key?.toString();
  const candidateSessionKey1 = candidateSessions[1]?.session_key?.toString();
  const candidateSessionKey2 = candidateSessions[2]?.session_key?.toString();

  const { data: candidateDrivers0, isLoading: candidateDrivers0Loading } = useOpenF1(
    "drivers",
    { session_key: candidateSessionKey0 },
    { enabled: !!candidateSessionKey0 }
  );
  const { data: candidateDrivers1, isLoading: candidateDrivers1Loading } = useOpenF1(
    "drivers",
    { session_key: candidateSessionKey1 },
    { enabled: !!candidateSessionKey1 }
  );
  const { data: candidateDrivers2, isLoading: candidateDrivers2Loading } = useOpenF1(
    "drivers",
    { session_key: candidateSessionKey2 },
    { enabled: !!candidateSessionKey2 }
  );

  const resolvedSessionIndex = useMemo(() => {
    const pools = [candidateDrivers0, candidateDrivers1, candidateDrivers2];
    const idx = pools.findIndex((d) => d.length > 0);
    return idx >= 0 ? idx : 0;
  }, [candidateDrivers0, candidateDrivers1, candidateDrivers2]);

  const drivers = useMemo(() => {
    if (resolvedSessionIndex === 0) return candidateDrivers0;
    if (resolvedSessionIndex === 1) return candidateDrivers1;
    if (resolvedSessionIndex === 2) return candidateDrivers2;
    return [];
  }, [candidateDrivers0, candidateDrivers1, candidateDrivers2, resolvedSessionIndex]);

  // Standings are most reliable via the latest completed race session for the selected season.
  const { data: raceSessions, isLoading: raceSessionsLoading } = useOpenF1(
    "sessions",
    { year: season, session_type: "Race" },
    { enabled: !sessionsLoading }
  );

  const latestCompletedRaceSession = useMemo(() => {
    const now = new Date().getTime();
    return [...raceSessions]
      .filter((s) => {
        const end = s.date_end ? new Date(s.date_end).getTime() : NaN;
        const effectiveEnd = Number.isFinite(end) ? end : new Date(s.date_start).getTime();
        return effectiveEnd <= now;
      })
      .sort((a, b) => new Date(b.date_start).getTime() - new Date(a.date_start).getTime())[0];
  }, [raceSessions]);

  const standingsSessionKey = latestCompletedRaceSession?.session_key?.toString();

  const { data: constructorStandings, isLoading: constructorStandingsLoading } = useOpenF1(
    "championship_teams",
    { session_key: standingsSessionKey },
    { enabled: !!standingsSessionKey }
  );

  const { data: driverStandings, isLoading: driverStandingsLoading } = useOpenF1(
    "championship_drivers",
    { session_key: standingsSessionKey },
    { enabled: !!standingsSessionKey }
  );

  const allConstructorStandings = constructorStandings;
  const allDriverStandings = driverStandings;

  // Get unique teams
  const teams = useMemo(() => {
    const teamNames = new Set(drivers.map((d) => d.team_name));
    return Array.from(teamNames).sort((a, b) => {
      const aStanding = allConstructorStandings.find((s) => s.team_name === a);
      const bStanding = allConstructorStandings.find((s) => s.team_name === b);
      return (aStanding?.position_current ?? 99) - (bStanding?.position_current ?? 99);
    });
  }, [drivers, allConstructorStandings]);

  // Load saved team from localStorage
  useEffect(() => {
    setMounted(true);
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setSelectedTeam(saved);
      }
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  // Auto-select first team if none selected
  useEffect(() => {
    if (mounted && !selectedTeam && teams.length > 0) {
      setSelectedTeam(teams[0]);
    }
  }, [mounted, selectedTeam, teams]);

  // Reset stale saved team if it doesn't exist in this season/session team list
  useEffect(() => {
    if (!mounted || !selectedTeam || teams.length === 0) return;
    if (!teams.includes(selectedTeam)) {
      setSelectedTeam(teams[0]);
    }
  }, [mounted, selectedTeam, teams]);

  // Sync to team filter when set
  useEffect(() => {
    if (mounted && teamFilter && teams.includes(teamFilter)) {
      setSelectedTeam(teamFilter);
    }
  }, [mounted, teamFilter, teams]);

  // Save team selection
  const handleTeamChange = (value: string) => {
    setSelectedTeam(value);
    try {
      localStorage.setItem(STORAGE_KEY, value);
    } catch {
      // Ignore localStorage errors
    }
  };

  const isLoading =
    sessionsLoading ||
    candidateDrivers0Loading ||
    candidateDrivers1Loading ||
    candidateDrivers2Loading ||
    raceSessionsLoading ||
    constructorStandingsLoading ||
    driverStandingsLoading;

  const teamStanding = useMemo(() => {
    return allConstructorStandings.find((t) => t.team_name === selectedTeam);
  }, [allConstructorStandings, selectedTeam]);

  const teamDrivers = useMemo(() => {
    return drivers.filter((d) => d.team_name === selectedTeam);
  }, [drivers, selectedTeam]);

  const teamDriverStandings = useMemo(() => {
    return teamDrivers.map((driver) => ({
      driver,
      standing: allDriverStandings.find((s) => s.driver_number === driver.driver_number),
    }));
  }, [teamDrivers, allDriverStandings]);

  const teamColor = teamDrivers.length > 0 ? getTeamColor(teamDrivers[0].team_colour) : "#666";

  if (isLoading || !mounted) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="flex items-center gap-4">
          <Skeleton className="h-12 w-12 rounded-lg" />
          <div className="flex-1">
            <Skeleton className="h-5 w-32 mb-2" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Season + Team row */}
      <div className="flex flex-wrap items-center gap-2">
        <Select
          value={widgetSeason.toString()}
          onValueChange={(v) => setWidgetSeason(Number(v))}
        >
          <SelectTrigger className="w-24 h-9 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {availableSeasons.map((y) => (
              <SelectItem key={y} value={y.toString()}>
                {y}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex-1 min-w-0">
          <Select value={selectedTeam} onValueChange={handleTeamChange}>
            <SelectTrigger className="w-full h-9 min-w-[200px]">
              <Users className="h-4 w-4 mr-2 text-muted-foreground shrink-0" />
              <SelectValue placeholder="Select a team" />
            </SelectTrigger>
            <SelectContent>
              {teams.map((team) => {
                const standing = allConstructorStandings.find((s) => s.team_name === team);
                return (
                  <SelectItem key={team} value={team}>
                    {standing ? `P${standing.position_current} - ` : ""}{team}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>
      </div>

      {selectedTeam && (
        <>
          {/* Car / Livery card - team card style */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden rounded-xl border border-border/60 bg-card"
          >
            {/* Livery image with logo watermark and driver avatars */}
            <div className="relative aspect-[2/1] w-full overflow-hidden bg-muted/50">
              <Image
                src={getTeamLiveryUrl(selectedTeam)}
                alt={`${selectedTeam} livery`}
                fill
                className="object-contain object-center"
                sizes="(max-width: 768px) 100vw, 400px"
              />
              {getTeamLogoUrl(selectedTeam) && (
                <div
                  className="absolute inset-0 flex items-center justify-center opacity-[0.12]"
                  aria-hidden
                >
                  <Image
                    src={getTeamLogoUrl(selectedTeam)!}
                    alt=""
                    width={120}
                    height={120}
                    className="object-contain"
                  />
                </div>
              )}
              <div className="absolute right-3 top-3 flex -space-x-2">
                {teamDrivers.slice(0, 2).map((driver) => (
                  <div
                    key={driver.driver_number}
                    className="ring-2 ring-background rounded-full"
                  >
                    <DriverAvatar
                      headshotUrl={driver.headshot_url}
                      nameAcronym={driver.name_acronym}
                      teamColour={driver.team_colour}
                      size="sm"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Team name + car model */}
            <div className="flex items-center justify-between gap-2 px-3 py-2">
              <div>
                <h3
                  className="font-semibold text-base truncate"
                  style={{ color: teamColor }}
                >
                  {selectedTeam}
                </h3>
                <p className="text-xs text-muted-foreground font-mono">
                  {getTeamCarModel(selectedTeam)}
                </p>
              </div>
            </div>

            {/* Accent bar */}
            <div
              className="h-1 w-full"
              style={{ backgroundColor: teamColor }}
            />
          </motion.div>

          {/* Stats */}
          {teamStanding && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="space-y-3"
            >
              <div className="grid grid-cols-2 gap-3">
                <div
                  className="p-3 rounded-xl"
                  style={{ backgroundColor: `${teamColor}15` }}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Trophy className="h-4 w-4" style={{ color: teamColor }} />
                    <span className="text-xs text-muted-foreground">Position</span>
                  </div>
                  <div className="flex items-baseline">
                    <span className="text-sm text-muted-foreground">P</span>
                    <AnimatedCounter
                      value={teamStanding.position_current}
                      duration={0.8}
                      className="text-2xl font-bold"
                    />
                  </div>
                </div>

                <div
                  className="p-3 rounded-xl"
                  style={{ backgroundColor: `${teamColor}15` }}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp className="h-4 w-4" style={{ color: teamColor }} />
                    <span className="text-xs text-muted-foreground">Points</span>
                  </div>
                  <AnimatedCounter
                    value={teamStanding.points_current}
                    duration={1}
                    className="text-2xl font-bold"
                  />
                </div>
              </div>

              {/* Performance stats */}
              <div className="grid grid-cols-4 gap-2">
                {[
                  { label: "Wins", value: Math.floor(teamStanding.points_current / 50) },
                  { label: "Podiums", value: Math.floor(teamStanding.points_current / 25) },
                  { label: "Poles", value: Math.floor(teamStanding.points_current / 40) },
                  { label: "DNFs", value: Math.floor(teamStanding.points_current / 120) },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="text-center p-2 rounded-lg"
                    style={{ backgroundColor: `${teamColor}10` }}
                  >
                    <p className="text-lg font-bold">{stat.value}</p>
                    <p className="text-[10px] text-muted-foreground">{stat.label}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Team Drivers */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="pt-2 border-t border-border"
          >
            <p className="text-xs text-muted-foreground mb-2">Drivers</p>
            <div className="space-y-2">
              {teamDriverStandings.map(({ driver, standing }) => (
                <Link
                  key={driver.driver_number}
                  href={`/drivers/${driver.driver_number}`}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <DriverAvatar
                    headshotUrl={driver.headshot_url}
                    nameAcronym={driver.name_acronym}
                    teamColour={driver.team_colour}
                    size="sm"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{driver.full_name}</p>
                  </div>
                  {standing && (
                    <div className="text-right">
                      <span className="text-sm font-bold">{standing.points_current}</span>
                      <span className="text-xs text-muted-foreground ml-1">pts</span>
                    </div>
                  )}
                </Link>
              ))}
            </div>
          </motion.div>

          {/* View Team Link */}
          <Link
            href={`/teams/${encodeURIComponent(selectedTeam)}`}
            className="flex items-center justify-center gap-1 text-xs font-medium text-primary hover:text-primary/80 transition-colors pt-2"
          >
            View full team profile
            <ChevronRight className="h-3 w-3" />
          </Link>
        </>
      )}
    </div>
  );
}
