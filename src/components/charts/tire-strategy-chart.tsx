"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { COMPOUND_COLORS } from "@/lib/constants/compounds";
import { getTeamColor } from "@/lib/utils/colors";
import type { Stint, Driver, Pit } from "@/types/openf1";

interface TireStrategyChartProps {
  stints: Stint[];
  drivers: Driver[];
  pits: Pit[];
  totalLaps: number;
}

export function TireStrategyChart({
  stints,
  drivers,
  pits,
  totalLaps,
}: TireStrategyChartProps) {
  const driverMap = new Map(drivers.map((d) => [d.driver_number, d]));

  // Group stints by driver
  const driverStints = new Map<number, Stint[]>();
  for (const stint of stints) {
    if (!driverStints.has(stint.driver_number)) {
      driverStints.set(stint.driver_number, []);
    }
    driverStints.get(stint.driver_number)!.push(stint);
  }

  // Sort drivers by their latest position or driver number
  const sortedDriverNumbers = [...driverStints.keys()].sort((a, b) => a - b);

  const maxLap = totalLaps || Math.max(
    ...stints.map((s) => s.lap_end ?? s.lap_start),
    50
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Tire Strategy</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-1.5">
          {/* Header - lap markers */}
          <div className="flex items-center gap-2 mb-2">
            <div className="w-20 shrink-0" />
            <div className="flex-1 flex justify-between text-xs text-muted-foreground">
              <span>Lap 1</span>
              <span>Lap {Math.round(maxLap / 2)}</span>
              <span>Lap {maxLap}</span>
            </div>
          </div>

          {/* Driver rows */}
          <TooltipProvider>
            {sortedDriverNumbers.map((driverNumber) => {
              const driver = driverMap.get(driverNumber);
              const driverStintList = driverStints.get(driverNumber) ?? [];
              const sorted = [...driverStintList].sort(
                (a, b) => a.stint_number - b.stint_number
              );

              return (
                <div
                  key={driverNumber}
                  className="flex items-center gap-2"
                >
                  {/* Driver label */}
                  <div className="w-20 shrink-0 flex items-center gap-1.5">
                    <span
                      className="inline-block h-3 w-1 rounded-full"
                      style={{
                        backgroundColor: getTeamColor(
                          driver?.team_colour ?? null
                        ),
                      }}
                    />
                    <span className="text-xs font-mono font-medium truncate">
                      {driver?.name_acronym ?? driverNumber}
                    </span>
                  </div>

                  {/* Stint bars */}
                  <div className="flex-1 flex h-6 rounded overflow-hidden bg-muted">
                    {sorted.map((stint) => {
                      const start = stint.lap_start;
                      const end = stint.lap_end ?? maxLap;
                      const width = ((end - start + 1) / maxLap) * 100;
                      const left = ((start - 1) / maxLap) * 100;
                      const color =
                        COMPOUND_COLORS[stint.compound] ??
                        COMPOUND_COLORS.UNKNOWN;
                      const stintLength = end - start + 1;

                      return (
                        <Tooltip key={stint.stint_number}>
                          <TooltipTrigger asChild>
                            <div
                              className="h-full relative cursor-default border-r border-background"
                              style={{
                                width: `${width}%`,
                                backgroundColor: color,
                                opacity: 0.85,
                              }}
                            >
                              {width > 8 && (
                                <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-black">
                                  {stint.compound.charAt(0)}
                                </span>
                              )}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="font-medium">{stint.compound}</p>
                            <p className="text-xs">
                              Laps {start}-{end} ({stintLength} laps)
                            </p>
                            <p className="text-xs">
                              Age at start: {stint.tyre_age_at_start} laps
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </TooltipProvider>

          {/* Legend */}
          <div className="flex items-center gap-4 mt-4 pt-2 border-t border-border">
            {Object.entries(COMPOUND_COLORS)
              .filter(([key]) => key !== "UNKNOWN")
              .map(([compound, color]) => (
                <div key={compound} className="flex items-center gap-1.5">
                  <span
                    className="inline-block h-3 w-3 rounded-sm border border-border"
                    style={{ backgroundColor: color }}
                  />
                  <span className="text-xs text-muted-foreground">
                    {compound}
                  </span>
                </div>
              ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
