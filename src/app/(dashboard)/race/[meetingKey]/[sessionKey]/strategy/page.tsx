"use client";

import { use, useEffect } from "react";
import { useOpenF1 } from "@/hooks/use-openf1";
import { TireStrategyChart } from "@/components/charts/tire-strategy-chart";
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
import { TireBadge } from "@/components/shared/tire-badge";
import { formatPitDuration } from "@/lib/utils/formatting";
import { usePageTitle } from "@/providers/page-title-provider";

export default function StrategyPage({
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
        `${session.session_name} - Tire Strategy`
      );
    }
    return () => clearPageTitle();
  }, [meeting, session, setPageTitle, clearPageTitle]);

  const { data: drivers, isLoading: driversLoading } = useOpenF1("drivers", {
    session_key: sessionKey,
  });

  const { data: stints, isLoading: stintsLoading } = useOpenF1("stints", {
    session_key: sessionKey,
  });

  const { data: pits } = useOpenF1("pit", { session_key: sessionKey });

  const { data: results } = useOpenF1("session_result", {
    session_key: sessionKey,
  });

  const driverMap = new Map(drivers.map((d) => [d.driver_number, d]));
  const totalLaps = results.length > 0
    ? Math.max(...results.map((r) => r.number_of_laps))
    : 0;

  if (driversLoading || stintsLoading) return <PageSkeleton />;

  return (
    <div className="space-y-6">
      {/* Strategy visualization */}
      <TireStrategyChart
        stints={stints}
        drivers={drivers}
        pits={pits}
        totalLaps={totalLaps}
      />

      {/* Pit stop table */}
      {pits.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Pit Stops</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Driver</TableHead>
                  <TableHead>Lap</TableHead>
                  <TableHead>Stop Duration</TableHead>
                  <TableHead>Lane Time</TableHead>
                  <TableHead className="hidden sm:table-cell">
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
                    // Find the stint that started after this pit stop
                    const nextStint = stints.find(
                      (s) =>
                        s.driver_number === pit.driver_number &&
                        s.lap_start === pit.lap_number + 1
                    );

                    return (
                      <TableRow key={`${pit.driver_number}-${pit.lap_number}-${i}`}>
                        <TableCell className="font-medium text-sm">
                          {driver?.name_acronym ?? `#${pit.driver_number}`}
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {pit.lap_number}
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {formatPitDuration(pit.stop_duration)}
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {formatPitDuration(pit.lane_duration)}
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
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
    </div>
  );
}
