"use client";

import { use, useEffect } from "react";
import { useRouter } from "next/navigation";
import { BarChart3, TrendingUp, Timer, ListOrdered, Layers } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useOpenF1 } from "@/hooks/use-openf1";
import { LapTimeChart } from "@/components/charts/lap-time-chart";
import { PositionChart } from "@/components/charts/position-chart";
import { GapEvolutionChart } from "@/components/charts/gap-evolution-chart";
import { TireStrategyChart } from "@/components/charts/tire-strategy-chart";
import { TireBadge } from "@/components/shared/tire-badge";
import { formatPitDuration } from "@/lib/utils/formatting";
import { PageSkeleton } from "@/components/shared/loading-skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DriverAvatar } from "@/components/shared/driver-avatar";
import { formatLapTime } from "@/lib/utils/formatting";
import { getTeamColor } from "@/lib/utils/colors";
import { usePageTitle } from "@/providers/page-title-provider";

export default function RaceAnalysisPage({
  params,
}: {
  params: Promise<{ meetingKey: string; sessionKey: string }>;
}) {
  const router = useRouter();
  const { meetingKey, sessionKey } = use(params);
  const { setPageTitle, clearPageTitle } = usePageTitle();

  const { data: meetings } = useOpenF1("meetings", {
    meeting_key: meetingKey,
  });
  const meeting = meetings[0];

  const { data: allSessions } = useOpenF1("sessions", {
    meeting_key: meetingKey,
  });

  const { data: sessions } = useOpenF1("sessions", {
    session_key: sessionKey,
  });
  const session = sessions[0];

  // Set dynamic page title
  useEffect(() => {
    if (meeting && session) {
      setPageTitle(
        meeting.meeting_name,
        `${session.session_name} Analysis`
      );
    }
    return () => clearPageTitle();
  }, [meeting, session, setPageTitle, clearPageTitle]);

  const { data: drivers, isLoading: driversLoading } = useOpenF1("drivers", {
    session_key: sessionKey,
  });

  const { data: laps, isLoading: lapsLoading } = useOpenF1("laps", {
    session_key: sessionKey,
  });

  const { data: positions } = useOpenF1("position", {
    session_key: sessionKey,
  });

  const { data: intervals } = useOpenF1("intervals", {
    session_key: sessionKey,
  });

  const { data: results } = useOpenF1("session_result", {
    session_key: sessionKey,
  });

  const { data: stints, isLoading: stintsLoading } = useOpenF1("stints", {
    session_key: sessionKey,
  });

  const { data: pits } = useOpenF1("pit", { session_key: sessionKey });

  const driverMap = new Map(drivers.map((d) => [d.driver_number, d]));
  const totalLaps =
    results.length > 0 ? Math.max(...results.map((r) => r.number_of_laps)) : 0;
  const sortedResults = [...results].sort((a, b) => a.position - b.position);

  if (driversLoading || lapsLoading) return <PageSkeleton />;

  const CHART_HEIGHT = 280;

  return (
    <div className="space-y-4">
      {/* Session selector */}
      {allSessions.length > 1 && (
        <div className="flex items-center gap-2">
          <Select
            value={sessionKey}
            onValueChange={(value) =>
              router.push(`/race/${meetingKey}/${value}`)
            }
          >
            <SelectTrigger className="w-[200px] h-9">
              <SelectValue placeholder="Select session" />
            </SelectTrigger>
            <SelectContent>
              {allSessions
                .sort(
                  (a, b) =>
                    new Date(a.date_start).getTime() -
                    new Date(b.date_start).getTime()
                )
                .map((s) => (
                  <SelectItem
                    key={s.session_key}
                    value={s.session_key.toString()}
                  >
                    {s.session_name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
          {meeting && (
            <span className="text-sm text-muted-foreground">
              {meeting.meeting_name}
            </span>
          )}
        </div>
      )}

      <Tabs defaultValue="results" className="w-full">
        <TabsList className="w-full justify-start flex-wrap h-auto gap-1 p-1">
          <TabsTrigger value="results" className="gap-1.5 text-xs px-3 py-1.5">
            <ListOrdered className="h-3.5 w-3.5" />
            Results
          </TabsTrigger>
          <TabsTrigger value="laps" className="gap-1.5 text-xs px-3 py-1.5">
            <Timer className="h-3.5 w-3.5" />
            Lap Times
          </TabsTrigger>
          <TabsTrigger value="position" className="gap-1.5 text-xs px-3 py-1.5">
            <TrendingUp className="h-3.5 w-3.5" />
            Position
          </TabsTrigger>
          <TabsTrigger value="gap" className="gap-1.5 text-xs px-3 py-1.5">
            <BarChart3 className="h-3.5 w-3.5" />
            Gap
          </TabsTrigger>
          <TabsTrigger value="strategy" className="gap-1.5 text-xs px-3 py-1.5">
            <Layers className="h-3.5 w-3.5" />
            Strategy
          </TabsTrigger>
        </TabsList>

        <TabsContent value="results" className="mt-4">
          {sortedResults.length > 0 ? (
            <Card className="py-3">
              <CardContent className="p-0 px-4">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="h-9 w-10 py-2 text-xs">Pos</TableHead>
                      <TableHead className="h-9 py-2 text-xs">Driver</TableHead>
                      <TableHead className="hidden h-9 py-2 text-xs sm:table-cell">
                        Team
                      </TableHead>
                      <TableHead className="h-9 py-2 text-right text-xs">Laps</TableHead>
                      <TableHead className="h-9 py-2 text-right text-xs">Gap</TableHead>
                      <TableHead className="hidden h-9 py-2 text-right text-xs sm:table-cell">
                        Status
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedResults.map((result) => {
                      const driver = driverMap.get(result.driver_number);
                      const status = result.dnf
                        ? "DNF"
                        : result.dns
                        ? "DNS"
                        : result.dsq
                        ? "DSQ"
                        : "";

                      return (
                        <TableRow
                          key={result.driver_number}
                          className="h-11"
                        >
                          <TableCell className="py-1.5 font-bold text-sm">
                            {result.position}
                          </TableCell>
                          <TableCell className="py-1.5">
                            <div className="flex items-center gap-2">
                              <DriverAvatar
                                headshotUrl={driver?.headshot_url ?? null}
                                nameAcronym={
                                  driver?.name_acronym ??
                                  String(result.driver_number)
                                }
                                teamColour={driver?.team_colour ?? null}
                                size="sm"
                              />
                              <span className="font-medium text-sm">
                                {driver?.full_name ?? `#${result.driver_number}`}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="hidden py-1.5 text-xs sm:table-cell">
                            <div className="flex items-center gap-2">
                              <span
                                className="h-2 w-2 rounded-full shrink-0"
                                style={{
                                  backgroundColor: getTeamColor(
                                    driver?.team_colour ?? null
                                  ),
                                }}
                              />
                              {driver?.team_name ?? "-"}
                            </div>
                          </TableCell>
                          <TableCell className="py-1.5 text-right font-mono text-xs">
                            {result.number_of_laps}
                          </TableCell>
                          <TableCell className="py-1.5 text-right font-mono text-xs">
                            {result.position === 1
                              ? formatLapTime(result.duration)
                              : result.gap_to_leader != null &&
                                !Number.isNaN(Number(result.gap_to_leader))
                              ? `+${Number(result.gap_to_leader).toFixed(3)}s`
                              : "-"}
                          </TableCell>
                          <TableCell className="hidden py-1.5 text-right text-xs sm:table-cell">
                            {status && (
                              <span className="text-destructive font-medium">
                                {status}
                              </span>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ) : (
            <p className="text-sm text-muted-foreground py-4">
              No results available.
            </p>
          )}
        </TabsContent>

        <TabsContent value="laps" className="mt-4">
          <LapTimeChart
            laps={laps}
            drivers={drivers}
            height={CHART_HEIGHT}
            compact
          />
        </TabsContent>

        <TabsContent value="position" className="mt-4">
          <PositionChart
            positions={positions}
            drivers={drivers}
            height={CHART_HEIGHT}
            compact
          />
        </TabsContent>

        <TabsContent value="gap" className="mt-4">
          <GapEvolutionChart
            intervals={intervals}
            drivers={drivers}
            height={CHART_HEIGHT}
            compact
          />
        </TabsContent>

        <TabsContent value="strategy" className="mt-4 space-y-4">
          {stintsLoading ? (
            <p className="text-sm text-muted-foreground py-4">
              Loading tire strategy...
            </p>
          ) : (
            <>
              <TireStrategyChart
                stints={stints}
                drivers={drivers}
                pits={pits}
                totalLaps={totalLaps}
              />
              {pits.length > 0 && (
                <Card className="py-3">
                  <CardContent className="p-0 px-4">
                    <p className="text-sm font-semibold mb-3 px-0">Pit Stops</p>
                    <Table>
                      <TableHeader>
                        <TableRow className="hover:bg-transparent">
                          <TableHead className="h-9 py-2 text-xs">Driver</TableHead>
                          <TableHead className="h-9 py-2 text-xs">Lap</TableHead>
                          <TableHead className="h-9 py-2 text-xs">
                            Stop
                          </TableHead>
                          <TableHead className="h-9 py-2 text-xs">Lane</TableHead>
                          <TableHead className="hidden h-9 py-2 text-xs sm:table-cell">
                            New Tire
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {[...pits]
                          .sort((a, b) => {
                            if (a.driver_number !== b.driver_number)
                              return a.driver_number - b.driver_number;
                            return a.lap_number - b.lap_number;
                          })
                          .map((pit, i) => {
                            const driver = driverMap.get(pit.driver_number);
                            const nextStint = stints.find(
                              (s) =>
                                s.driver_number === pit.driver_number &&
                                s.lap_start === pit.lap_number + 1
                            );
                            return (
                              <TableRow
                                key={`${pit.driver_number}-${pit.lap_number}-${i}`}
                                className="h-11"
                              >
                                <TableCell className="py-1.5 font-medium text-sm">
                                  {driver?.name_acronym ?? `#${pit.driver_number}`}
                                </TableCell>
                                <TableCell className="py-1.5 font-mono text-xs">
                                  {pit.lap_number}
                                </TableCell>
                                <TableCell className="py-1.5 font-mono text-xs">
                                  {formatPitDuration(pit.stop_duration)}
                                </TableCell>
                                <TableCell className="py-1.5 font-mono text-xs">
                                  {formatPitDuration(pit.lane_duration)}
                                </TableCell>
                                <TableCell className="hidden py-1.5 sm:table-cell">
                                  {nextStint && (
                                    <TireBadge compound={nextStint.compound} />
                                  )}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
