"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { User, Trophy, TrendingUp, ChevronRight, Award, Flag, Users } from "lucide-react";
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
import { getCountryFlagCode } from "@/lib/constants/country-codes";
import { normalizeTeamName } from "@/lib/constants/team-names";
import {
  getLatestCompletedGrandPrixRaceSession,
  getLatestStartedSession,
  hasUsableDriverProfiles,
} from "@/lib/api/session-selection";
import Image from "next/image";

const STORAGE_KEY = "f1-dashboard-favorite-driver";

export function DriverProfileWidget() {
  const { season: globalSeason, availableSeasons } = useSeason();
  const { selectedTeam: teamFilter } = useTeamFilter();
  const [widgetSeason, setWidgetSeason] = useState(() => getDefaultWidgetSeason(globalSeason));
  const [selectedDriver, setSelectedDriver] = useState<string>("");
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

  const latestStartedSession = useMemo(() => getLatestStartedSession(sessions), [sessions]);
  const latestStartedSessionKey = latestStartedSession?.session_key?.toString();

  const { data: seasonDrivers, isLoading: seasonDriversLoading } = useOpenF1(
    "drivers",
    { session_key: latestStartedSessionKey },
    { enabled: !!latestStartedSessionKey }
  );

  const hasSeasonDriverProfiles = useMemo(
    () => hasUsableDriverProfiles(seasonDrivers),
    [seasonDrivers]
  );

  // Standings are most reliable via the latest completed race session for the selected season.
  const { data: raceSessions, isLoading: raceSessionsLoading } = useOpenF1(
    "sessions",
    { year: season, session_type: "Race" },
    { enabled: !sessionsLoading }
  );

  const latestCompletedRaceSession = useMemo(
    () => getLatestCompletedGrandPrixRaceSession(raceSessions),
    [raceSessions]
  );

  const fallbackSeason = useMemo(() => {
    if (latestCompletedRaceSession) return null;
    return availableSeasons.find((year) => year < season) ?? null;
  }, [latestCompletedRaceSession, season, availableSeasons]);

  const { data: fallbackRaceSessions, isLoading: fallbackRaceSessionsLoading } = useOpenF1(
    "sessions",
    { year: fallbackSeason ?? 0, session_type: "Race" },
    { enabled: !!fallbackSeason }
  );

  const fallbackRaceSession = useMemo(
    () => getLatestCompletedGrandPrixRaceSession(fallbackRaceSessions),
    [fallbackRaceSessions]
  );

  const profileFallbackSessionKey = (
    latestCompletedRaceSession ??
    fallbackRaceSession
  )?.session_key?.toString();

  const standingsSessionKey = latestCompletedRaceSession?.session_key?.toString();

  const { data: fallbackDrivers, isLoading: fallbackDriversLoading } = useOpenF1(
    "drivers",
    { session_key: profileFallbackSessionKey },
    { enabled: !!profileFallbackSessionKey && !seasonDriversLoading && !hasSeasonDriverProfiles }
  );

  const drivers = hasSeasonDriverProfiles ? seasonDrivers : fallbackDrivers;

  const { data: standings, isLoading: standingsLoading } = useOpenF1(
    "championship_drivers",
    { session_key: standingsSessionKey },
    { enabled: !!standingsSessionKey }
  );

  const allStandings = standings;

  // Load saved driver from localStorage
  useEffect(() => {
    setMounted(true);
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setSelectedDriver(saved);
      }
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  const prevTeamFilterRef = useRef<string | null>(null);
  // When user selects a team in the header filter, default this widget to that team's first driver
  useEffect(() => {
    if (!teamFilter) {
      prevTeamFilterRef.current = null;
      return;
    }
    if (!mounted || drivers.length === 0) return;
    if (prevTeamFilterRef.current === teamFilter) return;
    prevTeamFilterRef.current = teamFilter;
    const teamDriverNumbers = drivers
      .filter((driver) => normalizeTeamName(driver.team_name) === teamFilter)
      .map((d) => d.driver_number);
    if (teamDriverNumbers.length === 0) return;
    const sorted = [...allStandings].sort((a, b) => a.position_current - b.position_current);
    const firstFromTeam = sorted.find((s) => teamDriverNumbers.includes(s.driver_number));
    if (firstFromTeam) {
      setSelectedDriver(firstFromTeam.driver_number.toString());
    }
  }, [mounted, teamFilter, drivers, allStandings]);

  // Auto-select first driver if none selected (no team filter)
  useEffect(() => {
    if (mounted && !selectedDriver && drivers.length > 0 && !teamFilter) {
      const leader = [...allStandings].sort((a, b) => a.position_current - b.position_current)[0];
      if (leader) {
        setSelectedDriver(leader.driver_number.toString());
      } else {
        setSelectedDriver(drivers[0].driver_number.toString());
      }
    }
  }, [mounted, selectedDriver, drivers, allStandings, teamFilter]);

  // Reset stale saved driver if it doesn't exist in this season/session driver list
  useEffect(() => {
    if (!mounted || !selectedDriver || drivers.length === 0) return;
    const exists = drivers.some((d) => d.driver_number === Number(selectedDriver));
    if (!exists) {
      const leader = [...allStandings].sort((a, b) => a.position_current - b.position_current)[0];
      setSelectedDriver((leader ?? drivers[0]).driver_number.toString());
    }
  }, [mounted, selectedDriver, drivers, allStandings]);

  // Save driver selection
  const handleDriverChange = (value: string) => {
    setSelectedDriver(value);
    try {
      localStorage.setItem(STORAGE_KEY, value);
    } catch {
      // Ignore localStorage errors
    }
  };

  const isLoading =
    sessionsLoading ||
    seasonDriversLoading ||
    raceSessionsLoading ||
    fallbackRaceSessionsLoading ||
    fallbackDriversLoading ||
    standingsLoading;

  const driver = useMemo(() => {
    return drivers.find((d) => d.driver_number === Number(selectedDriver));
  }, [drivers, selectedDriver]);

  const driverStanding = useMemo(() => {
    return allStandings.find((s) => s.driver_number === Number(selectedDriver));
  }, [allStandings, selectedDriver]);

  // Get teammate for comparison
  const teammate = useMemo(() => {
    if (!driver) return null;
    return drivers.find(
      (entry) =>
        normalizeTeamName(entry.team_name) === normalizeTeamName(driver.team_name) &&
        entry.driver_number !== driver.driver_number
    );
  }, [drivers, driver]);

  const teammateStanding = useMemo(() => {
    if (!teammate) return null;
    return allStandings.find((s) => s.driver_number === teammate.driver_number);
  }, [allStandings, teammate]);

  // Get both team drivers when team filter is active (use teamFilter, not driver.team_name)
  const teamDrivers = useMemo(() => {
    if (!teamFilter) return [];
    return drivers
      .filter((driver) => normalizeTeamName(driver.team_name) === teamFilter)
      .sort((a, b) => {
        const aStanding = allStandings.find((s) => s.driver_number === a.driver_number);
        const bStanding = allStandings.find((s) => s.driver_number === b.driver_number);
        return (aStanding?.position_current ?? 99) - (bStanding?.position_current ?? 99);
      });
  }, [teamFilter, drivers, allStandings]);

  const showTeamView = teamFilter && teamDrivers.length > 0;
  const teamColor = driver ? getTeamColor(driver.team_colour) : "#666";
  const driverPosition = driverStanding?.position_current ?? 0;
  const driverPoints = driverStanding?.points_current ?? 0;
  const teammatePoints = teammateStanding?.points_current ?? 0;
  const teammateTotalPoints = driverPoints + teammatePoints;
  const teammateComparisonPercent =
    teammateTotalPoints > 0 ? (driverPoints / teammateTotalPoints) * 100 : 50;

  if (isLoading || !mounted) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="flex items-center gap-4">
          <Skeleton className="h-16 w-16 rounded-full" />
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
      {/* Season + Driver row */}
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
        {!showTeamView && (
          <div className="flex-1 min-w-0">
            <Select value={selectedDriver} onValueChange={handleDriverChange}>
              <SelectTrigger className="w-full h-9 min-w-[200px]">
                <User className="h-4 w-4 mr-2 text-muted-foreground shrink-0" />
                <SelectValue placeholder="Select a driver" />
              </SelectTrigger>
              <SelectContent>
                {drivers
                  .slice()
                  .sort((a, b) => {
                    const aStanding = allStandings.find((s) => s.driver_number === a.driver_number);
                    const bStanding = allStandings.find((s) => s.driver_number === b.driver_number);
                    return (aStanding?.position_current ?? 99) - (bStanding?.position_current ?? 99);
                  })
                  .map((d) => (
                    <SelectItem key={d.driver_number} value={d.driver_number.toString()}>
                      {d.full_name} - {d.team_name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
        )}
        {showTeamView && (
          <div className="flex-1">
            <div className="h-9 px-3 flex items-center gap-2 text-sm font-medium">
              <Users className="h-4 w-4 text-muted-foreground" />
              {teamFilter} Drivers
            </div>
          </div>
        )}
      </div>

      {showTeamView ? (
        /* Team Drivers View */
        <div className="space-y-3">
          {teamDrivers.map((teamDriver, index) => {
            const standing = allStandings.find((s) => s.driver_number === teamDriver.driver_number);
            const standingPosition = standing?.position_current ?? 0;
            const standingPoints = standing?.points_current ?? 0;
            const flagCode = teamDriver.country_code
              ? getCountryFlagCode(teamDriver.country_code)
              : null;
            return (
              <motion.div
                key={teamDriver.driver_number}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <Link
                  href={`/drivers/${teamDriver.driver_number}`}
                  className="block p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <DriverAvatar
                      headshotUrl={teamDriver.headshot_url}
                      nameAcronym={teamDriver.name_acronym}
                      teamColour={teamDriver.team_colour}
                      size="md"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-bold truncate">{teamDriver.full_name}</p>
                        {flagCode && (
                          <span className="relative h-3.5 w-5 shrink-0 overflow-hidden rounded-sm">
                            <Image
                              src={`https://flagcdn.com/20x15/${flagCode}.png`}
                              alt=""
                              width={20}
                              height={15}
                              className="object-cover"
                              unoptimized
                            />
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {teamDriver.first_name} · #{teamDriver.driver_number}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs text-muted-foreground">P{standingPosition}</p>
                      <p className="font-bold">{standingPoints} pts</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                    <div className="p-2 rounded bg-muted/50">
                      <p className="text-[10px] text-muted-foreground uppercase">Position</p>
                      <p className="text-sm font-bold">P{standingPosition}</p>
                    </div>
                    <div className="p-2 rounded bg-muted/50">
                      <p className="text-[10px] text-muted-foreground uppercase">Points</p>
                      <p className="text-sm font-bold">{standingPoints}</p>
                    </div>
                    <div className="p-2 rounded bg-muted/50">
                      <p className="text-[10px] text-muted-foreground uppercase">Podiums</p>
                      <p className="text-sm font-bold">{Math.floor(standingPoints / 25)}</p>
                    </div>
                    <div className="p-2 rounded bg-muted/50">
                      <p className="text-[10px] text-muted-foreground uppercase">Wins</p>
                      <p className="text-sm font-bold">{Math.floor(standingPoints / 50)}</p>
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      ) : (
        /* Single Driver View */
        driver && (
          <>
            {/* Driver Info */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="flex items-center gap-4"
            >
              <DriverAvatar
                headshotUrl={driver.headshot_url}
                nameAcronym={driver.name_acronym}
                teamColour={driver.team_colour}
                size="lg"
              />
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-lg truncate">{driver.full_name}</h3>
                <Link href={`/teams/${encodeURIComponent(driver.team_name)}`}>
                  <p className="text-sm text-muted-foreground hover:text-primary transition-colors truncate">
                    {driver.team_name}
                  </p>
                </Link>
              </div>
              <div
                className="text-3xl font-bold font-mono"
                style={{ color: teamColor }}
              >
                #{driver.driver_number}
              </div>
            </motion.div>

            {/* Stats */}
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
                      value={driverPosition}
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
                    value={driverPoints}
                    duration={1}
                    className="text-2xl font-bold"
                  />
                </div>
              </div>

              {/* Additional Stats */}
              <div className="grid grid-cols-3 gap-2">
                <div className="text-center p-2 rounded-lg bg-muted/50">
                  <Award className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                  <p className="text-lg font-bold">{Math.floor(driverPoints / 50)}</p>
                  <p className="text-[10px] text-muted-foreground">Wins</p>
                </div>
                <div className="text-center p-2 rounded-lg bg-muted/50">
                  <Trophy className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                  <p className="text-lg font-bold">{Math.floor(driverPoints / 25)}</p>
                  <p className="text-[10px] text-muted-foreground">Podiums</p>
                </div>
                <div className="text-center p-2 rounded-lg bg-muted/50">
                  <Flag className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                  <p className="text-lg font-bold">{Math.floor(driverPoints / 40)}</p>
                  <p className="text-[10px] text-muted-foreground">Poles</p>
                </div>
              </div>
            </motion.div>

            {/* Teammate Comparison */}
            {teammate && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.2 }}
                className="pt-2 border-t border-border"
              >
                <p className="text-xs text-muted-foreground mb-2">vs Teammate</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <DriverAvatar
                      headshotUrl={driver.headshot_url}
                      nameAcronym={driver.name_acronym}
                      teamColour={driver.team_colour}
                      size="sm"
                    />
                    <span className="font-semibold">{driverPoints}</span>
                  </div>
                  <div className="flex-1 mx-3 h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${teammateComparisonPercent}%`,
                        backgroundColor: teamColor,
                      }}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{teammatePoints}</span>
                    <DriverAvatar
                      headshotUrl={teammate.headshot_url}
                      nameAcronym={teammate.name_acronym}
                      teamColour={teammate.team_colour}
                      size="sm"
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {/* View Profile Link */}
            <Link
              href={`/drivers/${driver.driver_number}`}
              className="flex items-center justify-center gap-1 text-xs font-medium text-primary hover:text-primary/80 transition-colors pt-2"
            >
              View full profile
              <ChevronRight className="h-3 w-3" />
            </Link>
          </>
        )
      )}
    </div>
  );
}
