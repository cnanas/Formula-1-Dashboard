"use client";

import { useState } from "react";
import Link from "next/link";
import { useOpenF1 } from "@/hooks/use-openf1";
import { DriverAvatar } from "@/components/shared/driver-avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const CURRENT_YEAR = new Date().getFullYear();
const PREVIOUS_YEAR = CURRENT_YEAR - 1;

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

interface StandingsWidgetProps {
  onYearChange?: (year: number) => void;
}

export function StandingsWidget({ onYearChange }: StandingsWidgetProps) {
  const [selectedYear, setSelectedYear] = useState(CURRENT_YEAR);

  const handleYearChange = (year: number) => {
    setSelectedYear(year);
    onYearChange?.(year);
  };

  // Get sessions for the selected year
  const { data: sessions, isLoading: sessionsLoading } = useOpenF1("sessions", {
    year: selectedYear,
  });

  // Find the most recent completed race session
  const latestSession = sessions
    .filter((s) => s.session_type === "Race" && new Date(s.date_start) < new Date())
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

  const top = [...standings]
    .sort((a, b) => a.position_current - b.position_current)
    .slice(0, 10);

  // Calculate max points for relative bar width
  const maxPoints = top[0]?.points_current ?? 1;

  return (
    <div className="space-y-3">
      {/* Season toggle tabs */}
      <div className="flex gap-1 p-1 bg-muted/50 rounded-lg w-fit">
        <button
          className={cn(
            "px-3 py-1 text-xs font-medium rounded-md transition-colors",
            selectedYear === CURRENT_YEAR
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
          onClick={() => handleYearChange(CURRENT_YEAR)}
        >
          {CURRENT_YEAR}
        </button>
        <button
          className={cn(
            "px-3 py-1 text-xs font-medium rounded-md transition-colors",
            selectedYear === PREVIOUS_YEAR
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
          onClick={() => handleYearChange(PREVIOUS_YEAR)}
        >
          {PREVIOUS_YEAR}
        </button>
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
            No standings data available for {selectedYear}
          </p>
        </div>
      ) : (
        <div className="space-y-1">
          {top.map((s) => {
            const driver = driverMap.get(s.driver_number);
            const pointsWidth = (s.points_current / maxPoints) * 100;
            
            return (
              <div
                key={s.driver_number}
                className="flex items-center gap-3 py-2 px-2 rounded-xl hover:bg-muted/50 transition-colors group"
              >
                {/* Position badge */}
                <div
                  className={cn(
                    "flex items-center justify-center h-7 w-7 rounded-full text-xs font-bold",
                    getPositionBadgeStyle(s.position_current)
                  )}
                >
                  {s.position_current}
                </div>

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

                {/* Points */}
                <div className="text-right">
                  <span className="text-sm font-bold tabular-nums">
                    {s.points_current}
                  </span>
                  <span className="text-xs text-muted-foreground ml-1">pts</span>
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
