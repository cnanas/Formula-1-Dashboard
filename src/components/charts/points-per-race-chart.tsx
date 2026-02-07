"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { ChartTooltipContent } from "./chart-tooltip";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useOpenF1 } from "@/hooks/use-openf1";
import { useSeason } from "@/providers/season-provider";
import { getTeamColor } from "@/lib/utils/colors";
import type { ChampionshipDriver, Driver } from "@/types/openf1";

interface PointsPerRaceChartProps {
  /** Max drivers to show (default 5). Use 0 for all. */
  maxDrivers?: number;
}

export function PointsPerRaceChart({
  maxDrivers = 5,
}: PointsPerRaceChartProps) {
  const { season: year } = useSeason();

  const { data: sessions, isLoading: sessionsLoading } = useOpenF1("sessions", {
    year,
    session_type: "Race",
  });

  const { data: meetings } = useOpenF1("meetings", { year });

  const latestSessionKey = sessions
    ?.filter((s) => new Date(s.date_start) < new Date())
    ?.sort((a, b) => new Date(b.date_start).getTime() - new Date(a.date_start).getTime())[0]
    ?.session_key?.toString();

  const { data: drivers } = useOpenF1("drivers", {
    session_key: latestSessionKey ?? "",
  }, { enabled: !!latestSessionKey });

  // Fetch championship_drivers for each race session in parallel
  const [championshipBySession, setChampionshipBySession] = useState<
    Map<number, ChampionshipDriver[]>
  >(new Map());

  // Use stable dependency - session keys string - to avoid infinite loop from sessions array reference changing
  const sessionKeysStr = useMemo(
    () =>
      sessions
        ?.filter((s) => new Date(s.date_start) < new Date())
        .sort((a, b) => new Date(a.date_start).getTime() - new Date(b.date_start).getTime())
        .map((s) => s.session_key)
        .join(",") ?? "",
    [sessions]
  );

  useEffect(() => {
    if (!sessionKeysStr) {
      setChampionshipBySession(new Map());
      return;
    }

    const sessionKeys = sessionKeysStr.split(",").map(Number).filter(Boolean);
    const fetchAll = async () => {
      const results = await Promise.all(
        sessionKeys.map(async (sessionKey) => {
          const res = await fetch(
            `/api/openf1/championship_drivers?session_key=${sessionKey}`
          );
          if (!res.ok) return { sessionKey, data: [] };
          const data: ChampionshipDriver[] = await res.json();
          return { sessionKey, data };
        })
      );
      const map = new Map<number, ChampionshipDriver[]>();
      results.forEach(({ sessionKey, data }) => map.set(sessionKey, data));
      setChampionshipBySession(map);
    };

    fetchAll();
  }, [sessionKeysStr]);

  const meetingMap = useMemo(
    () => new Map(meetings?.map((m) => [m.meeting_key, m]) ?? []),
    [meetings]
  );

  const chartData = useMemo(() => {
    if (!sessions?.length || championshipBySession.size === 0) return [];

    const raceSessions = sessions
      .filter((s) => new Date(s.date_start) < new Date())
      .sort((a, b) => new Date(a.date_start).getTime() - new Date(b.date_start).getTime());

    const driverMap = new Map(drivers?.map((d) => [d.driver_number, d]) ?? []);
    const driverKeys = getTopDrivers(championshipBySession, driverMap, maxDrivers);

    return raceSessions.map((session) => {
      const champ = championshipBySession.get(session.session_key) ?? [];
      const meeting = meetingMap.get(session.meeting_key);
      const raceName = meeting?.circuit_short_name ?? `Race ${session.session_key}`;

      const entry: Record<string, string | number> = { race: raceName, fullName: meeting?.meeting_name ?? raceName };

      for (const c of champ) {
        const pointsEarned = c.points_current - c.points_start;
        const info = driverMap.get(c.driver_number);
        const key = info?.name_acronym ?? `#${c.driver_number}`;
        if (driverKeys.includes(key) && pointsEarned > 0) {
          entry[key] = pointsEarned;
        }
      }
      return entry;
    });
  }, [sessions, championshipBySession, meetingMap, drivers, maxDrivers]);

  const driverColors = useMemo(() => {
    const map: Record<string, string> = {};
    drivers?.forEach((d) => {
      map[d.name_acronym] = getTeamColor(d.team_colour);
    });
    return map;
  }, [drivers]);

  const driversToShow = useMemo(
    () =>
      getTopDrivers(
        championshipBySession,
        new Map(drivers?.map((d) => [d.driver_number, d]) ?? []),
        maxDrivers
      ),
    [championshipBySession, drivers, maxDrivers]
  );

  const isLoading = sessionsLoading;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Points per Race</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[350px] animate-pulse rounded-lg bg-muted" />
        </CardContent>
      </Card>
    );
  }

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Points per Race</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground py-8 text-center">
            No race data available for {year}. Try another year or check back after the first race.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Points per Race</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart
            data={chartData}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis
              dataKey="race"
              tick={{ fontSize: 11 }}
              angle={-45}
              textAnchor="end"
              height={80}
              interval={0}
              className="fill-muted-foreground"
            />
            <YAxis
              tick={{ fontSize: 12 }}
              allowDecimals={false}
              className="fill-muted-foreground"
            />
            <Tooltip
              content={({ active, payload, label }) => (
                <ChartTooltipContent
                  active={active}
                  payload={payload}
                  label={label}
                  labelFormatter={(_, pl) => {
                    const first = pl[0] as { payload?: { fullName?: string } } | undefined;
                    return first?.payload?.fullName ?? "";
                  }}
                  formatter={(value, name) => [`${Number(value ?? 0)} pts`, name]}
                />
              )}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            {driversToShow.map((key, idx) => (
              <Bar
                key={key}
                dataKey={key}
                stackId="a"
                fill={driverColors[key] ?? "#888"}
                name={key}
                radius={idx === driversToShow.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

function getTopDrivers(
  championshipBySession: Map<number, ChampionshipDriver[]>,
  driverMap: Map<number, Driver>,
  maxDrivers: number
): string[] {
  if (maxDrivers <= 0) return [];
  const totals = new Map<number, number>();
  for (const champ of championshipBySession.values()) {
    for (const c of champ) {
      const earned = c.points_current - c.points_start;
      totals.set(c.driver_number, (totals.get(c.driver_number) ?? 0) + earned);
    }
  }
  const sorted = [...totals.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxDrivers);
  return sorted
    .map(([dn]) => driverMap.get(dn)?.name_acronym ?? `#${dn}`)
    .filter(Boolean);
}
