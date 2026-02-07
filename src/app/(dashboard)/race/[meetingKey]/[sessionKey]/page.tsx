"use client";

import { use, useEffect } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useOpenF1 } from "@/hooks/use-openf1";
import { LapTimeChart } from "@/components/charts/lap-time-chart";
import { PositionChart } from "@/components/charts/position-chart";
import { GapEvolutionChart } from "@/components/charts/gap-evolution-chart";
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
  const { meetingKey, sessionKey } = use(params);
  const { setPageTitle, clearPageTitle } = usePageTitle();

  const { data: sessions } = useOpenF1("sessions", {
    session_key: sessionKey,
  });
  const session = sessions[0];

  const { data: meetings } = useOpenF1("meetings", {
    meeting_key: meetingKey,
  });
  const meeting = meetings[0];

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

  const driverMap = new Map(drivers.map((d) => [d.driver_number, d]));
  const sortedResults = [...results].sort((a, b) => a.position - b.position);

  if (driversLoading || lapsLoading) return <PageSkeleton />;

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Link
          href={`/race/${meetingKey}/${sessionKey}/strategy`}
        >
          <Button variant="outline" size="sm">
            Tire Strategy <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </div>

      {/* Results table */}
      {sortedResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Results</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">Pos</TableHead>
                  <TableHead>Driver</TableHead>
                  <TableHead className="hidden sm:table-cell">
                    Team
                  </TableHead>
                  <TableHead className="text-right">Laps</TableHead>
                  <TableHead className="text-right">Gap</TableHead>
                  <TableHead className="text-right hidden sm:table-cell">
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
                    <TableRow key={result.driver_number}>
                      <TableCell className="font-bold">
                        {result.position}
                      </TableCell>
                      <TableCell>
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
                      <TableCell className="hidden sm:table-cell text-sm">
                        <div className="flex items-center gap-2">
                          <span
                            className="h-2.5 w-2.5 rounded-full"
                            style={{
                              backgroundColor: getTeamColor(
                                driver?.team_colour ?? null
                              ),
                            }}
                          />
                          {driver?.team_name ?? "-"}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {result.number_of_laps}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {result.position === 1
                          ? formatLapTime(result.duration)
                          : result.gap_to_leader
                          ? `+${result.gap_to_leader.toFixed(3)}s`
                          : "-"}
                      </TableCell>
                      <TableCell className="text-right hidden sm:table-cell">
                        {status && (
                          <span className="text-destructive text-sm font-medium">
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
      )}

      {/* Charts */}
      <LapTimeChart laps={laps} drivers={drivers} />
      <PositionChart positions={positions} drivers={drivers} />
      <GapEvolutionChart intervals={intervals} drivers={drivers} />
    </div>
  );
}
