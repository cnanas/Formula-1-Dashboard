"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { User, Trophy, TrendingUp, ChevronRight } from "lucide-react";
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

const STORAGE_KEY = "f1-dashboard-favorite-driver";

export function DriverProfileWidget() {
  const { season } = useSeason();
  const [selectedDriver, setSelectedDriver] = useState<string>("");
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

  // Get championship standings
  const { data: standings, isLoading: standingsLoading } = useOpenF1(
    "championship_drivers",
    { session_key: sessionKey },
    { enabled: !!sessionKey }
  );

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

  // Auto-select first driver if none selected
  useEffect(() => {
    if (mounted && !selectedDriver && drivers.length > 0) {
      // Default to the championship leader
      const leader = standings.sort((a, b) => a.position_current - b.position_current)[0];
      if (leader) {
        setSelectedDriver(leader.driver_number.toString());
      } else {
        setSelectedDriver(drivers[0].driver_number.toString());
      }
    }
  }, [mounted, selectedDriver, drivers, standings]);

  // Save driver selection
  const handleDriverChange = (value: string) => {
    setSelectedDriver(value);
    try {
      localStorage.setItem(STORAGE_KEY, value);
    } catch {
      // Ignore localStorage errors
    }
  };

  const isLoading = sessionsLoading || driversLoading || standingsLoading;

  const driver = useMemo(() => {
    return drivers.find((d) => d.driver_number === Number(selectedDriver));
  }, [drivers, selectedDriver]);

  const driverStanding = useMemo(() => {
    return standings.find((s) => s.driver_number === Number(selectedDriver));
  }, [standings, selectedDriver]);

  // Get teammate for comparison
  const teammate = useMemo(() => {
    if (!driver) return null;
    return drivers.find(
      (d) => d.team_name === driver.team_name && d.driver_number !== driver.driver_number
    );
  }, [drivers, driver]);

  const teammateStanding = useMemo(() => {
    if (!teammate) return null;
    return standings.find((s) => s.driver_number === teammate.driver_number);
  }, [standings, teammate]);

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

  const teamColor = driver ? getTeamColor(driver.team_colour) : "#666";

  return (
    <div className="space-y-4">
      {/* Driver Selector */}
      <Select value={selectedDriver} onValueChange={handleDriverChange}>
        <SelectTrigger className="w-full">
          <User className="h-4 w-4 mr-2 text-muted-foreground" />
          <SelectValue placeholder="Select a driver" />
        </SelectTrigger>
        <SelectContent>
          {drivers
            .sort((a, b) => {
              const aStanding = standings.find((s) => s.driver_number === a.driver_number);
              const bStanding = standings.find((s) => s.driver_number === b.driver_number);
              return (aStanding?.position_current ?? 99) - (bStanding?.position_current ?? 99);
            })
            .map((d) => (
              <SelectItem key={d.driver_number} value={d.driver_number.toString()}>
                {d.full_name} - {d.team_name}
              </SelectItem>
            ))}
        </SelectContent>
      </Select>

      {driver && (
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
          {driverStanding && (
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
                    value={driverStanding.position_current}
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
                  value={driverStanding.points_current}
                  duration={1}
                  className="text-2xl font-bold"
                />
              </div>
            </motion.div>
          )}

          {/* Teammate Comparison */}
          {teammate && teammateStanding && driverStanding && (
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
                  <span className="font-semibold">{driverStanding.points_current}</span>
                </div>
                <div className="flex-1 mx-3 h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${(driverStanding.points_current / (driverStanding.points_current + teammateStanding.points_current)) * 100}%`,
                      backgroundColor: teamColor,
                    }}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{teammateStanding.points_current}</span>
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
      )}
    </div>
  );
}
