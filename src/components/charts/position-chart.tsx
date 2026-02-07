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
import type { Position, Driver } from "@/types/openf1";
import { getTeamColor } from "@/lib/utils/colors";

interface PositionChartProps {
  positions: Position[];
  drivers: Driver[];
  selectedDrivers?: number[];
}

export function PositionChart({
  positions,
  drivers,
  selectedDrivers,
}: PositionChartProps) {
  const driverMap = new Map(drivers.map((d) => [d.driver_number, d]));
  const driverNumbers = selectedDrivers ?? [...new Set(positions.map((p) => p.driver_number))];

  // Group by time, sample every ~10 seconds
  const sorted = [...positions].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  if (sorted.length === 0) return null;

  const startTime = new Date(sorted[0].date).getTime();
  const bucketSize = 10_000;
  const buckets = new Map<number, Record<string, number | string>>();

  for (const pos of sorted) {
    if (!driverNumbers.includes(pos.driver_number)) continue;

    const time = new Date(pos.date).getTime();
    const bucket = Math.floor((time - startTime) / bucketSize);
    const minuteLabel = Math.round((bucket * bucketSize) / 60000);

    if (!buckets.has(bucket)) {
      buckets.set(bucket, { minute: minuteLabel });
    }

    const driver = driverMap.get(pos.driver_number);
    const key = driver?.name_acronym ?? `#${pos.driver_number}`;
    buckets.get(bucket)![key] = pos.position;
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
        <CardTitle className="text-base">Position Changes</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
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
              reversed
              domain={[1, 20]}
              ticks={[1, 5, 10, 15, 20]}
              className="fill-muted-foreground"
            />
            <Tooltip
              content={({ active, payload, label }) => (
                <ChartTooltipContent
                  active={active}
                  payload={payload}
                  label={label}
                  formatter={(value, name) => [`P${value}`, name]}
                />
              )}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            {driverKeys.map(({ key, color }) => (
              <Line
                key={key}
                type="stepAfter"
                dataKey={key}
                stroke={color}
                strokeWidth={2.5}
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
