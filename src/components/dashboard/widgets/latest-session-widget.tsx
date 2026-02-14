"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { LayoutList, Zap, Gauge, Flag, AlertTriangle, Info } from "lucide-react";
import { useOpenF1 } from "@/hooks/use-openf1";
import { useSeason } from "@/providers/season-provider";
import { SessionSocialCards } from "@/components/sessions/session-social-cards";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FLAG_COLORS } from "@/lib/constants/flags";
import { cn } from "@/lib/utils";

export function LatestSessionWidget() {
  const { season } = useSeason();
  const [selectedSessionKey, setSelectedSessionKey] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const [widgetSize, setWidgetSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    const observer = new ResizeObserver(([entry]) => {
      if (!entry) return;
      const next = {
        width: Math.round(entry.contentRect.width),
        height: Math.round(entry.contentRect.height),
      };
      setWidgetSize((prev) =>
        prev.width === next.width && prev.height === next.height ? prev : next
      );
    });

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  // Get all sessions for the season
  const { data: sessions, isLoading: sessionsLoading } = useOpenF1("sessions", {
    year: season,
  });

  // Fallback to previous year if no sessions in current year
  const { data: prevYearSessions, isLoading: prevYearLoading } = useOpenF1(
    "sessions",
    { year: season - 1 },
    { enabled: !sessionsLoading && sessions.length === 0 }
  );

  const allSessions = sessions.length > 0 ? sessions : prevYearSessions;
  const effectiveSeason = sessions.length > 0 ? season : season - 1;

  const startedSessions = useMemo(() => {
    const now = new Date();
    return [...allSessions]
      .filter((s) => new Date(s.date_start) < now)
      .sort((a, b) => new Date(b.date_start).getTime() - new Date(a.date_start).getTime());
  }, [allSessions]);

  const completedSessions = useMemo(() => {
    const now = new Date().getTime();
    return startedSessions.filter((s) => {
      const end = s.date_end ? new Date(s.date_end).getTime() : NaN;
      return Number.isFinite(end) && end <= now;
    });
  }, [startedSessions]);

  const autoSession = completedSessions[0] ?? startedSessions[0];
  const selectedSession =
    startedSessions.find((s) => s.session_key.toString() === selectedSessionKey) ?? autoSession;
  const sessionKey = selectedSession?.session_key?.toString();

  const { data: results } = useOpenF1(
    "session_result",
    { session_key: sessionKey },
    { enabled: !!sessionKey }
  );

  const { data: drivers, isLoading: driversLoading } = useOpenF1(
    "drivers",
    { session_key: sessionKey },
    { enabled: !!sessionKey }
  );

  const { data: laps } = useOpenF1(
    "laps",
    { session_key: sessionKey },
    { enabled: !!sessionKey }
  );

  const { data: raceControl } = useOpenF1(
    "race_control",
    { session_key: sessionKey },
    { enabled: !!sessionKey }
  );

  const { data: meetings } = useOpenF1(
    "meetings",
    { year: effectiveSeason },
    { enabled: !!selectedSession }
  );

  const meetingMap = useMemo(
    () => new Map(meetings.map((m) => [m.meeting_key, m.meeting_name])),
    [meetings]
  );
  const meetingName = selectedSession ? meetingMap.get(selectedSession.meeting_key) : null;

  const driverMap = useMemo(
    () => new Map(drivers.map((d) => [d.driver_number, d])),
    [drivers]
  );

  // Fastest driver per sector (single fastest time for S1, S2, S3)
  const fastestSectors = useMemo(() => {
    if (laps.length === 0) return [];
    let bestS1: { driver_number: number; time: number } | null = null;
    let bestS2: { driver_number: number; time: number } | null = null;
    let bestS3: { driver_number: number; time: number } | null = null;
    for (const lap of laps) {
      if (lap.duration_sector_1 != null && (!bestS1 || lap.duration_sector_1 < bestS1.time)) {
        bestS1 = { driver_number: lap.driver_number, time: lap.duration_sector_1 };
      }
      if (lap.duration_sector_2 != null && (!bestS2 || lap.duration_sector_2 < bestS2.time)) {
        bestS2 = { driver_number: lap.driver_number, time: lap.duration_sector_2 };
      }
      if (lap.duration_sector_3 != null && (!bestS3 || lap.duration_sector_3 < bestS3.time)) {
        bestS3 = { driver_number: lap.driver_number, time: lap.duration_sector_3 };
      }
    }
    return [
      bestS1 && { sector: 1 as const, ...bestS1 },
      bestS2 && { sector: 2 as const, ...bestS2 },
      bestS3 && { sector: 3 as const, ...bestS3 },
    ].filter(Boolean) as { sector: 1 | 2 | 3; driver_number: number; time: number }[];
  }, [laps]);

  // Speed trap top 10 (max st_speed per driver)
  const speedTrapTop10 = useMemo(() => {
    if (laps.length === 0) return [];
    const maxByDriver = new Map<number, number>();
    for (const lap of laps) {
      if (lap.st_speed != null) {
        const current = maxByDriver.get(lap.driver_number);
        if (current == null || lap.st_speed > current) {
          maxByDriver.set(lap.driver_number, lap.st_speed);
        }
      }
    }
    return Array.from(maxByDriver.entries())
      .map(([driver_number, speed]) => ({ driver_number, speed }))
      .sort((a, b) => b.speed - a.speed)
      .slice(0, 10);
  }, [laps]);

  const classificationCardRows = useMemo(() => {
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
          const driver = driverMap.get(result.driver_number);
          const summary = lapSummary.get(result.driver_number);
          return {
            position: result.position,
            driverNumber: result.driver_number,
            driverName: driver?.full_name ?? driver?.broadcast_name ?? `#${result.driver_number}`,
            teamName: driver?.team_name ?? "Unknown",
            bestLap: summary?.bestLap ?? null,
            laps: summary?.laps ?? result.number_of_laps ?? 0,
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
      .map(([driverNumber, summary]) => {
        const driver = driverMap.get(driverNumber);
        return {
          driverNumber,
          driverName: driver?.full_name ?? driver?.broadcast_name ?? `#${driverNumber}`,
          teamName: driver?.team_name ?? "Unknown",
          bestLap: summary.bestLap,
          laps: summary.laps,
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

  const sectorCardRows = useMemo(
    () =>
      fastestSectors.map((entry) => {
        const driver = driverMap.get(entry.driver_number);
        return {
          sector: entry.sector,
          driverNumber: entry.driver_number,
          driverName: driver?.full_name ?? driver?.broadcast_name ?? `#${entry.driver_number}`,
          teamName: driver?.team_name ?? "Unknown",
          sectorTime: entry.time,
        };
      }),
    [fastestSectors, driverMap]
  );

  const speedCardRows = useMemo(
    () =>
      speedTrapTop10.map((entry, index) => {
        const driver = driverMap.get(entry.driver_number);
        return {
          position: index + 1,
          driverNumber: entry.driver_number,
          driverName: driver?.full_name ?? driver?.broadcast_name ?? `#${entry.driver_number}`,
          teamName: driver?.team_name ?? "Unknown",
          speed: entry.speed,
        };
      }),
    [speedTrapTop10, driverMap]
  );

  const topSpeed = useMemo(() => speedTrapTop10[0] ?? null, [speedTrapTop10]);

  const density = useMemo<"tight" | "compact" | "roomy">(() => {
    const { width, height } = widgetSize;
    if (width > 0 && width < 380) return "tight";
    if (height > 0 && height < 520) return "tight";
    if (width > 520 && height > 660) return "roomy";
    return "compact";
  }, [widgetSize]);

  const maxClassificationRows = useMemo(() => {
    if (density === "tight") return 12;
    if (density === "roomy") return 22;
    return 18;
  }, [density]);

  const raceControlMaxHeight = useMemo(() => {
    const baseHeight = widgetSize.height > 0 ? widgetSize.height : 560;
    const reservedHeight = density === "tight" ? 330 : density === "roomy" ? 300 : 320;
    return Math.max(150, baseHeight - reservedHeight);
  }, [density, widgetSize.height]);

  const raceControlItems = useMemo(
    () =>
      raceControl
        .slice()
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 24),
    [raceControl]
  );

  const isLoading = sessionsLoading || prevYearLoading || driversLoading;

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-4 w-40" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 py-1.5">
            <Skeleton className="h-5 w-5" />
            <Skeleton className="h-7 w-7 rounded-full" />
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-16 ml-auto" />
          </div>
        ))}
      </div>
    );
  }

  if (!selectedSession) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <p className="text-sm text-muted-foreground">
          No session data available
        </p>
      </div>
    );
  }

  const eventTitle = (meetingName ?? selectedSession.circuit_short_name ?? "Session").toUpperCase();
  const sessionTitle = selectedSession.session_name.toUpperCase();
  const selectWidthClass =
    density === "tight"
      ? "w-[128px] sm:w-[140px]"
      : density === "roomy"
      ? "w-[170px] sm:w-[190px]"
      : "w-[145px] sm:w-[165px]";
  const tabsHeightClass = density === "tight" ? "h-7" : "h-8";
  const tabTextClass = density === "tight" ? "text-[11px]" : "text-xs";

  return (
    <div ref={containerRef} className="h-full min-h-0 flex flex-col gap-2">
      {/* Session info */}
      <div className="flex shrink-0 items-center gap-2">
        <Select value={sessionKey ?? ""} onValueChange={setSelectedSessionKey}>
          <SelectTrigger className={cn("h-7 text-xs", selectWidthClass)}>
            <SelectValue placeholder="Select session" />
          </SelectTrigger>
          <SelectContent>
            {startedSessions.slice(0, 12).map((s) => (
              <SelectItem key={s.session_key} value={s.session_key.toString()}>
                {s.session_name} ·{" "}
                {new Date(s.date_start).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                })}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <p className="min-w-0 flex-1 truncate text-[11px] text-muted-foreground">
          {meetingName ?? "Unknown"}
        </p>

        {topSpeed && (
          <div className="text-right leading-tight">
            <p className={cn("text-[9px] text-muted-foreground uppercase tracking-wide", density === "tight" && "hidden sm:block")}>Top</p>
            <p className={cn("font-mono font-semibold", density === "tight" ? "text-xs" : "text-sm")}>
              {topSpeed.speed.toFixed(1)}
              <span className="text-[10px] font-normal text-muted-foreground ml-0.5">km/h</span>
            </p>
          </div>
        )}
      </div>

      <Tabs defaultValue="top22" className="w-full min-h-0 flex-1 flex flex-col">
        <TabsList className={cn("grid w-full grid-cols-4 shrink-0", tabsHeightClass)}>
          <TabsTrigger value="top22" className={cn("gap-1", tabTextClass)}>
            <LayoutList className="h-3.5 w-3.5" />
            Top 22
          </TabsTrigger>
          <TabsTrigger value="sectors" className={cn("gap-1", tabTextClass)}>
            <Zap className="h-3.5 w-3.5" />
            Sectors
          </TabsTrigger>
          <TabsTrigger value="speed" className={cn("gap-1", tabTextClass)}>
            <Gauge className="h-3.5 w-3.5" />
            Speed
          </TabsTrigger>
          <TabsTrigger value="race-control" className={cn("gap-1", tabTextClass)}>
            <Flag className="h-3.5 w-3.5" />
            Control
          </TabsTrigger>
        </TabsList>

        <TabsContent value="top22" className="mt-2 min-h-0 flex-1 space-y-0">
          {classificationCardRows.length > 0 ? (
            <SessionSocialCards
              eventTitle={eventTitle}
              sessionTitle={sessionTitle}
              circuitShortName={selectedSession.circuit_short_name}
              classificationRows={classificationCardRows}
              sectorWinners={sectorCardRows}
              speedTrapRows={speedCardRows}
              compact
              maxClassificationRows={maxClassificationRows}
              view="classification"
              minimalHeader
              density={density}
              className="h-full"
            />
          ) : (
            <p className="text-xs text-muted-foreground py-4 text-center">
              No Top 22 data yet.
            </p>
          )}
        </TabsContent>

        <TabsContent value="sectors" className="mt-2 min-h-0 flex-1 space-y-0">
          {sectorCardRows.length === 3 ? (
            <SessionSocialCards
              eventTitle={eventTitle}
              sessionTitle={sessionTitle}
              circuitShortName={selectedSession.circuit_short_name}
              classificationRows={classificationCardRows}
              sectorWinners={sectorCardRows}
              speedTrapRows={speedCardRows}
              compact
              view="sectors"
              minimalHeader
              density={density}
            />
          ) : (
            <p className="text-xs text-muted-foreground py-4 text-center">
              No sector data yet.
            </p>
          )}
        </TabsContent>

        <TabsContent value="speed" className="mt-2 min-h-0 flex-1 space-y-0">
          {speedCardRows.length > 0 ? (
            <SessionSocialCards
              eventTitle={eventTitle}
              sessionTitle={sessionTitle}
              circuitShortName={selectedSession.circuit_short_name}
              classificationRows={classificationCardRows}
              sectorWinners={sectorCardRows}
              speedTrapRows={speedCardRows}
              compact
              view="speed"
              minimalHeader
              density={density}
            />
          ) : (
            <p className="text-xs text-muted-foreground py-4 text-center">
              No speed trap data yet.
            </p>
          )}
        </TabsContent>

        <TabsContent value="race-control" className="mt-2 min-h-0 flex-1 space-y-0">
          {raceControlItems.length > 0 ? (
            <div className="space-y-1 overflow-y-auto pr-0.5" style={{ maxHeight: raceControlMaxHeight }}>
              {raceControlItems.map((msg, index) => {
                const flagColor = msg.flag ? FLAG_COLORS[msg.flag] ?? "#888" : null;
                const Icon = flagColor ? Flag : msg.category === "SafetyCar" ? AlertTriangle : Info;
                return (
                  <div
                    key={`${msg.date}-${index}`}
                    className="flex items-start gap-2 rounded-md bg-muted/30 px-2 py-1.5"
                  >
                    <Icon
                      className={cn(
                        "h-3.5 w-3.5 mt-0.5 shrink-0",
                        !flagColor && msg.category !== "SafetyCar" && "text-muted-foreground",
                        !flagColor && msg.category === "SafetyCar" && "text-yellow-500"
                      )}
                      style={flagColor ? { color: flagColor } : undefined}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs leading-snug">{msg.message}</p>
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-0.5">
                        <span>
                          {new Date(msg.date).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                          })}
                        </span>
                        {msg.lap_number != null && <span>Lap {msg.lap_number}</span>}
                        {msg.flag && <span>{msg.flag}</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground py-4 text-center">
              No race control messages yet.
            </p>
          )}
        </TabsContent>
      </Tabs>

      <Link
        href="/sessions"
        className="mt-auto flex items-center justify-center gap-1 pt-0.5 text-[11px] font-medium text-primary transition-colors hover:text-primary/80"
      >
        View all sessions
        <span className="text-lg leading-none">→</span>
      </Link>
    </div>
  );
}
