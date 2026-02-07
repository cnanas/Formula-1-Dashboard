"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useOpenF1 } from "@/hooks/use-openf1";
import { SessionPicker } from "@/components/shared/session-picker";
import { PageSkeleton } from "@/components/shared/loading-skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { getTeamColor } from "@/lib/utils/colors";
import { Zap } from "lucide-react";
import { format } from "date-fns";

export default function OvertakesPage() {
  const [meetingKey, setMeetingKey] = useState("");
  const [sessionKey, setSessionKey] = useState("");

  const { data: drivers } = useOpenF1(
    "drivers",
    { session_key: sessionKey },
    { enabled: !!sessionKey }
  );

  const { data: overtakes, isLoading } = useOpenF1(
    "overtakes",
    { session_key: sessionKey },
    { enabled: !!sessionKey }
  );

  const driverMap = new Map(drivers.map((d) => [d.driver_number, d]));

  // Leaderboard: count overtakes made per driver
  const overtakeCount = new Map<number, number>();
  const overtakenCount = new Map<number, number>();
  for (const ot of overtakes) {
    overtakeCount.set(
      ot.overtaking_driver_number,
      (overtakeCount.get(ot.overtaking_driver_number) ?? 0) + 1
    );
    overtakenCount.set(
      ot.overtaken_driver_number,
      (overtakenCount.get(ot.overtaken_driver_number) ?? 0) + 1
    );
  }

  const leaderboard = [...overtakeCount.entries()]
    .map(([driverNumber, count]) => {
      const driver = driverMap.get(driverNumber);
      return {
        driverNumber,
        name: driver?.name_acronym ?? `#${driverNumber}`,
        team: driver?.team_name ?? "",
        color: getTeamColor(driver?.team_colour ?? null),
        overtakes: count,
        overtaken: overtakenCount.get(driverNumber) ?? 0,
        net: count - (overtakenCount.get(driverNumber) ?? 0),
      };
    })
    .sort((a, b) => b.overtakes - a.overtakes);

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
          icon={Zap}
          title="Select a session"
          description="Choose a race weekend and session to view overtake data."
        />
      ) : isLoading ? (
        <PageSkeleton />
      ) : overtakes.length === 0 ? (
        <EmptyState
          icon={Zap}
          title="No overtake data"
          description="No overtakes recorded for this session."
        />
      ) : (
        <>
          {/* Leaderboard */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Overtake Leaderboard ({overtakes.length} total)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>Driver</TableHead>
                    <TableHead className="text-right">Overtakes</TableHead>
                    <TableHead className="text-right">Overtaken</TableHead>
                    <TableHead className="text-right">Net</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leaderboard.map((entry, i) => (
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
                          <span className="text-xs text-muted-foreground hidden sm:inline">
                            {entry.team}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono font-bold text-green-500">
                        {entry.overtakes}
                      </TableCell>
                      <TableCell className="text-right font-mono text-red-500">
                        {entry.overtaken}
                      </TableCell>
                      <TableCell className="text-right font-mono font-bold">
                        <span
                          className={
                            entry.net > 0
                              ? "text-green-500"
                              : entry.net < 0
                              ? "text-red-500"
                              : ""
                          }
                        >
                          {entry.net > 0 ? `+${entry.net}` : entry.net}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Detailed overtake list */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">All Overtakes</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead>Overtaking</TableHead>
                    <TableHead>Overtaken</TableHead>
                    <TableHead className="text-right">For Position</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[...overtakes]
                    .sort(
                      (a, b) =>
                        new Date(b.date).getTime() -
                        new Date(a.date).getTime()
                    )
                    .map((ot, i) => {
                      const overtaking = driverMap.get(
                        ot.overtaking_driver_number
                      );
                      const overtaken = driverMap.get(
                        ot.overtaken_driver_number
                      );
                      return (
                        <TableRow key={`${ot.date}-${i}`}>
                          <TableCell className="text-xs text-muted-foreground">
                            {format(new Date(ot.date), "HH:mm:ss")}
                          </TableCell>
                          <TableCell>
                            <span className="font-mono text-sm font-medium text-green-500">
                              {overtaking?.name_acronym ??
                                ot.overtaking_driver_number}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className="font-mono text-sm text-red-500">
                              {overtaken?.name_acronym ??
                                ot.overtaken_driver_number}
                            </span>
                          </TableCell>
                          <TableCell className="text-right font-mono text-sm">
                            P{ot.position}
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
