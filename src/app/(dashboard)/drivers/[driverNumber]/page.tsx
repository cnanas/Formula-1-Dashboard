"use client";

import { use, useEffect, useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Trophy, Flag, Timer, TrendingUp, Users } from "lucide-react";
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

export default function DriverProfilePage({
  params,
}: {
  params: Promise<{ driverNumber: string }>;
}) {
  const { driverNumber } = use(params);
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

  // Get driver info
  const { data: drivers, isLoading: driversLoading } = useOpenF1(
    "drivers",
    { session_key: sessionKey },
    { enabled: !!sessionKey }
  );

  const driver = useMemo(() => {
    return drivers.find((d) => d.driver_number === Number(driverNumber));
  }, [drivers, driverNumber]);

  // Get championship standings
  const { data: standings, isLoading: standingsLoading } = useOpenF1(
    "championship_drivers",
    { session_key: sessionKey },
    { enabled: !!sessionKey }
  );

  const driverStanding = useMemo(() => {
    return standings.find((s) => s.driver_number === Number(driverNumber));
  }, [standings, driverNumber]);

  // Get all race results for the season
  const { data: allSessions } = useOpenF1("sessions", {
    year: season,
    session_type: "Race",
  });

  const raceSessionKeys = useMemo(() => {
    return allSessions
      .filter((s) => new Date(s.date_start) < new Date())
      .map((s) => s.session_key);
  }, [allSessions]);

  // Get meetings for race names
  const { data: meetings } = useOpenF1("meetings", { year: season });

  // Get teammate for comparison
  const teammate = useMemo(() => {
    if (!driver) return null;
    return drivers.find(
      (d) => d.team_name === driver.team_name && d.driver_number !== driver.driver_number
    );
  }, [drivers, driver]);

  const teammateStanding = useMemo(() => {
    if (!teammate) return null;
    return standings.find((s) => s.driver_number === teammate.driver_number);
  }, [standings, teammate]);

  // Set page title
  useEffect(() => {
    if (driver) {
      setPageTitle(driver.full_name, driver.team_name);
    }
    return () => clearPageTitle();
  }, [driver, setPageTitle, clearPageTitle]);

  const isLoading = sessionsLoading || driversLoading || standingsLoading;

  if (isLoading) return <PageSkeleton />;

  if (!driver) {
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
          title="Driver not found"
          description={`No driver found with number ${driverNumber} for the ${season} season.`}
        />
      </div>
    );
  }

  const teamColor = getTeamColor(driver.team_colour);

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Link href="/standings">
        <Button variant="ghost" size="sm">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Standings
        </Button>
      </Link>

      {/* Driver Header Card */}
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
              {/* Driver Avatar */}
              <DriverAvatar
                headshotUrl={driver.headshot_url}
                nameAcronym={driver.name_acronym}
                teamColour={driver.team_colour}
                size="xl"
              />

              {/* Driver Info */}
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl font-bold">{driver.full_name}</h1>
                  <Badge
                    variant="outline"
                    className="text-lg font-mono font-bold"
                    style={{ borderColor: teamColor, color: teamColor }}
                  >
                    #{driver.driver_number}
                  </Badge>
                </div>
                <Link href={`/teams/${encodeURIComponent(driver.team_name)}`}>
                  <p className="text-lg text-muted-foreground hover:text-primary transition-colors cursor-pointer">
                    {driver.team_name}
                  </p>
                </Link>
              </div>

              {/* Championship Position */}
              {driverStanding && (
                <div className="text-center md:text-right">
                  <p className="text-sm text-muted-foreground mb-1">Championship</p>
                  <div className="flex items-baseline gap-1 justify-center md:justify-end">
                    <span className="text-sm text-muted-foreground">P</span>
                    <AnimatedCounter
                      value={driverStanding.position_current}
                      duration={1}
                      className="text-4xl font-bold"
                    />
                  </div>
                  <div className="flex items-center gap-1 justify-center md:justify-end mt-1">
                    <AnimatedCounter
                      value={driverStanding.points_current}
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
                  <p className="text-sm text-muted-foreground">Points</p>
                  <AnimatedCounter
                    value={driverStanding?.points_current ?? 0}
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
                      ? ((driverStanding?.points_current ?? 0) / raceSessionKeys.length).toFixed(1)
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
                  <Timer className="h-5 w-5" style={{ color: teamColor }} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Season</p>
                  <p className="text-2xl font-bold">{season}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Teammate Comparison */}
      {teammate && teammateStanding && driverStanding && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-4 w-4" />
                Teammate Comparison
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 items-center">
                {/* Driver */}
                <div className="text-center">
                  <DriverAvatar
                    headshotUrl={driver.headshot_url}
                    nameAcronym={driver.name_acronym}
                    teamColour={driver.team_colour}
                    size="md"
                  />
                  <p className="font-semibold mt-2">{driver.name_acronym}</p>
                  <p className="text-2xl font-bold mt-1">{driverStanding.points_current}</p>
                  <p className="text-sm text-muted-foreground">points</p>
                </div>

                {/* VS */}
                <div className="text-center">
                  <p className="text-2xl font-bold text-muted-foreground">VS</p>
                  <div className="mt-4 space-y-2">
                    <div className="flex items-center justify-center gap-2">
                      <div
                        className="h-2 rounded-full"
                        style={{
                          width: `${(driverStanding.points_current / (driverStanding.points_current + teammateStanding.points_current)) * 100}%`,
                          backgroundColor: teamColor,
                          minWidth: "10%",
                        }}
                      />
                      <div
                        className="h-2 rounded-full bg-muted"
                        style={{
                          width: `${(teammateStanding.points_current / (driverStanding.points_current + teammateStanding.points_current)) * 100}%`,
                          minWidth: "10%",
                        }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Points: {driverStanding.points_current} - {teammateStanding.points_current}
                    </p>
                  </div>
                </div>

                {/* Teammate */}
                <Link href={`/drivers/${teammate.driver_number}`}>
                  <div className="text-center cursor-pointer hover:opacity-80 transition-opacity">
                    <DriverAvatar
                      headshotUrl={teammate.headshot_url}
                      nameAcronym={teammate.name_acronym}
                      teamColour={teammate.team_colour}
                      size="md"
                    />
                    <p className="font-semibold mt-2">{teammate.name_acronym}</p>
                    <p className="text-2xl font-bold mt-1">{teammateStanding.points_current}</p>
                    <p className="text-sm text-muted-foreground">points</p>
                  </div>
                </Link>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

    </div>
  );
}
