"use client";

import { useMemo, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useOpenF1 } from "@/hooks/use-openf1";
import { DriverAvatar } from "@/components/shared/driver-avatar";
import { getTeamColor } from "@/lib/utils/colors";
import { FLAG_COLORS } from "@/lib/constants/flags";
import { cn } from "@/lib/utils";
import { SessionSocialCards } from "@/components/sessions/session-social-cards";
import { Zap, Gauge, Flag, AlertTriangle, Info } from "lucide-react";

interface SessionStatsProps {
  sessionKey: string;
}

type GridColumns = 1 | 2 | 3;
const GRID_COLUMNS_STORAGE_KEY = "f1dash_session_stats_grid_columns_v1";

export function SessionStats({ sessionKey }: SessionStatsProps) {
  const [gridColumns, setGridColumns] = useState<GridColumns>(() => {
    if (typeof window === "undefined") return 3;
    try {
      const saved = Number(localStorage.getItem(GRID_COLUMNS_STORAGE_KEY));
      return saved === 1 || saved === 2 || saved === 3 ? saved : 3;
    } catch {
      return 3;
    }
  });

  const { data: results, isLoading: resultsLoading } = useOpenF1(
    "session_result",
    { session_key: sessionKey },
    { enabled: !!sessionKey }
  );

  const { data: laps, isLoading: lapsLoading } = useOpenF1(
    "laps",
    { session_key: sessionKey },
    { enabled: !!sessionKey }
  );

  const { data: drivers, isLoading: driversLoading } = useOpenF1(
    "drivers",
    { session_key: sessionKey },
    { enabled: !!sessionKey }
  );

  const { data: startingGrid, isLoading: startingGridLoading } = useOpenF1(
    "starting_grid",
    { session_key: sessionKey },
    { enabled: !!sessionKey }
  );

  const { data: raceControl, isLoading: raceControlLoading } = useOpenF1(
    "race_control",
    { session_key: sessionKey },
    { enabled: !!sessionKey }
  );

  const { data: sessionMeta } = useOpenF1(
    "sessions",
    { session_key: sessionKey },
    { enabled: !!sessionKey }
  );
  const sessionInfo = sessionMeta[0];

  const { data: meetingMeta } = useOpenF1(
    "meetings",
    { meeting_key: sessionInfo?.meeting_key },
    { enabled: !!sessionInfo?.meeting_key }
  );
  const meetingInfo = meetingMeta[0];

  const driverMap = useMemo(
    () => new Map(drivers.map((d) => [d.driver_number, d])),
    [drivers]
  );

  const top22Data = useMemo(() => {
    const gridPosByDriver = new Map(
      startingGrid.map((entry) => [entry.driver_number, entry.position])
    );

    if (results.length > 0) {
      return results
        .slice()
        .sort((a, b) => a.position - b.position)
        .slice(0, 22)
        .map((result) => ({
          driverNumber: result.driver_number,
          position: result.position,
          laps: result.number_of_laps ?? null,
          gridPosition: gridPosByDriver.get(result.driver_number) ?? null,
          delta:
            gridPosByDriver.get(result.driver_number) != null
              ? gridPosByDriver.get(result.driver_number)! - result.position
              : null,
          status: result.dnf ? "DNF" : result.dns ? "DNS" : result.dsq ? "DSQ" : null,
        }));
    }

    if (laps.length === 0) return [];

    const bestByDriver = new Map<number, number>();
    const lapCountByDriver = new Map<number, number>();
    for (const lap of laps) {
      if (lap.lap_duration != null && !lap.is_pit_out_lap) {
        const current = bestByDriver.get(lap.driver_number);
        if (current == null || lap.lap_duration < current) {
          bestByDriver.set(lap.driver_number, lap.lap_duration);
        }
        lapCountByDriver.set(
          lap.driver_number,
          (lapCountByDriver.get(lap.driver_number) ?? 0) + 1
        );
      }
    }

    return Array.from(bestByDriver.entries())
      .map(([driverNumber, bestLap]) => ({
        driverNumber,
        bestLap,
        laps: lapCountByDriver.get(driverNumber) ?? 0,
      }))
      .sort((a, b) => a.bestLap - b.bestLap)
      .slice(0, 22)
      .map((entry, index) => ({
        driverNumber: entry.driverNumber,
        position: index + 1,
        laps: entry.laps,
        gridPosition: gridPosByDriver.get(entry.driverNumber) ?? null,
        delta:
          gridPosByDriver.get(entry.driverNumber) != null
            ? gridPosByDriver.get(entry.driverNumber)! - (index + 1)
            : null,
        status: null,
      }));
  }, [results, laps, startingGrid]);

  const raceControlItems = useMemo(
    () =>
      [...raceControl].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      ),
    [raceControl]
  );

  const classificationRows = useMemo(() => {
    if (laps.length === 0 && results.length === 0) return [];

    const lapSummary = new Map<number, { bestLap: number | null; laps: number }>();
    for (const lap of laps) {
      const existing = lapSummary.get(lap.driver_number) ?? { bestLap: null, laps: 0 };
      if (!lap.is_pit_out_lap) {
        existing.laps += 1;
      }
      if (lap.lap_duration != null && !lap.is_pit_out_lap) {
        existing.bestLap =
          existing.bestLap == null ? lap.lap_duration : Math.min(existing.bestLap, lap.lap_duration);
      }
      lapSummary.set(lap.driver_number, existing);
    }

    if (results.length > 0) {
      const ranked = [...results]
        .sort((a, b) => a.position - b.position)
        .map((result) => {
          const lapData = lapSummary.get(result.driver_number);
          const driver = driverMap.get(result.driver_number);
          return {
            position: result.position,
            driverNumber: result.driver_number,
            driverName: driver?.full_name ?? driver?.broadcast_name ?? `#${result.driver_number}`,
            teamName: driver?.team_name ?? "Unknown",
            bestLap: lapData?.bestLap ?? null,
            laps: lapData?.laps ?? result.number_of_laps ?? 0,
          };
        });

      const fastestLap = ranked.reduce<number | null>((acc, row) => {
        if (row.bestLap == null) return acc;
        return acc == null ? row.bestLap : Math.min(acc, row.bestLap);
      }, null);

      return ranked.map((row) => ({
        ...row,
        gapToFastest:
          fastestLap != null && row.bestLap != null ? Math.max(0, row.bestLap - fastestLap) : null,
      }));
    }

    const ranked = Array.from(lapSummary.entries())
      .map(([driverNumber, data]) => {
        const driver = driverMap.get(driverNumber);
        return {
          driverNumber,
          driverName: driver?.full_name ?? driver?.broadcast_name ?? `#${driverNumber}`,
          teamName: driver?.team_name ?? "Unknown",
          bestLap: data.bestLap,
          laps: data.laps,
        };
      })
      .sort((a, b) => {
        if (a.bestLap == null && b.bestLap == null) return a.driverNumber - b.driverNumber;
        if (a.bestLap == null) return 1;
        if (b.bestLap == null) return -1;
        return a.bestLap - b.bestLap;
      })
      .map((row, index) => ({ ...row, position: index + 1 }));

    const fastestLap = ranked.find((row) => row.bestLap != null)?.bestLap ?? null;

    return ranked.map((row) => ({
      ...row,
      gapToFastest:
        fastestLap != null && row.bestLap != null ? Math.max(0, row.bestLap - fastestLap) : null,
    }));
  }, [laps, results, driverMap]);

  const sectorWinners = useMemo(() => {
    const winners = {
      1: null as { driverNumber: number; sectorTime: number } | null,
      2: null as { driverNumber: number; sectorTime: number } | null,
      3: null as { driverNumber: number; sectorTime: number } | null,
    };

    for (const lap of laps) {
      if (
        lap.duration_sector_1 != null &&
        (winners[1] == null || lap.duration_sector_1 < winners[1].sectorTime)
      ) {
        winners[1] = { driverNumber: lap.driver_number, sectorTime: lap.duration_sector_1 };
      }
      if (
        lap.duration_sector_2 != null &&
        (winners[2] == null || lap.duration_sector_2 < winners[2].sectorTime)
      ) {
        winners[2] = { driverNumber: lap.driver_number, sectorTime: lap.duration_sector_2 };
      }
      if (
        lap.duration_sector_3 != null &&
        (winners[3] == null || lap.duration_sector_3 < winners[3].sectorTime)
      ) {
        winners[3] = { driverNumber: lap.driver_number, sectorTime: lap.duration_sector_3 };
      }
    }

    return ([1, 2, 3] as const)
      .map((sector) => {
        const winner = winners[sector];
        if (!winner) return null;
        const driver = driverMap.get(winner.driverNumber);
        return {
          sector,
          driverNumber: winner.driverNumber,
          driverName: driver?.full_name ?? driver?.broadcast_name ?? `#${winner.driverNumber}`,
          teamName: driver?.team_name ?? "Unknown",
          sectorTime: winner.sectorTime,
        };
      })
      .filter((entry): entry is NonNullable<typeof entry> => entry !== null);
  }, [laps, driverMap]);

  const eventTitle = meetingInfo?.meeting_name
    ? meetingInfo.meeting_name.toUpperCase()
    : sessionInfo?.circuit_short_name
    ? `${sessionInfo.circuit_short_name} SESSION`.toUpperCase()
    : "SESSION";

  const sessionTitle = sessionInfo?.session_name ? sessionInfo.session_name.toUpperCase() : "SESSION";

  const updateGridColumns = (value: GridColumns) => {
    setGridColumns(value);
    try {
      localStorage.setItem(GRID_COLUMNS_STORAGE_KEY, String(value));
    } catch {
      // Ignore storage write failures
    }
  };

  const detailsGridClass = useMemo(() => {
    if (gridColumns === 1) return "grid-cols-1";
    if (gridColumns === 2) return "grid-cols-1 md:grid-cols-2";
    return "grid-cols-1 md:grid-cols-2 xl:grid-cols-3";
  }, [gridColumns]);

  // Compute fastest sector times per driver
  const sectorData = useMemo(() => {
    if (laps.length === 0 || drivers.length === 0) return [];

    const driverBest = new Map<
      number,
      { s1: number | null; s2: number | null; s3: number | null; bestLap: number | null }
    >();

    for (const lap of laps) {
      const existing = driverBest.get(lap.driver_number);
      if (!existing) {
        driverBest.set(lap.driver_number, {
          s1: lap.duration_sector_1,
          s2: lap.duration_sector_2,
          s3: lap.duration_sector_3,
          bestLap: lap.lap_duration,
        });
        continue;
      }
      if (lap.duration_sector_1 !== null && (existing.s1 === null || lap.duration_sector_1 < existing.s1)) {
        existing.s1 = lap.duration_sector_1;
      }
      if (lap.duration_sector_2 !== null && (existing.s2 === null || lap.duration_sector_2 < existing.s2)) {
        existing.s2 = lap.duration_sector_2;
      }
      if (lap.duration_sector_3 !== null && (existing.s3 === null || lap.duration_sector_3 < existing.s3)) {
        existing.s3 = lap.duration_sector_3;
      }
      if (lap.lap_duration !== null && (existing.bestLap === null || lap.lap_duration < existing.bestLap)) {
        existing.bestLap = lap.lap_duration;
      }
    }

    // Find overall fastest per sector
    let fastestS1 = Infinity;
    let fastestS2 = Infinity;
    let fastestS3 = Infinity;
    for (const v of driverBest.values()) {
      if (v.s1 !== null && v.s1 < fastestS1) fastestS1 = v.s1;
      if (v.s2 !== null && v.s2 < fastestS2) fastestS2 = v.s2;
      if (v.s3 !== null && v.s3 < fastestS3) fastestS3 = v.s3;
    }

    const entries = Array.from(driverBest.entries()).map(([driverNumber, best]) => {
      const driver = driverMap.get(driverNumber);
      return {
        driverNumber,
        driver,
        ...best,
        isFastestS1: best.s1 !== null && best.s1 === fastestS1,
        isFastestS2: best.s2 !== null && best.s2 === fastestS2,
        isFastestS3: best.s3 !== null && best.s3 === fastestS3,
      };
    });

    return entries
      .sort((a, b) => {
        if (a.bestLap === null && b.bestLap === null) return 0;
        if (a.bestLap === null) return 1;
        if (b.bestLap === null) return -1;
        return a.bestLap - b.bestLap;
      })
      .slice(0, 10);
  }, [laps, drivers, driverMap]);

  // Compute speed trap data per driver
  const speedData = useMemo(() => {
    if (laps.length === 0 || drivers.length === 0) return [];

    const driverSpeeds = new Map<
      number,
      { st: number | null; i1: number | null; i2: number | null }
    >();

    for (const lap of laps) {
      const existing = driverSpeeds.get(lap.driver_number);
      if (!existing) {
        driverSpeeds.set(lap.driver_number, {
          st: lap.st_speed,
          i1: lap.i1_speed,
          i2: lap.i2_speed,
        });
        continue;
      }
      if (lap.st_speed !== null && (existing.st === null || lap.st_speed > existing.st)) {
        existing.st = lap.st_speed;
      }
      if (lap.i1_speed !== null && (existing.i1 === null || lap.i1_speed > existing.i1)) {
        existing.i1 = lap.i1_speed;
      }
      if (lap.i2_speed !== null && (existing.i2 === null || lap.i2_speed > existing.i2)) {
        existing.i2 = lap.i2_speed;
      }
    }

    return Array.from(driverSpeeds.entries())
      .map(([driverNumber, speeds]) => ({
        driverNumber,
        driver: driverMap.get(driverNumber),
        ...speeds,
      }))
      .filter((e) => e.st !== null || e.i1 !== null || e.i2 !== null)
      .sort((a, b) => (b.st ?? 0) - (a.st ?? 0))
      .slice(0, 10);
  }, [laps, drivers, driverMap]);

  const speedTrapRows = useMemo(
    () =>
      speedData
        .filter((entry) => entry.st != null)
        .map((entry, index) => ({
          position: index + 1,
          driverNumber: entry.driverNumber,
          driverName:
            entry.driver?.full_name ??
            entry.driver?.broadcast_name ??
            entry.driver?.name_acronym ??
            `#${entry.driverNumber}`,
          teamName: entry.driver?.team_name ?? "Unknown",
          speed: entry.st ?? 0,
        })),
    [speedData]
  );

  const isLoading =
    resultsLoading ||
    lapsLoading ||
    driversLoading ||
    startingGridLoading ||
    raceControlLoading;

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="py-3">
            <CardContent className="p-4 space-y-3">
              {Array.from({ length: 5 }).map((_, j) => (
                <div key={j} className="flex items-center gap-4">
                  <Skeleton className="h-4 w-8" />
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-20 ml-auto" />
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {classificationRows.length > 0 && sectorWinners.length === 3 && speedTrapRows.length > 0 && (
        <SessionSocialCards
          eventTitle={eventTitle}
          sessionTitle={sessionTitle}
          circuitShortName={sessionInfo?.circuit_short_name ?? ""}
          classificationRows={classificationRows}
          sectorWinners={sectorWinners}
          speedTrapRows={speedTrapRows}
        />
      )}

      {/* Top 22 Grid Delta */}
      {top22Data.length > 0 ? (
        <Card className="py-3">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Top 22 Grid Delta</CardTitle>
          </CardHeader>
          <CardContent className="p-0 px-4">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="h-9 w-10 py-2 text-xs">Pos</TableHead>
                  <TableHead className="h-9 py-2 text-xs">Driver</TableHead>
                  <TableHead className="h-9 py-2 text-right text-xs">Grid</TableHead>
                  <TableHead className="h-9 py-2 text-right text-xs">Delta</TableHead>
                  <TableHead className="h-9 py-2 text-right text-xs">Laps</TableHead>
                  <TableHead className="hidden h-9 py-2 text-right text-xs sm:table-cell">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {top22Data.map((entry) => {
                  const driver = driverMap.get(entry.driverNumber);
                  return (
                    <TableRow key={entry.driverNumber} className="h-11">
                      <TableCell className="py-1.5 font-bold text-sm">
                        {entry.position}
                      </TableCell>
                      <TableCell className="py-1.5">
                        <div className="flex items-center gap-2">
                          <DriverAvatar
                            headshotUrl={driver?.headshot_url ?? null}
                            nameAcronym={driver?.name_acronym ?? String(entry.driverNumber)}
                            teamColour={driver?.team_colour ?? null}
                            size="sm"
                          />
                          <span className="font-medium text-sm">
                            {driver?.full_name ?? `#${entry.driverNumber}`}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="py-1.5 text-right font-mono text-xs text-muted-foreground">
                        {entry.gridPosition != null ? `G${entry.gridPosition}` : "G-"}
                      </TableCell>
                      <TableCell
                        className={cn(
                          "py-1.5 text-right font-mono text-xs",
                          entry.delta == null && "text-muted-foreground",
                          entry.delta != null && entry.delta > 0 && "text-emerald-500 font-semibold",
                          entry.delta != null && entry.delta < 0 && "text-red-500 font-semibold"
                        )}
                      >
                        {entry.delta == null ? "-" : entry.delta > 0 ? `+${entry.delta}` : entry.delta}
                      </TableCell>
                      <TableCell className="py-1.5 text-right font-mono text-xs">
                        {entry.laps ?? "-"}
                      </TableCell>
                      <TableCell className="hidden py-1.5 text-right text-xs sm:table-cell">
                        {entry.status && (
                          <span className="text-destructive font-medium">{entry.status}</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <p className="text-sm text-muted-foreground py-4">No Top 22 data available.</p>
      )}

      <div className="flex items-center justify-end gap-1">
        <span className="text-xs text-muted-foreground mr-1">Grid</span>
        <Button
          type="button"
          size="sm"
          variant={gridColumns === 1 ? "default" : "outline"}
          className="h-7 px-2 text-xs"
          onClick={() => updateGridColumns(1)}
        >
          1
        </Button>
        <Button
          type="button"
          size="sm"
          variant={gridColumns === 2 ? "default" : "outline"}
          className="h-7 px-2 text-xs"
          onClick={() => updateGridColumns(2)}
        >
          2
        </Button>
        <Button
          type="button"
          size="sm"
          variant={gridColumns === 3 ? "default" : "outline"}
          className="h-7 px-2 text-xs"
          onClick={() => updateGridColumns(3)}
        >
          3
        </Button>
      </div>

      {/* Grid for sectors, speeds, and race control */}
      <div className={cn("grid gap-4", detailsGridClass)}>
        {/* Fastest Sectors */}
        {sectorData.length > 0 && (
          <Card className="py-3">
            <CardHeader className="pb-3 flex flex-row items-center gap-2">
              <Zap className="h-4 w-4 text-purple-500" />
              <CardTitle className="text-base">Fastest Sectors</CardTitle>
            </CardHeader>
            <CardContent className="p-0 px-4">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="h-9 w-10 py-2 text-xs">Pos</TableHead>
                    <TableHead className="h-9 py-2 text-xs">Driver</TableHead>
                    <TableHead className="h-9 py-2 text-right text-xs">S1</TableHead>
                    <TableHead className="h-9 py-2 text-right text-xs">S2</TableHead>
                    <TableHead className="h-9 py-2 text-right text-xs">S3</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sectorData.map((entry, i) => (
                    <TableRow key={entry.driverNumber} className="h-11">
                      <TableCell className="py-1.5 font-bold text-sm">{i + 1}</TableCell>
                      <TableCell className="py-1.5">
                        <div className="flex items-center gap-2">
                          <span
                            className="h-2.5 w-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: getTeamColor(entry.driver?.team_colour ?? null) }}
                          />
                          <span className="font-medium text-sm">
                            {entry.driver?.name_acronym ?? `#${entry.driverNumber}`}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell
                        className={`py-1.5 text-right font-mono text-xs ${
                          entry.isFastestS1 ? "text-purple-500 font-bold" : ""
                        }`}
                      >
                        {entry.s1 !== null ? entry.s1.toFixed(3) : "-"}
                      </TableCell>
                      <TableCell
                        className={`py-1.5 text-right font-mono text-xs ${
                          entry.isFastestS2 ? "text-purple-500 font-bold" : ""
                        }`}
                      >
                        {entry.s2 !== null ? entry.s2.toFixed(3) : "-"}
                      </TableCell>
                      <TableCell
                        className={`py-1.5 text-right font-mono text-xs ${
                          entry.isFastestS3 ? "text-purple-500 font-bold" : ""
                        }`}
                      >
                        {entry.s3 !== null ? entry.s3.toFixed(3) : "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Speed Trap */}
        {speedData.length > 0 && (
          <Card className="py-3">
            <CardHeader className="pb-3 flex flex-row items-center gap-2">
              <Gauge className="h-4 w-4 text-blue-500" />
              <CardTitle className="text-base">Speed Trap Top 10</CardTitle>
            </CardHeader>
            <CardContent className="p-0 px-4">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="h-9 w-10 py-2 text-xs">Pos</TableHead>
                    <TableHead className="h-9 py-2 text-xs">Driver</TableHead>
                    <TableHead className="h-9 py-2 text-right text-xs">Speed</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {speedData.map((entry, i) => (
                    <TableRow key={entry.driverNumber} className="h-11">
                      <TableCell className="py-1.5 font-bold text-sm">{i + 1}</TableCell>
                      <TableCell className="py-1.5">
                        <div className="flex items-center gap-2">
                          <DriverAvatar
                            headshotUrl={entry.driver?.headshot_url ?? null}
                            nameAcronym={entry.driver?.name_acronym ?? String(entry.driverNumber)}
                            teamColour={entry.driver?.team_colour ?? null}
                            size="sm"
                          />
                          <span className="font-medium text-sm">
                            {entry.driver?.name_acronym ?? `#${entry.driverNumber}`}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="py-1.5 text-right font-mono text-xs font-bold">
                        {entry.st !== null ? `${entry.st.toFixed(1)}` : "-"}
                        <span className="text-muted-foreground font-normal ml-0.5">km/h</span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        <Card className="py-3">
          <CardHeader className="pb-3 flex flex-row items-center gap-2">
            <Flag className="h-4 w-4 text-amber-500" />
            <CardTitle className="text-base">Race Control</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {raceControlItems.length > 0 ? (
              <div className="max-h-[360px] overflow-y-auto divide-y divide-border">
                {raceControlItems.map((msg, index) => {
                  const flagColor = msg.flag ? FLAG_COLORS[msg.flag] ?? "#888" : null;
                  const Icon = flagColor
                    ? Flag
                    : msg.category === "SafetyCar"
                    ? AlertTriangle
                    : Info;
                  return (
                    <div key={`${msg.date}-${index}`} className="flex gap-3 px-4 py-2.5">
                      <div className="shrink-0 mt-0.5">
                        <Icon
                          className={cn(
                            "h-4 w-4",
                            !flagColor &&
                              (msg.category === "SafetyCar"
                                ? "text-yellow-500"
                                : "text-muted-foreground")
                          )}
                          style={flagColor ? { color: flagColor } : undefined}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm">{msg.message}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-muted-foreground">
                            {new Date(msg.date).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                              second: "2-digit",
                            })}
                          </span>
                          {msg.lap_number != null && (
                            <span className="text-xs text-muted-foreground">
                              Lap {msg.lap_number}
                            </span>
                          )}
                          {msg.flag && (
                            <span className="text-xs text-muted-foreground">
                              {msg.flag}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground p-4 text-center">
                No race control messages yet.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
