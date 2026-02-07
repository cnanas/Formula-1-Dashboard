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

interface DriverPoints {
  name: string;
  color: string;
  points: number;
}

interface PointsProgressionProps {
  data: Array<{
    race: string;
    drivers: DriverPoints[];
  }>;
  title?: string;
}

export function PointsProgression({
  data,
  title = "Points Progression",
}: PointsProgressionProps) {
  if (data.length === 0) return null;

  // Get unique driver names from the first entry
  const driverNames = data[0]?.drivers.map((d) => d.name) ?? [];
  const driverColors: Record<string, string> = {};
  data[0]?.drivers.forEach((d) => {
    driverColors[d.name] = d.color;
  });

  // Transform data for Recharts (flat structure)
  const chartData = data.map((entry) => {
    const point: Record<string, string | number> = { race: entry.race };
    entry.drivers.forEach((d) => {
      point[d.name] = d.points;
    });
    return point;
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis
              dataKey="race"
              tick={{ fontSize: 12 }}
              className="fill-muted-foreground"
            />
            <YAxis
              tick={{ fontSize: 12 }}
              className="fill-muted-foreground"
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--popover))",
                borderColor: "hsl(var(--border))",
                borderRadius: "var(--radius)",
              }}
            />
            <Legend />
            {driverNames.map((name) => (
              <Line
                key={name}
                type="monotone"
                dataKey={name}
                stroke={driverColors[name] || "#888"}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
