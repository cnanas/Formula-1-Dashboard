"use client";

import { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { ChartTooltipContent } from "@/components/charts/chart-tooltip";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useOpenF1 } from "@/hooks/use-openf1";
import { SessionPicker } from "@/components/shared/session-picker";
import { PageSkeleton } from "@/components/shared/loading-skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { getTeamColor } from "@/lib/utils/colors";
import { Gauge } from "lucide-react";

export default function SpeedTrapsPage() {
  const [meetingKey, setMeetingKey] = useState("");
  const [sessionKey, setSessionKey] = useState("");

  const { data: drivers } = useOpenF1(
    "drivers",
    { session_key: sessionKey },
    { enabled: !!sessionKey }
  );

  const { data: laps, isLoading } = useOpenF1(
    "laps",
    { session_key: sessionKey },
    { enabled: !!sessionKey }
  );

  const driverMap = new Map(drivers.map((d) => [d.driver_number, d]));

  // Aggregate top speeds per driver
  const driverSpeeds = new Map<
    number,
    { i1_max: number; i2_max: number; st_max: number }
  >();

  for (const lap of laps) {
    const existing = driverSpeeds.get(lap.driver_number) ?? {
      i1_max: 0,
      i2_max: 0,
      st_max: 0,
    };
    if (lap.i1_speed && lap.i1_speed > existing.i1_max)
      existing.i1_max = lap.i1_speed;
    if (lap.i2_speed && lap.i2_speed > existing.i2_max)
      existing.i2_max = lap.i2_speed;
    if (lap.st_speed && lap.st_speed > existing.st_max)
      existing.st_max = lap.st_speed;
    driverSpeeds.set(lap.driver_number, existing);
  }

  const speedData = [...driverSpeeds.entries()]
    .map(([driverNumber, speeds]) => {
      const driver = driverMap.get(driverNumber);
      return {
        driverNumber,
        name: driver?.name_acronym ?? `#${driverNumber}`,
        team: driver?.team_name ?? "",
        color: getTeamColor(driver?.team_colour ?? null),
        ...speeds,
        topSpeed: Math.max(speeds.i1_max, speeds.i2_max, speeds.st_max),
      };
    })
    .sort((a, b) => b.topSpeed - a.topSpeed);

  const chartData = speedData.slice(0, 10).map((d) => ({
    name: d.name,
    speed: d.topSpeed,
    fill: d.color,
  }));

  return (
    <div className="space-y-6">
      <SessionPicker
        selectedMeeting={meetingKey}
        selectedSession={sessionKey}
        onMeetingChange={(key) => {
          setMeetingKey(key);
          setSessionKey("");
        }}
        onSessionChange={setSessionKey}
      />

      {!sessionKey ? (
        <EmptyState
          icon={Gauge}
          title="Select a session"
          description="Choose a race weekend and session to view speed trap data."
        />
      ) : isLoading ? (
        <PageSkeleton />
      ) : speedData.length === 0 ? (
        <EmptyState
          icon={Gauge}
          title="No speed data"
          description="No speed trap data available for this session."
        />
      ) : (
        <>
          {/* Top speed chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Top 10 - Maximum Speed</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 12 }}
                    tickFormatter={(v) => `${v} km/h`}
                    domain={["dataMin - 10", "dataMax + 5"]}
                    className="fill-muted-foreground"
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fontSize: 12 }}
                    width={50}
                    className="fill-muted-foreground"
                  />
                  <Tooltip
                    content={(props) => (
                      <ChartTooltipContent
                        {...props}
                        formatter={(value) => [`${Number(value)} km/h`, "Top Speed"]}
                      />
                    )}
                  />
                  <Bar dataKey="speed" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Full table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Speed Trap Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>Driver</TableHead>
                    <TableHead className="text-right">Trap 1</TableHead>
                    <TableHead className="text-right">Trap 2</TableHead>
                    <TableHead className="text-right">Speed Trap</TableHead>
                    <TableHead className="text-right font-bold">Max</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {speedData.map((entry, i) => (
                    <TableRow key={entry.driverNumber}>
                      <TableCell className="font-bold">{i + 1}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span
                            className="h-2.5 w-2.5 rounded-full"
                            style={{ backgroundColor: entry.color }}
                          />
                          <span className="font-mono font-medium text-sm">
                            {entry.name}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {entry.i1_max || "-"}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {entry.i2_max || "-"}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {entry.st_max || "-"}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm font-bold">
                        {entry.topSpeed} km/h
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
