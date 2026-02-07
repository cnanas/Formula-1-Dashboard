"use client";

import { useState } from "react";
import useSWR from "swr";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { ChartTooltipContent } from "./chart-tooltip";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useOpenF1 } from "@/hooks/use-openf1";
import { getTeamColor } from "@/lib/utils/colors";
import { cn } from "@/lib/utils";
import type { ChampionshipDriver } from "@/types/openf1";

interface DriverStandingsEvolutionChartProps {
  year: number;
}

interface SessionHistory {
  sessionKey: number;
  standings: ChampionshipDriver[];
}

type DriverSelectionMode = "top5" | "top10" | "all" | "custom";

function raceLabel(name: string, fallback: number) {
  return name.length > 14 ? name.slice(0, 14) : name || `R${fallback}`;
}

export function DriverStandingsEvolutionChart({
  year,
}: DriverStandingsEvolutionChartProps) {
  const [selectionMode, setSelectionMode] = useState<DriverSelectionMode>("top10");
  const [customSelectedDriverNumbers, setCustomSelectedDriverNumbers] = useState<number[]>([]);
  const [hoveredDriverKey, setHoveredDriverKey] = useState<string | null>(null);

  const { data: sessions, isLoading: sessionsLoading } = useOpenF1("sessions", {
    year,
    session_type: "Race",
  });
  const { data: meetings } = useOpenF1("meetings", { year });

  const raceSessions = [...sessions]
    .filter((s) => new Date(s.date_start) < new Date())
    .sort((a, b) => new Date(a.date_start).getTime() - new Date(b.date_start).getTime());

  const sessionKeysStr = raceSessions.map((s) => s.session_key).join(",");

  const { data: history, isLoading: historyLoading } = useSWR<SessionHistory[]>(
    sessionKeysStr ? `standings-history:${sessionKeysStr}` : null,
    async () => {
      const sessionKeys = sessionKeysStr.split(",").map(Number).filter(Boolean);
      
      // Fetch in parallel batches of 5 to avoid rate limiting while being much faster
      const BATCH_SIZE = 5;
      const results: SessionHistory[] = [];
      
      for (let i = 0; i < sessionKeys.length; i += BATCH_SIZE) {
        const batch = sessionKeys.slice(i, i + BATCH_SIZE);
        const batchResults = await Promise.all(
          batch.map(async (sessionKey) => {
            let standings: ChampionshipDriver[] = [];
            for (let attempt = 0; attempt < 3; attempt += 1) {
              const res = await fetch(
                `/api/openf1/championship_drivers?session_key=${sessionKey}`
              );
              if (res.ok) {
                standings = await res.json();
                break;
              }
              await new Promise((resolve) => setTimeout(resolve, 100 * (attempt + 1)));
            }
            return { sessionKey, standings };
          })
        );
        results.push(...batchResults);
        
        // Small delay between batches to avoid rate limiting
        if (i + BATCH_SIZE < sessionKeys.length) {
          await new Promise((resolve) => setTimeout(resolve, 50));
        }
      }
      
      return results;
    },
    { revalidateOnFocus: false }
  );

  const latestSessionKey = raceSessions.at(-1)?.session_key?.toString();
  const { data: drivers } = useOpenF1(
    "drivers",
    { session_key: latestSessionKey },
    { enabled: !!latestSessionKey }
  );

  const isLoading = sessionsLoading || historyLoading;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Driver Standings Evolution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[320px] animate-pulse rounded-lg bg-muted" />
        </CardContent>
      </Card>
    );
  }

  if (!history?.length || raceSessions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Driver Standings Evolution</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground py-8 text-center">
            No race standings history available for {year}.
          </p>
        </CardContent>
      </Card>
    );
  }

  const meetingMap = new Map(meetings.map((m) => [m.meeting_key, m]));
  const historyMap = new Map(history.map((item) => [item.sessionKey, item.standings]));
  const driverMap = new Map(drivers.map((d) => [d.driver_number, d]));

  const finalStandings = historyMap.get(raceSessions.at(-1)!.session_key) ?? [];
  const sortedFinal = [...finalStandings].sort(
    (a, b) => a.position_current - b.position_current
  );
  const allFromFinal = sortedFinal.map((d) => d.driver_number);
  const allFromHistory = [...new Set(
    history.flatMap((entry) => entry.standings.map((s) => s.driver_number))
  )];
  const allFromDrivers = drivers.map((d) => d.driver_number);
  const allDriverNumbers = (allFromFinal.length > 0 ? allFromFinal : allFromHistory.length > 0 ? allFromHistory : allFromDrivers);

  if (allDriverNumbers.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Driver Standings Evolution</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground py-8 text-center">
            Could not load driver standings lines for {year}. Try refreshing.
          </p>
        </CardContent>
      </Card>
    );
  }

  const effectiveDriverNumbers = (() => {
    if (selectionMode === "top5") return allDriverNumbers.slice(0, 5);
    if (selectionMode === "top10") return allDriverNumbers.slice(0, 10);
    if (selectionMode === "all") return allDriverNumbers;

    const validCustom = customSelectedDriverNumbers.filter((dn) =>
      allDriverNumbers.includes(dn)
    );
    return validCustom.length > 0 ? validCustom : allDriverNumbers.slice(0, 10);
  })();

  const allDriverKeys = allDriverNumbers.map((driverNumber) => {
    const info = driverMap.get(driverNumber);
    return {
      driverNumber,
      key: info?.name_acronym ?? `#${driverNumber}`,
      color: getTeamColor(info?.team_colour ?? null),
    };
  });

  const pointsData = raceSessions.map((session, idx) => {
    const meeting = meetingMap.get(session.meeting_key);
    const row: Record<string, string | number | null> = {
      race: raceLabel(meeting?.circuit_short_name ?? "", idx + 1),
      fullName: meeting?.meeting_name ?? `Race ${idx + 1}`,
    };

    const standings = historyMap.get(session.session_key) ?? [];
    const standingMap = new Map(standings.map((s) => [s.driver_number, s]));
    for (const d of allDriverKeys) {
      row[d.key] = standingMap.get(d.driverNumber)?.points_current ?? null;
    }
    return row;
  });

  const rankingData = raceSessions.map((session, idx) => {
    const meeting = meetingMap.get(session.meeting_key);
    const row: Record<string, string | number | null> = {
      race: raceLabel(meeting?.circuit_short_name ?? "", idx + 1),
      fullName: meeting?.meeting_name ?? `Race ${idx + 1}`,
    };

    const standings = historyMap.get(session.session_key) ?? [];
    const standingMap = new Map(standings.map((s) => [s.driver_number, s]));
    for (const d of allDriverKeys) {
      row[d.key] = standingMap.get(d.driverNumber)?.position_current ?? null;
    }
    return row;
  });

  const selectedSet = new Set(effectiveDriverNumbers);
  const isActiveDriver = (driverNumber: number, key: string) =>
    hoveredDriverKey
      ? key === hoveredDriverKey
      : selectedSet.has(driverNumber);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <CardTitle className="text-base mr-2">Driver Standings Evolution</CardTitle>
            {[
              { label: "Top 5", mode: "top5" as const },
              { label: "Top 10", mode: "top10" as const },
              { label: "All", mode: "all" as const },
            ].map((preset) => (
              <Button
                key={preset.mode}
                size="sm"
                variant={selectionMode === preset.mode ? "default" : "outline"}
                className="h-7 text-xs px-2"
                onClick={() => setSelectionMode(preset.mode)}
              >
                {preset.label}
              </Button>
            ))}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 text-xs">
                Drivers ({effectiveDriverNumbers.length})
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>Select Drivers</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {allDriverNumbers.map((driverNumber) => {
                const info = driverMap.get(driverNumber);
                const label = info?.name_acronym ?? `#${driverNumber}`;
                const checked = effectiveDriverNumbers.includes(driverNumber);

                return (
                  <DropdownMenuCheckboxItem
                    key={driverNumber}
                    checked={checked}
                    onCheckedChange={(nextChecked) => {
                      setSelectionMode("custom");
                      setCustomSelectedDriverNumbers((prev) => {
                        const current = prev.length > 0 ? prev : allDriverNumbers.slice(0, 10);
                        if (nextChecked) {
                          return [...new Set([...current, driverNumber])];
                        }
                        if (current.length <= 1) return current;
                        return current.filter((dn) => dn !== driverNumber);
                      });
                    }}
                  >
                    {label}
                  </DropdownMenuCheckboxItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={340}>
            <LineChart data={pointsData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis
                dataKey="race"
                tick={{ fontSize: 11 }}
                angle={-35}
                textAnchor="end"
                height={65}
                interval={0}
                className="fill-muted-foreground"
              />
              <YAxis tick={{ fontSize: 12 }} className="fill-muted-foreground" />
              <Tooltip
                content={(props) => (
                  <ChartTooltipContent
                    {...props}
                    labelFormatter={(_, pl) => {
                      const first = pl[0] as { payload?: { fullName?: string } } | undefined;
                      return first?.payload?.fullName ?? "";
                    }}
                  />
                )}
              />
              {allDriverKeys.map((d) => (
                <Line
                  key={d.key}
                  type="monotone"
                  dataKey={d.key}
                  stroke={d.color}
                  strokeWidth={isActiveDriver(d.driverNumber, d.key) ? 2.5 : 1}
                  strokeOpacity={isActiveDriver(d.driverNumber, d.key) ? 1 : 0.15}
                  dot={isActiveDriver(d.driverNumber, d.key) ? { r: 2 } : false}
                  connectNulls
                  isAnimationActive={false}
                  onMouseEnter={() => setHoveredDriverKey(d.key)}
                  onMouseLeave={() => setHoveredDriverKey(null)}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
          <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1">
            {allDriverKeys.map((d) => {
              const active = isActiveDriver(d.driverNumber, d.key);
              return (
                <button
                  key={d.key}
                  type="button"
                  onClick={() => {
                    setSelectionMode("custom");
                    setCustomSelectedDriverNumbers((prev) => {
                      const current = prev.length > 0 ? prev : effectiveDriverNumbers;
                      if (current.includes(d.driverNumber)) {
                        if (current.length <= 1) return current;
                        return current.filter((dn) => dn !== d.driverNumber);
                      }
                      return [...current, d.driverNumber];
                    });
                  }}
                  className={cn(
                    "text-xs transition-opacity",
                    active ? "opacity-100 font-medium" : "opacity-45"
                  )}
                  style={{ color: d.color }}
                >
                  {d.key}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Driver Ranking Evolution</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={340}>
            <LineChart data={rankingData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis
                dataKey="race"
                tick={{ fontSize: 11 }}
                angle={-35}
                textAnchor="end"
                height={65}
                interval={0}
                className="fill-muted-foreground"
              />
              <YAxis
                reversed
                domain={[1, allDriverNumbers.length]}
                ticks={Array.from({ length: allDriverNumbers.length }, (_, i) => i + 1)}
                tick={{ fontSize: 12 }}
                className="fill-muted-foreground"
              />
              <Tooltip
                content={(props) => (
                  <ChartTooltipContent
                    {...props}
                    formatter={(value, name) => [`P${value}`, name]}
                    labelFormatter={(_, pl) => {
                      const first = pl[0] as { payload?: { fullName?: string } } | undefined;
                      return first?.payload?.fullName ?? "";
                    }}
                  />
                )}
              />
              {allDriverKeys.map((d) => (
                <Line
                  key={d.key}
                  type="stepAfter"
                  dataKey={d.key}
                  stroke={d.color}
                  strokeWidth={isActiveDriver(d.driverNumber, d.key) ? 2.5 : 1}
                  strokeOpacity={isActiveDriver(d.driverNumber, d.key) ? 1 : 0.15}
                  dot={isActiveDriver(d.driverNumber, d.key) ? { r: 2 } : false}
                  connectNulls
                  isAnimationActive={false}
                  onMouseEnter={() => setHoveredDriverKey(d.key)}
                  onMouseLeave={() => setHoveredDriverKey(null)}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
          <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1">
            {allDriverKeys.map((d) => {
              const active = isActiveDriver(d.driverNumber, d.key);
              return (
                <button
                  key={d.key}
                  type="button"
                  onClick={() => {
                    setSelectionMode("custom");
                    setCustomSelectedDriverNumbers((prev) => {
                      const current = prev.length > 0 ? prev : effectiveDriverNumbers;
                      if (current.includes(d.driverNumber)) {
                        if (current.length <= 1) return current;
                        return current.filter((dn) => dn !== d.driverNumber);
                      }
                      return [...current, d.driverNumber];
                    });
                  }}
                  className={cn(
                    "text-xs transition-opacity",
                    active ? "opacity-100 font-medium" : "opacity-45"
                  )}
                  style={{ color: d.color }}
                >
                  {d.key}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
