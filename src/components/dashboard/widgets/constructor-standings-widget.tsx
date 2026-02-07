"use client";

import Link from "next/link";
import { useOpenF1 } from "@/hooks/use-openf1";
import { getTeamColor } from "@/lib/utils/colors";
import { Skeleton } from "@/components/ui/skeleton";

export function ConstructorStandingsWidget() {
  const { data: standings, isLoading: standingsLoading } = useOpenF1(
    "championship_teams",
    { session_key: "latest" }
  );

  const { data: driverInfo } = useOpenF1("drivers", {
    session_key: "latest",
  });

  if (standingsLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="h-4 w-6" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-10 ml-auto" />
          </div>
        ))}
      </div>
    );
  }

  const sorted = [...standings]
    .sort((a, b) => a.position_current - b.position_current)
    .slice(0, 10);

  // Get the max points for the progress bars
  const maxPoints = sorted[0]?.points_current ?? 1;

  return (
    <div className="space-y-2">
      {sorted.map((team) => {
        const teamDriver = driverInfo.find(
          (d) => d.team_name === team.team_name
        );
        const color = getTeamColor(teamDriver?.team_colour ?? null);
        const pct = (team.points_current / maxPoints) * 100;

        return (
          <div key={team.team_name} className="space-y-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-5 text-xs font-bold text-muted-foreground text-right">
                  {team.position_current}
                </span>
                <span
                  className="h-3 w-1 rounded-full"
                  style={{ backgroundColor: color }}
                />
                <span className="text-sm font-medium truncate">
                  {team.team_name}
                </span>
              </div>
              <span className="font-mono text-sm font-bold">
                {team.points_current}
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-muted ml-7">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${pct}%`, backgroundColor: color }}
              />
            </div>
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
