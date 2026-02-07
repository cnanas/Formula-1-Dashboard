"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Users, Trophy, TrendingUp, ChevronRight } from "lucide-react";
import { useOpenF1 } from "@/hooks/use-openf1";
import { useSeason } from "@/providers/season-provider";
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

const STORAGE_KEY = "f1-dashboard-favorite-team";

export function TeamProfileWidget() {
  const { season } = useSeason();
  const [selectedTeam, setSelectedTeam] = useState<string>("");
  const [mounted, setMounted] = useState(false);

  // Get sessions for the season to find the latest one
  const { data: sessions, isLoading: sessionsLoading } = useOpenF1("sessions", {
    year: season,
    session_type: "Race",
  });

  // Find the most recent completed race session
  const latestSession = useMemo(() => {
    return sessions
      .filter((s) => new Date(s.date_start) < new Date())
      .sort((a, b) => new Date(b.date_start).getTime() - new Date(a.date_start).getTime())[0];
  }, [sessions]);

  const sessionKey = latestSession?.session_key?.toString();

  // Get all drivers
  const { data: drivers, isLoading: driversLoading } = useOpenF1(
    "drivers",
    { session_key: sessionKey },
    { enabled: !!sessionKey }
  );

  // Get constructor standings
  const { data: constructorStandings, isLoading: constructorStandingsLoading } = useOpenF1(
    "championship_teams",
    { session_key: sessionKey },
    { enabled: !!sessionKey }
  );

  // Get driver standings
  const { data: driverStandings } = useOpenF1(
    "championship_drivers",
    { session_key: sessionKey },
    { enabled: !!sessionKey }
  );

  // Get unique teams
  const teams = useMemo(() => {
    const teamNames = new Set(drivers.map((d) => d.team_name));
    return Array.from(teamNames).sort((a, b) => {
      const aStanding = constructorStandings.find((s) => s.team_name === a);
      const bStanding = constructorStandings.find((s) => s.team_name === b);
      return (aStanding?.position_current ?? 99) - (bStanding?.position_current ?? 99);
    });
  }, [drivers, constructorStandings]);

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

  // Save team selection
  const handleTeamChange = (value: string) => {
    setSelectedTeam(value);
    try {
      localStorage.setItem(STORAGE_KEY, value);
    } catch {
      // Ignore localStorage errors
    }
  };

  const isLoading = sessionsLoading || driversLoading || constructorStandingsLoading;

  const teamStanding = useMemo(() => {
    return constructorStandings.find((t) => t.team_name === selectedTeam);
  }, [constructorStandings, selectedTeam]);

  const teamDrivers = useMemo(() => {
    return drivers.filter((d) => d.team_name === selectedTeam);
  }, [drivers, selectedTeam]);

  const teamDriverStandings = useMemo(() => {
    return teamDrivers.map((driver) => ({
      driver,
      standing: driverStandings.find((s) => s.driver_number === driver.driver_number),
    }));
  }, [teamDrivers, driverStandings]);

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
      {/* Team Selector */}
      <Select value={selectedTeam} onValueChange={handleTeamChange}>
        <SelectTrigger className="w-full">
          <Users className="h-4 w-4 mr-2 text-muted-foreground" />
          <SelectValue placeholder="Select a team" />
        </SelectTrigger>
        <SelectContent>
          {teams.map((team) => {
            const standing = constructorStandings.find((s) => s.team_name === team);
            return (
              <SelectItem key={team} value={team}>
                {standing ? `P${standing.position_current} - ` : ""}{team}
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>

      {selectedTeam && (
        <>
          {/* Team Info */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="flex items-center gap-4"
          >
            <div
              className="h-12 w-12 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: `${teamColor}20` }}
            >
              <div
                className="h-8 w-8 rounded-lg"
                style={{ backgroundColor: teamColor }}
              />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-lg truncate">{selectedTeam}</h3>
              <p className="text-sm text-muted-foreground">
                {teamDrivers.length} Drivers
              </p>
            </div>
          </motion.div>

          {/* Stats */}
          {teamStanding && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="grid grid-cols-2 gap-3"
            >
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
