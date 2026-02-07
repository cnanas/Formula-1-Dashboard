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
import { ChartTooltipContent } from "./chart-tooltip";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Interval, Driver } from "@/types/openf1";
import { getTeamColor } from "@/lib/utils/colors";

interface GapEvolutionChartProps {
  intervals: Interval[];
  drivers: Driver[];
  selectedDrivers?: number[];
}

export function GapEvolutionChart({
  intervals,
  drivers,
  selectedDrivers,
}: GapEvolutionChartProps) {
  const driverMap = new Map(drivers.map((d) => [d.driver_number, d]));
  const driverNumbers = selectedDrivers ?? [...new Set(intervals.map((i) => i.driver_number))].slice(0, 5);

  // Group intervals by time buckets (every 30s)
  const sorted = [...intervals].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  if (sorted.length === 0) return null;

  const startTime = new Date(sorted[0].date).getTime();
  const bucketSize = 30_000; // 30 seconds
  const buckets = new Map<number, Record<string, number | string>>();

  for (const interval of sorted) {
    if (!driverNumbers.includes(interval.driver_number)) continue;
    if (interval.gap_to_leader === null) continue;

    const time = new Date(interval.date).getTime();
    const bucket = Math.floor((time - startTime) / bucketSize);
    const minuteLabel = Math.round((bucket * bucketSize) / 60000);

    if (!buckets.has(bucket)) {
      buckets.set(bucket, { minute: minuteLabel });
    }

    const driver = driverMap.get(interval.driver_number);
    const key = driver?.name_acronym ?? `#${interval.driver_number}`;
    const entry = buckets.get(bucket)!;
    entry[key] = Number(interval.gap_to_leader);
  }

  const chartData = [...buckets.values()].sort(
    (a, b) => Number(a.minute) - Number(b.minute)
  );

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
        <CardTitle className="text-base">Gap to Leader</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis
              dataKey="minute"
              tick={{ fontSize: 12 }}
              label={{ value: "Minutes", position: "insideBottom", offset: -5, fontSize: 12 }}
              className="fill-muted-foreground"
            />
            <YAxis
              tick={{ fontSize: 12 }}
              tickFormatter={(v) => `+${v}s`}
              reversed
              className="fill-muted-foreground"
            />
            <Tooltip
              content={(props) => (
                <ChartTooltipContent
                  {...props}
                  formatter={(value, name) => [`+${Number(value).toFixed(3)}s`, name]}
                />
              )}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            {driverKeys.map(({ key, color }) => (
              <Line
                key={key}
                type="monotone"
                dataKey={key}
                stroke={color}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
                isAnimationActive
                animationDuration={400}
                connectNulls
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
