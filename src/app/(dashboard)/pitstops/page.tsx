"use client";

import { useState } from "react";
import {
  BarChart,
  Bar,
  Cell,
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
import { formatPitDuration } from "@/lib/utils/formatting";
import { getTeamColor } from "@/lib/utils/colors";
import { CircleDot } from "lucide-react";

export default function PitStopsPage() {
  const [meetingKey, setMeetingKey] = useState("");
  const [sessionKey, setSessionKey] = useState("");

  const { data: drivers } = useOpenF1(
    "drivers",
    { session_key: sessionKey },
    { enabled: !!sessionKey }
  );

  const { data: pits, isLoading } = useOpenF1(
    "pit",
    { session_key: sessionKey },
    { enabled: !!sessionKey }
  );

  const driverMap = new Map(drivers.map((d) => [d.driver_number, d]));

  // Calculate team averages
  const teamPits = new Map<string, number[]>();
  for (const pit of pits) {
    if (!pit.stop_duration) continue;
    const driver = driverMap.get(pit.driver_number);
    const team = driver?.team_name ?? "Unknown";
    if (!teamPits.has(team)) teamPits.set(team, []);
    teamPits.get(team)!.push(pit.stop_duration);
  }

  const teamData = [...teamPits.entries()]
    .map(([team, durations]) => {
      const avg = durations.reduce((a, b) => a + b, 0) / durations.length;
      const best = Math.min(...durations);
      const teamDriver = drivers.find((d) => d.team_name === team);
      return {
        team,
        average: Number(avg.toFixed(2)),
        best: Number(best.toFixed(2)),
        stops: durations.length,
        color: getTeamColor(teamDriver?.team_colour ?? null),
      };
    })
    .sort((a, b) => a.average - b.average);

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
          icon={CircleDot}
          title="Select a session"
          description="Choose a race weekend and session to view pit stop data."
        />
      ) : isLoading ? (
        <PageSkeleton />
      ) : pits.length === 0 ? (
        <EmptyState
          icon={CircleDot}
          title="No pit stop data"
          description="No pit stops recorded for this session."
        />
      ) : (
        <>
          {/* Team average bar chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Average Stop Duration by Team
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={teamData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 12 }}
                    tickFormatter={(v) => `${v}s`}
                    className="fill-muted-foreground"
                  />
                  <YAxis
                    type="category"
                    dataKey="team"
                    tick={{ fontSize: 11 }}
                    width={120}
                    className="fill-muted-foreground"
                  />
                  <Tooltip
                    content={(props) => (
                      <ChartTooltipContent
                        {...props}
                        formatter={(value) => [`${Number(value)}s`, "Average"]}
                      />
                    )}
                  />
                  <Bar dataKey="average" radius={[0, 6, 6, 0]}>
                    {teamData.map((entry, index) => (
                      <Cell key={entry.team} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Detailed table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">All Pit Stops</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Driver</TableHead>
                    <TableHead>Lap</TableHead>
                    <TableHead className="text-right">Stop Time</TableHead>
                    <TableHead className="text-right">Lane Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[...pits]
                    .sort((a, b) => (a.stop_duration ?? 99) - (b.stop_duration ?? 99))
                    .map((pit, i) => {
                      const driver = driverMap.get(pit.driver_number);
                      return (
                        <TableRow key={`${pit.driver_number}-${pit.lap_number}-${i}`}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span
                                className="h-2.5 w-2.5 rounded-full"
                                style={{
                                  backgroundColor: getTeamColor(
                                    driver?.team_colour ?? null
                                  ),
                                }}
                              />
                              <span className="font-mono text-sm font-medium">
                                {driver?.name_acronym ?? pit.driver_number}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            {pit.lap_number}
                          </TableCell>
                          <TableCell className="text-right font-mono text-sm">
                            {formatPitDuration(pit.stop_duration)}
                          </TableCell>
                          <TableCell className="text-right font-mono text-sm">
                            {formatPitDuration(pit.lane_duration)}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
