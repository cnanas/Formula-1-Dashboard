"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
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
import { Skeleton } from "@/components/ui/skeleton";
import { DriverAvatar } from "@/components/shared/driver-avatar";
import { getTeamColor } from "@/lib/utils/colors";
import { EmptyState } from "@/components/shared/empty-state";
import { Trophy, TrendingUp, TrendingDown, Minus, Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type {
  ChampionshipDriver,
  ChampionshipTeam,
  Driver,
} from "@/types/openf1";

// Recharts-based charts are heavy; load them on demand so the standings
// tables render without waiting for the chart bundle.
const DriverStandingsEvolutionChart = dynamic(
  () =>
    import("@/components/charts/driver-standings-evolution-chart").then(
      (m) => m.DriverStandingsEvolutionChart
    ),
  { loading: () => <Skeleton className="h-64 w-full" /> }
);
const ConstructorPointsChart = dynamic(
  () =>
    import("@/components/charts/constructor-points-chart").then(
      (m) => m.ConstructorPointsChart
    ),
  { loading: () => <Skeleton className="h-64 w-full" /> }
);

interface StandingsViewProps {
  year: number;
  driverStandings: ChampionshipDriver[];
  teamStandings: ChampionshipTeam[];
  driverInfo: Driver[];
}

export function StandingsView({
  year,
  driverStandings,
  teamStandings,
  driverInfo,
}: StandingsViewProps) {
  // Sort by current position
  const sortedDrivers = [...driverStandings].sort(
    (a, b) => a.position_current - b.position_current
  );
  const sortedTeams = [...teamStandings].sort(
    (a, b) => a.position_current - b.position_current
  );

  // Build driver info lookup
  const driverMap = new Map(driverInfo.map((d) => [d.driver_number, d]));

  return (
    <div className="space-y-6">
      <DriverStandingsEvolutionChart key={year} year={year} />

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
              description={`No championship standings found for ${year}.`}
            />
          ) : (
            <Card>
              <CardContent className="p-0">
                <TooltipProvider>
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
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="inline-flex items-center gap-1 cursor-help">
                                vs Start
                                <Info className="h-3 w-3 text-muted-foreground" />
                              </span>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-[200px]">
                              <p className="text-xs">Position change compared to the start of the season (Race 1)</p>
                            </TooltipContent>
                          </Tooltip>
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
                              <Link href={`/drivers/${standing.driver_number}`} className="block">
                                <div className="flex items-center gap-3 hover:opacity-80 transition-opacity">
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
                                    <p className="font-medium hover:text-primary transition-colors">
                                      {info?.full_name ?? `#${standing.driver_number}`}
                                    </p>
                                    <p className="text-xs text-muted-foreground sm:hidden">
                                      {info?.team_name}
                                    </p>
                                  </div>
                                </div>
                              </Link>
                            </TableCell>
                            <TableCell className="hidden sm:table-cell">
                              {info?.team_name ? (
                                <Link href={`/teams/${encodeURIComponent(info.team_name)}`}>
                                  <div className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                                    <span
                                      className="inline-block h-2.5 w-2.5 rounded-full"
                                      style={{
                                        backgroundColor: getTeamColor(
                                          info?.team_colour ?? null
                                        ),
                                      }}
                                    />
                                    <span className="text-sm hover:text-primary transition-colors">
                                      {info.team_name}
                                    </span>
                                  </div>
                                </Link>
                              ) : (
                                <span className="text-sm">-</span>
                              )}
                            </TableCell>
                            <TableCell className="text-right font-mono font-bold">
                              {standing.points_current}
                            </TableCell>
                            <TableCell className="text-right hidden sm:table-cell">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="inline-flex items-center justify-end gap-1 cursor-default">
                                    {posChange > 0 && (
                                      <>
                                        <TrendingUp className="h-3.5 w-3.5 text-green-500" />
                                        <span className="text-green-500 text-sm font-medium">
                                          +{posChange}
                                        </span>
                                      </>
                                    )}
                                    {posChange < 0 && (
                                      <>
                                        <TrendingDown className="h-3.5 w-3.5 text-red-500" />
                                        <span className="text-red-500 text-sm font-medium">
                                          {posChange}
                                        </span>
                                      </>
                                    )}
                                    {posChange === 0 && (
                                      <>
                                        <Minus className="h-3.5 w-3.5 text-muted-foreground" />
                                        <span className="text-muted-foreground text-sm">
                                          -
                                        </span>
                                      </>
                                    )}
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent side="left">
                                  <p className="text-xs">
                                    {posChange > 0
                                      ? `Up ${posChange} position${posChange > 1 ? "s" : ""} from P${standing.position_start}`
                                      : posChange < 0
                                      ? `Down ${Math.abs(posChange)} position${Math.abs(posChange) > 1 ? "s" : ""} from P${standing.position_start}`
                                      : `Same position since season start (P${standing.position_start})`}
                                  </p>
                                </TooltipContent>
                              </Tooltip>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TooltipProvider>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="constructors">
          {sortedTeams.length === 0 ? (
            <EmptyState
              icon={Trophy}
              title="No standings data"
              description={`No constructor standings found for ${year}.`}
            />
          ) : (
            <div className="space-y-6">
              <ConstructorPointsChart teams={sortedTeams} drivers={driverInfo} />
            <Card>
              <CardContent className="p-0">
                <TooltipProvider>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-16">Pos</TableHead>
                        <TableHead>Team</TableHead>
                        <TableHead className="text-right">Points</TableHead>
                        <TableHead className="text-right hidden sm:table-cell">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="inline-flex items-center gap-1 cursor-help">
                                vs Start
                                <Info className="h-3 w-3 text-muted-foreground" />
                              </span>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-[200px]">
                              <p className="text-xs">Position change compared to the start of the season (Race 1)</p>
                            </TooltipContent>
                          </Tooltip>
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
                              <Link href={`/teams/${encodeURIComponent(team.team_name)}`}>
                                <div className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                                  <span
                                    className="inline-block h-4 w-1 rounded-full"
                                    style={{
                                      backgroundColor: getTeamColor(
                                        teamDriver?.team_colour ?? null
                                      ),
                                    }}
                                  />
                                  <span className="font-medium hover:text-primary transition-colors">
                                    {team.team_name}
                                  </span>
                                </div>
                              </Link>
                            </TableCell>
                            <TableCell className="text-right font-mono font-bold">
                              {team.points_current}
                            </TableCell>
                            <TableCell className="text-right hidden sm:table-cell">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="inline-flex items-center justify-end gap-1 cursor-default">
                                    {posChange > 0 && (
                                      <>
                                        <TrendingUp className="h-3.5 w-3.5 text-green-500" />
                                        <span className="text-green-500 text-sm font-medium">
                                          +{posChange}
                                        </span>
                                      </>
                                    )}
                                    {posChange < 0 && (
                                      <>
                                        <TrendingDown className="h-3.5 w-3.5 text-red-500" />
                                        <span className="text-red-500 text-sm font-medium">
                                          {posChange}
                                        </span>
                                      </>
                                    )}
                                    {posChange === 0 && (
                                      <>
                                        <Minus className="h-3.5 w-3.5 text-muted-foreground" />
                                        <span className="text-muted-foreground text-sm">
                                          -
                                        </span>
                                      </>
                                    )}
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent side="left">
                                  <p className="text-xs">
                                    {posChange > 0
                                      ? `Up ${posChange} position${posChange > 1 ? "s" : ""} from P${team.position_start}`
                                      : posChange < 0
                                      ? `Down ${Math.abs(posChange)} position${Math.abs(posChange) > 1 ? "s" : ""} from P${team.position_start}`
                                      : `Same position since season start (P${team.position_start})`}
                                  </p>
                                </TooltipContent>
                              </Tooltip>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TooltipProvider>
              </CardContent>
            </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
