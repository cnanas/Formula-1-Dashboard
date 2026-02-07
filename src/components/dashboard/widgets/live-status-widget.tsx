"use client";

import Link from "next/link";
import { Radio, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useSessionStatus } from "@/hooks/use-session-status";
import { useOpenF1 } from "@/hooks/use-openf1";
import { formatGap } from "@/lib/utils/formatting";
import { getTeamColor } from "@/lib/utils/colors";

export function LiveStatusWidget() {
  const { isLive, latestSession } = useSessionStatus();

  const { data: positions } = useOpenF1(
    "position",
    { session_key: "latest" },
    { enabled: isLive, refreshInterval: 4000 }
  );

  const { data: drivers } = useOpenF1(
    "drivers",
    { session_key: "latest" },
    { enabled: !!latestSession }
  );

  const { data: intervals } = useOpenF1(
    "intervals",
    { session_key: "latest" },
    { enabled: isLive, refreshInterval: 4000 }
  );

  const driverMap = new Map(drivers.map((d) => [d.driver_number, d]));

  if (!isLive) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center py-4">
        <Clock className="h-10 w-10 text-muted-foreground/30 mb-3" />
        <p className="text-sm font-medium">No Active Session</p>
        <p className="text-xs text-muted-foreground mt-1">
          {latestSession
            ? `Last: ${latestSession.session_name} - ${latestSession.circuit_short_name}`
            : "Waiting for next session"}
        </p>
      </div>
    );
  }

  // Get latest position per driver, sorted
  const latestPositions = new Map<number, number>();
  for (const pos of positions) {
    const existing = latestPositions.get(pos.driver_number);
    if (!existing || new Date(pos.date) > new Date()) {
      latestPositions.set(pos.driver_number, pos.position);
    }
  }

  // Get latest intervals
  const latestIntervals = new Map<number, number | null>();
  for (const iv of intervals) {
    latestIntervals.set(iv.driver_number, iv.gap_to_leader);
  }

  const topDrivers = [...latestPositions.entries()]
    .sort(([, a], [, b]) => a - b)
    .slice(0, 5);

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div>
          <Badge variant="destructive" className="animate-pulse mb-1">
            <Radio className="h-3 w-3 mr-1" />
            LIVE
          </Badge>
          <p className="text-sm font-medium">
            {latestSession?.session_name}
          </p>
          <p className="text-xs text-muted-foreground">
            {latestSession?.circuit_short_name}
          </p>
        </div>
      </div>

      {/* Mini timing */}
      <div className="space-y-1.5">
        {topDrivers.map(([driverNumber, position]) => {
          const driver = driverMap.get(driverNumber);
          const gap = latestIntervals.get(driverNumber);
          return (
            <div
              key={driverNumber}
              className="flex items-center gap-2 text-sm"
            >
              <span className="w-5 font-bold text-muted-foreground text-right">
                {position}
              </span>
              <span
                className="h-3 w-1 rounded-full"
                style={{
                  backgroundColor: getTeamColor(driver?.team_colour ?? null),
                }}
              />
              <span className="font-mono font-medium flex-1">
                {driver?.name_acronym ?? driverNumber}
              </span>
              <span className="font-mono text-xs text-muted-foreground">
                {formatGap(gap ?? null)}
              </span>
            </div>
          );
        })}
      </div>

      <Link href="/live" className="block mt-3">
        <Button variant="outline" size="sm" className="w-full text-xs">
          Open Live Timing →
        </Button>
      </Link>
    </div>
  );
}
