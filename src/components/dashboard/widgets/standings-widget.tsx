"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Calendar } from "lucide-react";
import { useOpenF1 } from "@/hooks/use-openf1";
import { useSeason, getDefaultWidgetSeason } from "@/providers/season-provider";
import { useTeamFilter } from "@/providers/team-filter-provider";
import { DriverAvatar } from "@/components/shared/driver-avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

// Position badge colors
function getPositionBadgeStyle(position: number) {
  switch (position) {
    case 1:
      return "bg-yellow-500 text-yellow-950";
    case 2:
      return "bg-gray-300 text-gray-800";
    case 3:
      return "bg-amber-600 text-amber-950";
    default:
      return "bg-muted text-muted-foreground";
  }
}

export function StandingsWidget() {
  const { season: globalSeason, availableSeasons } = useSeason();
  const { selectedTeam: teamFilter } = useTeamFilter();
  const [widgetSeason, setWidgetSeason] = useState(() => getDefaultWidgetSeason(globalSeason));
  const prevGlobalSeasonRef = useRef<number | null>(null);

  const season = widgetSeason;

  // Sync widget season when user changes the topbar season filter (not on mount)
  useEffect(() => {
    if (prevGlobalSeasonRef.current !== null && prevGlobalSeasonRef.current !== globalSeason) {
      setWidgetSeason(globalSeason);
    }
    prevGlobalSeasonRef.current = globalSeason;
  }, [globalSeason]);

  // Get sessions for the selected season
  const { data: sessions, isLoading: sessionsLoading } = useOpenF1("sessions", {
    year: season,
    session_type: "Race",
  });

  // Find the most recent completed race session
  const latestSession = sessions
    .filter((s) => new Date(s.date_start) < new Date())
    .sort((a, b) => new Date(b.date_start).getTime() - new Date(a.date_start).getTime())[0];

  const sessionKey = latestSession?.session_key?.toString();

  const { data: standings, isLoading: standingsLoading } = useOpenF1(
    "championship_drivers",
    { session_key: sessionKey },
    { enabled: !!sessionKey }
  );

  const { data: driverInfo, isLoading: driversLoading } = useOpenF1(
    "drivers",
    { session_key: sessionKey },
    { enabled: !!sessionKey }
  );

  const isLoading = sessionsLoading || standingsLoading || driversLoading;

  const driverMap = new Map(
    driverInfo.map((d) => [d.driver_number, d])
  );

  const top = useMemo(() => {
    const sorted = [...standings].sort((a, b) => a.position_current - b.position_current);
    return sorted.slice(0, 10);
  }, [standings]);

  const isDriverFromSelectedTeam = useMemo(() => {
    if (!teamFilter) return () => false;
    return (driverNumber: number) =>
      driverMap.get(driverNumber)?.team_name === teamFilter;
  }, [teamFilter, driverMap]);

  return (
    <div className="space-y-3">
      {/* Year selector */}
      <div className="flex items-center justify-between">
        <Select
          value={widgetSeason.toString()}
          onValueChange={(v) => setWidgetSeason(Number(v))}
        >
          <SelectTrigger className="h-7 w-auto gap-1.5 text-xs font-medium border-border/50">
            <Calendar className="h-3 w-3 text-muted-foreground" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent align="start">
            {availableSeasons.map((y) => (
              <SelectItem key={y} value={y.toString()}>
                {y}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 py-2">
              <Skeleton className="h-7 w-7 rounded-full" />
              <Skeleton className="h-9 w-9 rounded-full" />
              <div className="flex-1">
                <Skeleton className="h-4 w-28 mb-1" />
                <Skeleton className="h-3 w-20" />
              </div>
              <Skeleton className="h-5 w-12" />
            </div>
          ))}
        </div>
      ) : top.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <p className="text-sm text-muted-foreground">
            No standings data available for {season}
          </p>
        </div>
      ) : (
        <div className="space-y-1">
          {top.map((s, index) => {
            const driver = driverMap.get(s.driver_number);
            const isHighlighted = isDriverFromSelectedTeam(s.driver_number);
            return (
              <motion.div
                key={s.driver_number}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className={cn(
                  "flex items-center gap-3 py-2 px-2 rounded-xl transition-colors group",
                  isHighlighted
                    ? "bg-primary/10 ring-2 ring-primary/30 hover:bg-primary/15"
                    : "hover:bg-muted/50"
                )}
              >
                {/* Position badge */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.3, delay: index * 0.05 + 0.1 }}
                  className={cn(
                    "flex items-center justify-center h-7 w-7 rounded-full text-xs font-bold",
                    getPositionBadgeStyle(s.position_current)
                  )}
                >
                  {s.position_current}
                </motion.div>

                {/* Driver avatar */}
                <DriverAvatar
                  headshotUrl={driver?.headshot_url ?? null}
                  nameAcronym={driver?.name_acronym ?? String(s.driver_number)}
                  teamColour={driver?.team_colour ?? null}
                  size="sm"
                />

                {/* Driver info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">
                    {driver?.full_name ?? `#${s.driver_number}`}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {driver?.team_name}
                  </p>
                </div>

                {/* Points - Animated */}
                <div className="text-right">
                  <AnimatedCounter
                    value={s.points_current}
                    duration={1}
                    delay={index * 0.05}
                    className="text-sm font-bold"
                    suffix=" pts"
                  />
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* View all link */}
      <Link
        href="/standings"
        className="flex items-center justify-center gap-1 text-xs font-medium text-primary hover:text-primary/80 transition-colors pt-2"
      >
        View full standings
        <span className="text-lg leading-none">→</span>
      </Link>
    </div>
  );
}
