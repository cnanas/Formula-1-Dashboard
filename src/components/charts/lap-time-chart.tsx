"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatLapTime } from "@/lib/utils/formatting";
import type { Lap, Driver } from "@/types/openf1";
import { getTeamColor } from "@/lib/utils/colors";

interface LapTimeChartProps {
  laps: Lap[];
  drivers: Driver[];
  selectedDrivers?: number[];
}

export function LapTimeChart({
  laps,
  drivers,
  selectedDrivers,
}: LapTimeChartProps) {
  const driverMap = new Map(drivers.map((d) => [d.driver_number, d]));

  // Filter drivers to show
  const driverNumbers = selectedDrivers ?? [...new Set(laps.map((l) => l.driver_number))];

  // Get max lap number
  const maxLap = Math.max(...laps.map((l) => l.lap_number), 0);

  // Build chart data: one entry per lap
  const chartData = [];
  for (let lap = 1; lap <= maxLap; lap++) {
    const entry: Record<string, number | string> = { lap };
    for (const dn of driverNumbers) {
      const lapData = laps.find(
        (l) => l.driver_number === dn && l.lap_number === lap
      );
      if (lapData?.lap_duration) {
        const driver = driverMap.get(dn);
        const key = driver?.name_acronym ?? `#${dn}`;
        entry[key] = lapData.lap_duration;
      }
    }
    chartData.push(entry);
  }

  const driverKeys = driverNumbers.map((dn) => {
    const driver = driverMap.get(dn);
    return {
      key: driver?.name_acronym ?? `#${dn}`,
      color: getTeamColor(driver?.team_colour ?? null),
    };
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Lap Times</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis
              dataKey="lap"
              tick={{ fontSize: 12 }}
              label={{ value: "Lap", position: "insideBottom", offset: -5, fontSize: 12 }}
              className="fill-muted-foreground"
            />
            <YAxis
              tick={{ fontSize: 12 }}
              tickFormatter={(v) => formatLapTime(v)}
              domain={["auto", "auto"]}
              className="fill-muted-foreground"
            />
            <Tooltip
              formatter={(value) => formatLapTime(value as number)}
              labelFormatter={(label) => `Lap ${label}`}
              contentStyle={{
                backgroundColor: "hsl(var(--popover))",
                borderColor: "hsl(var(--border))",
                borderRadius: "var(--radius)",
              }}
            />
            <Legend />
            {driverKeys.map(({ key, color }) => (
              <Line
                key={key}
                type="monotone"
                dataKey={key}
                stroke={color}
                strokeWidth={1.5}
                dot={false}
                activeDot={{ r: 3 }}
                isAnimationActive={false}
                connectNulls
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
