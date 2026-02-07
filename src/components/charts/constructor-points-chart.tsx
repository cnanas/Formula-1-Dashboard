"use client";

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getTeamColor } from "@/lib/utils/colors";
import { ChartTooltipContent } from "./chart-tooltip";
import type { ChampionshipTeam } from "@/types/openf1";
import type { Driver } from "@/types/openf1";

interface ConstructorPointsChartProps {
  teams: ChampionshipTeam[];
  drivers: Driver[];
}

const RADIAN = Math.PI / 180;
function renderCustomLabel({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  percent,
}: {
  cx: number;
  cy: number;
  midAngle: number;
  innerRadius: number;
  outerRadius: number;
  percent: number;
}) {
  if (percent < 0.06) return null;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor="middle"
      dominantBaseline="central"
      className="text-xs font-semibold drop-shadow-sm"
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
}

export function ConstructorPointsChart({
  teams,
  drivers,
}: ConstructorPointsChartProps) {
  const driverMap = new Map(drivers.map((d) => [d.team_name, d]));
  const totalPoints = teams.reduce((sum, t) => sum + t.points_current, 0);
  const data = teams
    .filter((t) => t.points_current > 0)
    .map((team) => ({
      name: team.team_name,
      value: team.points_current,
      color: getTeamColor(driverMap.get(team.team_name)?.team_colour ?? null),
      position: team.position_current,
    }));

  if (data.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Constructor Points Share</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={320}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={64}
              outerRadius={100}
              paddingAngle={2}
              dataKey="value"
              nameKey="name"
              label={renderCustomLabel}
              labelLine={false}
              animationBegin={0}
              animationDuration={600}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} stroke="hsl(var(--border))" strokeWidth={1} />
              ))}
            </Pie>
            <Tooltip
              content={(props) => (
                <ChartTooltipContent
                  {...props}
                  formatter={(value, name, item) => {
                    const pct = totalPoints > 0 ? ((Number(value) / totalPoints) * 100).toFixed(1) : "0";
                    return [`${value} pts (${pct}%)`, (item as { name: string }).name];
                  }}
                />
              )}
            />
            <Legend
              layout="vertical"
              align="right"
              verticalAlign="middle"
              formatter={(value, entry) => (
                <span className="text-xs text-muted-foreground">
                  <span
                    className="inline-block w-3 h-3 rounded-full mr-1.5 align-middle"
                    style={{ backgroundColor: entry?.color ?? "#888" }}
                  />
                  {value}
                </span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
