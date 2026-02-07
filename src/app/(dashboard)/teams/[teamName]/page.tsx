"use client";

import { use, useEffect, useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Trophy, Flag, Users, TrendingUp, Wrench } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useOpenF1 } from "@/hooks/use-openf1";
import { useSeason } from "@/providers/season-provider";
import { usePageTitle } from "@/providers/page-title-provider";
import { DriverAvatar } from "@/components/shared/driver-avatar";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { PageSkeleton } from "@/components/shared/loading-skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { getTeamColor } from "@/lib/utils/colors";

export default function TeamProfilePage({
  params,
}: {
  params: Promise<{ teamName: string }>;
}) {
  const { teamName: encodedTeamName } = use(params);
  const teamName = decodeURIComponent(encodedTeamName);
  const { season } = useSeason();
  const { setPageTitle, clearPageTitle } = usePageTitle();

  // Get sessions for the season to find the latest one
  const { data: sessions, isLoading: sessionsLoading } = useOpenF1("sessions", {
    year: season,
    session_type: "Race",
  });

  // Find the most recent completed race session
  const latestSession = useMemo(() => {
    return sessions
      .filter((s) => new Date(s.date_start) < new Date())
      .sort((a, b) => new Date(b.date_start).getTime() - new Date(a.date_start).getTime())[0];
  }, [sessions]);

  const sessionKey = latestSession?.session_key?.toString();

  // Get all drivers
  const { data: drivers, isLoading: driversLoading } = useOpenF1(
    "drivers",
    { session_key: sessionKey },
    { enabled: !!sessionKey }
  );

  // Get team drivers
  const teamDrivers = useMemo(() => {
    return drivers.filter((d) => d.team_name === teamName);
  }, [drivers, teamName]);

  // Get championship standings for drivers
  const { data: driverStandings, isLoading: driverStandingsLoading } = useOpenF1(
    "championship_drivers",
    { session_key: sessionKey },
    { enabled: !!sessionKey }
  );

  // Get constructor standings
  const { data: constructorStandings, isLoading: constructorStandingsLoading } = useOpenF1(
    "championship_teams",
    { session_key: sessionKey },
    { enabled: !!sessionKey }
  );

  const teamStanding = useMemo(() => {
    return constructorStandings.find((t) => t.team_name === teamName);
  }, [constructorStandings, teamName]);

  // Get driver standings for team drivers
  const teamDriverStandings = useMemo(() => {
    return teamDrivers.map((driver) => ({
      driver,
      standing: driverStandings.find((s) => s.driver_number === driver.driver_number),
    }));
  }, [teamDrivers, driverStandings]);

  // Get all race sessions for the season
  const raceSessionKeys = useMemo(() => {
    return sessions
      .filter((s) => new Date(s.date_start) < new Date())
      .map((s) => s.session_key);
  }, [sessions]);

  // Set page title
  useEffect(() => {
    if (teamDrivers.length > 0) {
      setPageTitle(teamName, `${season} Season`);
    }
    return () => clearPageTitle();
  }, [teamName, teamDrivers, season, setPageTitle, clearPageTitle]);

  const isLoading = sessionsLoading || driversLoading || driverStandingsLoading || constructorStandingsLoading;

  if (isLoading) return <PageSkeleton />;

  if (teamDrivers.length === 0) {
    return (
      <div className="space-y-6">
        <Link href="/standings">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Standings
          </Button>
        </Link>
        <EmptyState
          icon={Users}
          title="Team not found"
          description={`No team found with name "${teamName}" for the ${season} season.`}
        />
      </div>
    );
  }

  const teamColor = getTeamColor(teamDrivers[0]?.team_colour ?? null);

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Link href="/standings">
        <Button variant="ghost" size="sm">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Standings
        </Button>
      </Link>

      {/* Team Header Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="overflow-hidden">
          {/* Team color accent bar */}
          <div
            className="h-2 w-full"
            style={{ backgroundColor: teamColor }}
          />
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
              {/* Team Color Badge */}
              <div
                className="h-24 w-24 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: `${teamColor}20` }}
              >
                <div
                  className="h-16 w-16 rounded-lg"
                  style={{ backgroundColor: teamColor }}
                />
              </div>

              {/* Team Info */}
              <div className="flex-1">
                <h1 className="text-3xl font-bold mb-2">{teamName}</h1>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" style={{ borderColor: teamColor, color: teamColor }}>
                    {teamDrivers.length} Drivers
                  </Badge>
                  <Badge variant="secondary">
                    {season} Season
                  </Badge>
                </div>
              </div>

              {/* Championship Position */}
              {teamStanding && (
                <div className="text-center md:text-right">
                  <p className="text-sm text-muted-foreground mb-1">Constructors&apos;</p>
                  <div className="flex items-baseline gap-1 justify-center md:justify-end">
                    <span className="text-sm text-muted-foreground">P</span>
                    <AnimatedCounter
                      value={teamStanding.position_current}
                      duration={1}
                      className="text-4xl font-bold"
                    />
                  </div>
                  <div className="flex items-center gap-1 justify-center md:justify-end mt-1">
                    <AnimatedCounter
                      value={teamStanding.points_current}
                      duration={1.2}
                      className="text-xl font-semibold"
                    />
                    <span className="text-muted-foreground">pts</span>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div
                  className="p-2 rounded-lg"
                  style={{ backgroundColor: `${teamColor}20` }}
                >
                  <Trophy className="h-5 w-5" style={{ color: teamColor }} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Points</p>
                  <AnimatedCounter
                    value={teamStanding?.points_current ?? 0}
                    duration={1}
                    className="text-2xl font-bold"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
        >
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div
                  className="p-2 rounded-lg"
                  style={{ backgroundColor: `${teamColor}20` }}
                >
                  <Flag className="h-5 w-5" style={{ color: teamColor }} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Races</p>
                  <AnimatedCounter
                    value={raceSessionKeys.length}
                    duration={0.8}
                    className="text-2xl font-bold"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div
                  className="p-2 rounded-lg"
                  style={{ backgroundColor: `${teamColor}20` }}
                >
                  <TrendingUp className="h-5 w-5" style={{ color: teamColor }} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Avg Points/Race</p>
                  <p className="text-2xl font-bold">
                    {raceSessionKeys.length > 0
                      ? ((teamStanding?.points_current ?? 0) / raceSessionKeys.length).toFixed(1)
                      : "0"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25 }}
        >
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div
                  className="p-2 rounded-lg"
                  style={{ backgroundColor: `${teamColor}20` }}
                >
                  <Users className="h-5 w-5" style={{ color: teamColor }} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Drivers</p>
                  <p className="text-2xl font-bold">{teamDrivers.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Team Drivers */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4" />
              Driver Lineup
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              {teamDriverStandings.map(({ driver, standing }, index) => (
                <Link key={driver.driver_number} href={`/drivers/${driver.driver_number}`}>
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: 0.1 * index }}
                    className="flex items-center gap-4 p-4 rounded-xl border border-border hover:bg-muted/50 transition-colors cursor-pointer"
                  >
                    <DriverAvatar
                      headshotUrl={driver.headshot_url}
                      nameAcronym={driver.name_acronym}
                      teamColour={driver.team_colour}
                      size="lg"
                    />
                    <div className="flex-1">
                      <p className="font-semibold">{driver.full_name}</p>
                      <p className="text-sm text-muted-foreground">#{driver.driver_number}</p>
                    </div>
                    <div className="text-right">
                      {standing && (
                        <>
                          <div className="flex items-baseline gap-1 justify-end">
                            <span className="text-xs text-muted-foreground">P</span>
                            <span className="text-xl font-bold">{standing.position_current}</span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {standing.points_current} pts
                          </p>
                        </>
                      )}
                    </div>
                  </motion.div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Driver Points Comparison */}
      {teamDriverStandings.length === 2 && teamDriverStandings[0].standing && teamDriverStandings[1].standing && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.35 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Points Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {teamDriverStandings.map(({ driver, standing }) => {
                  if (!standing) return null;
                  const totalTeamPoints = teamStanding?.points_current ?? 1;
                  const percentage = (standing.points_current / totalTeamPoints) * 100;
                  
                  return (
                    <div key={driver.driver_number} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <DriverAvatar
                            headshotUrl={driver.headshot_url}
                            nameAcronym={driver.name_acronym}
                            teamColour={driver.team_colour}
                            size="sm"
                          />
                          <span className="font-medium">{driver.name_acronym}</span>
                        </div>
                        <span className="font-bold">{standing.points_current} pts</span>
                      </div>
                      <div className="h-3 rounded-full bg-muted overflow-hidden">
                        <motion.div
                          className="h-full rounded-full"
                          style={{ backgroundColor: teamColor }}
                          initial={{ width: 0 }}
                          animate={{ width: `${percentage}%` }}
                          transition={{ duration: 1, ease: "easeOut" }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground text-right">
                        {percentage.toFixed(1)}% of team points
                      </p>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
