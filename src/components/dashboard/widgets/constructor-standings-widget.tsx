"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Calendar } from "lucide-react";
import { useOpenF1 } from "@/hooks/use-openf1";
import { useSeason, getDefaultWidgetSeason } from "@/providers/season-provider";
import { getTeamColor } from "@/lib/utils/colors";
import { Skeleton } from "@/components/ui/skeleton";
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

export function ConstructorStandingsWidget() {
  const { season: globalSeason, availableSeasons } = useSeason();
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
    "championship_teams",
    { session_key: sessionKey },
    { enabled: !!sessionKey }
  );

  const { data: driverInfo } = useOpenF1(
    "drivers",
    { session_key: sessionKey },
    { enabled: !!sessionKey }
  );

  const isLoading = sessionsLoading || standingsLoading;

  const sorted = [...standings]
    .sort((a, b) => a.position_current - b.position_current)
    .slice(0, 10);

  // Get the max points for the progress bars
  const maxPoints = sorted[0]?.points_current ?? 1;

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
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="flex items-center gap-3">
                <Skeleton className="h-7 w-7 rounded-full" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-12 ml-auto" />
              </div>
              <Skeleton className="h-2 w-full rounded-full" />
            </div>
          ))}
        </div>
      ) : sorted.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <p className="text-sm text-muted-foreground">
            No standings data available for {season}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {sorted.map((team) => {
            const teamDriver = driverInfo.find(
              (d) => d.team_name === team.team_name
            );
            const color = getTeamColor(teamDriver?.team_colour ?? null);
            const pct = (team.points_current / maxPoints) * 100;

            return (
              <div key={team.team_name} className="space-y-2">
                <div className="flex items-center gap-3">
                  {/* Position badge */}
                  <div
                    className={cn(
                      "flex items-center justify-center h-7 w-7 rounded-full text-xs font-bold",
                      getPositionBadgeStyle(team.position_current)
                    )}
                  >
                    {team.position_current}
                  </div>

                  {/* Team color bar */}
                  <div
                    className="h-5 w-1.5 rounded-full"
                    style={{ backgroundColor: color }}
                  />

                  {/* Team name */}
                  <span className="flex-1 text-sm font-semibold truncate">
                    {team.team_name}
                  </span>

                  {/* Points */}
                  <div className="text-right">
                    <span className="text-sm font-bold tabular-nums">
                      {team.points_current}
                    </span>
                    <span className="text-xs text-muted-foreground ml-1">pts</span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="h-2 rounded-full bg-muted/50 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${pct}%`, backgroundColor: color }}
                  />
                </div>
              </div>
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
