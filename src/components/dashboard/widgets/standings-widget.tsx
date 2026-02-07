"use client";

import Link from "next/link";
import { useOpenF1 } from "@/hooks/use-openf1";
import { DriverAvatar } from "@/components/shared/driver-avatar";
import { getTeamColor } from "@/lib/utils/colors";
import { Skeleton } from "@/components/ui/skeleton";

export function StandingsWidget() {
  const { data: standings, isLoading: standingsLoading } = useOpenF1(
    "championship_drivers",
    { session_key: "latest" }
  );

  const { data: driverInfo, isLoading: driversLoading } = useOpenF1(
    "drivers",
    { session_key: "latest" }
  );

  const isLoading = standingsLoading || driversLoading;

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="h-4 w-6" />
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-10 ml-auto" />
          </div>
        ))}
      </div>
    );
  }

  const driverMap = new Map(
    driverInfo.map((d) => [d.driver_number, d])
  );

  const top = [...standings]
    .sort((a, b) => a.position_current - b.position_current)
    .slice(0, 10);

  return (
    <div className="space-y-1">
      {top.map((s) => {
        const driver = driverMap.get(s.driver_number);
        return (
          <div
            key={s.driver_number}
            className="flex items-center gap-3 py-1.5 px-1 rounded-md hover:bg-muted/50 transition-colors"
          >
            <span className="w-5 text-sm font-bold text-muted-foreground text-right">
              {s.position_current}
            </span>
            <DriverAvatar
              headshotUrl={driver?.headshot_url ?? null}
              nameAcronym={driver?.name_acronym ?? String(s.driver_number)}
              teamColour={driver?.team_colour ?? null}
              size="sm"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {driver?.full_name ?? `#${s.driver_number}`}
              </p>
              <p className="text-[10px] text-muted-foreground">
                {driver?.team_name}
              </p>
            </div>
            <span className="font-mono text-sm font-bold">
              {s.points_current}
            </span>
          </div>
        );
      })}
      <Link
        href="/standings"
        className="block text-xs text-center text-muted-foreground hover:text-foreground pt-2"
      >
        View full standings →
      </Link>
    </div>
  );
}
