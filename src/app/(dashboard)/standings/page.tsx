"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { useOpenF1 } from "@/hooks/use-openf1";
import { DriverAvatar } from "@/components/shared/driver-avatar";
import { getTeamColor } from "@/lib/utils/colors";
import { PageSkeleton } from "@/components/shared/loading-skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { Trophy } from "lucide-react";

export default function StandingsPage() {
  const { data: driverStandings, isLoading: driversLoading } = useOpenF1(
    "championship_drivers",
    { session_key: "latest" }
  );

  const { data: teamStandings, isLoading: teamsLoading } = useOpenF1(
    "championship_teams",
    { session_key: "latest" }
  );

  const { data: driverInfo } = useOpenF1("drivers", {
    session_key: "latest",
  });

  if (driversLoading || teamsLoading) return <PageSkeleton />;

  // Sort by current position
  const sortedDrivers = [...driverStandings].sort(
    (a, b) => a.position_current - b.position_current
  );
  const sortedTeams = [...teamStandings].sort(
    (a, b) => a.position_current - b.position_current
  );

  // Build driver info lookup
  const driverMap = new Map(
    driverInfo.map((d) => [d.driver_number, d])
  );

  return (
    <div className="space-y-6">
      <Tabs defaultValue="drivers" className="space-y-4">
        <TabsList>
          <TabsTrigger value="drivers">Drivers</TabsTrigger>
          <TabsTrigger value="constructors">Constructors</TabsTrigger>
        </TabsList>

        <TabsContent value="drivers">
          {sortedDrivers.length === 0 ? (
            <EmptyState
              icon={Trophy}
              title="No standings data"
              description="Championship standings will appear after the first race."
            />
          ) : (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">Pos</TableHead>
                      <TableHead>Driver</TableHead>
                      <TableHead className="hidden sm:table-cell">
                        Team
                      </TableHead>
                      <TableHead className="text-right">Points</TableHead>
                      <TableHead className="text-right hidden sm:table-cell">
                        Change
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedDrivers.map((standing) => {
                      const info = driverMap.get(standing.driver_number);
                      const posChange =
                        standing.position_start - standing.position_current;

                      return (
                        <TableRow key={standing.driver_number}>
                          <TableCell className="font-bold text-lg">
                            {standing.position_current}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <DriverAvatar
                                headshotUrl={info?.headshot_url ?? null}
                                nameAcronym={
                                  info?.name_acronym ??
                                  String(standing.driver_number)
                                }
                                teamColour={info?.team_colour ?? null}
                                size="sm"
                              />
                              <div>
                                <p className="font-medium">
                                  {info?.full_name ?? `#${standing.driver_number}`}
                                </p>
                                <p className="text-xs text-muted-foreground sm:hidden">
                                  {info?.team_name}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell">
                            <div className="flex items-center gap-2">
                              <span
                                className="inline-block h-2.5 w-2.5 rounded-full"
                                style={{
                                  backgroundColor: getTeamColor(
                                    info?.team_colour ?? null
                                  ),
                                }}
                              />
                              <span className="text-sm">
                                {info?.team_name ?? "-"}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-mono font-bold">
                            {standing.points_current}
                          </TableCell>
                          <TableCell className="text-right hidden sm:table-cell">
                            {posChange > 0 && (
                              <span className="text-green-500 text-sm">
                                +{posChange}
                              </span>
                            )}
                            {posChange < 0 && (
                              <span className="text-red-500 text-sm">
                                {posChange}
                              </span>
                            )}
                            {posChange === 0 && (
                              <span className="text-muted-foreground text-sm">
                                -
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
        </TabsContent>

        <TabsContent value="constructors">
          {sortedTeams.length === 0 ? (
            <EmptyState
              icon={Trophy}
              title="No standings data"
              description="Constructor standings will appear after the first race."
            />
          ) : (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">Pos</TableHead>
                      <TableHead>Team</TableHead>
                      <TableHead className="text-right">Points</TableHead>
                      <TableHead className="text-right hidden sm:table-cell">
                        Change
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedTeams.map((team) => {
                      const teamDriver = driverInfo.find(
                        (d) => d.team_name === team.team_name
                      );
                      const posChange =
                        team.position_start - team.position_current;

                      return (
                        <TableRow key={team.team_name}>
                          <TableCell className="font-bold text-lg">
                            {team.position_current}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <span
                                className="inline-block h-4 w-1 rounded-full"
                                style={{
                                  backgroundColor: getTeamColor(
                                    teamDriver?.team_colour ?? null
                                  ),
                                }}
                              />
                              <span className="font-medium">
                                {team.team_name}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-mono font-bold">
                            {team.points_current}
                          </TableCell>
                          <TableCell className="text-right hidden sm:table-cell">
                            {posChange > 0 && (
                              <span className="text-green-500 text-sm">
                                +{posChange}
                              </span>
                            )}
                            {posChange < 0 && (
                              <span className="text-red-500 text-sm">
                                {posChange}
                              </span>
                            )}
                            {posChange === 0 && (
                              <span className="text-muted-foreground text-sm">
                                -
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
        </TabsContent>
      </Tabs>
    </div>
  );
}
