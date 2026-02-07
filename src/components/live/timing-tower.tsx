"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DriverAvatar } from "@/components/shared/driver-avatar";
import { TireBadge } from "@/components/shared/tire-badge";
import { formatGap } from "@/lib/utils/formatting";
import { getTeamColor } from "@/lib/utils/colors";
import type { Driver, Position, Interval, Stint } from "@/types/openf1";

interface TimingTowerProps {
  positions: Position[];
  intervals: Interval[];
  drivers: Driver[];
  stints: Stint[];
}

export function TimingTower({
  positions,
  intervals,
  drivers,
  stints,
}: TimingTowerProps) {
  // Get latest position per driver
  const latestPositions = new Map<number, Position>();
  for (const pos of positions) {
    const existing = latestPositions.get(pos.driver_number);
    if (!existing || new Date(pos.date) > new Date(existing.date)) {
      latestPositions.set(pos.driver_number, pos);
    }
  }

  // Get latest interval per driver
  const latestIntervals = new Map<number, Interval>();
  for (const interval of intervals) {
    const existing = latestIntervals.get(interval.driver_number);
    if (!existing || new Date(interval.date) > new Date(existing.date)) {
      latestIntervals.set(interval.driver_number, interval);
    }
  }

  // Get latest stint per driver
  const latestStints = new Map<number, Stint>();
  for (const stint of stints) {
    const existing = latestStints.get(stint.driver_number);
    if (!existing || stint.stint_number > existing.stint_number) {
      latestStints.set(stint.driver_number, stint);
    }
  }

  // Build driver info lookup
  const driverMap = new Map(drivers.map((d) => [d.driver_number, d]));

  // Sort by position
  const sortedDriverNumbers = [...latestPositions.entries()]
    .sort(([, a], [, b]) => a.position - b.position)
    .map(([num]) => num);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Live Timing</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">P</TableHead>
              <TableHead>Driver</TableHead>
              <TableHead className="text-right">Interval</TableHead>
              <TableHead className="text-right">Gap</TableHead>
              <TableHead className="hidden lg:table-cell">Tire</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedDriverNumbers.map((driverNumber) => {
              const pos = latestPositions.get(driverNumber);
              const interval = latestIntervals.get(driverNumber);
              const stint = latestStints.get(driverNumber);
              const driver = driverMap.get(driverNumber);

              return (
                <TableRow key={driverNumber}>
                  <TableCell className="font-bold">{pos?.position}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span
                        className="inline-block h-4 w-1 rounded-full"
                        style={{
                          backgroundColor: getTeamColor(
                            driver?.team_colour ?? null
                          ),
                        }}
                      />
                      <span className="font-mono font-medium text-sm">
                        {driver?.name_acronym ?? driverNumber}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm">
                    {formatGap(interval?.interval ?? null)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm">
                    {formatGap(interval?.gap_to_leader ?? null)}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    {stint && (
                      <TireBadge
                        compound={stint.compound}
                        age={
                          stint.lap_end
                            ? stint.lap_end - stint.lap_start + stint.tyre_age_at_start
                            : undefined
                        }
                      />
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
