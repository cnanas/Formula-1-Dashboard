"use client";

import { useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import { Users } from "lucide-react";
import { useOpenF1 } from "@/hooks/use-openf1";
import { useSeason } from "@/providers/season-provider";
import { usePageTitle } from "@/providers/page-title-provider";
import { TeamCard } from "@/components/teams/team-card";
import { PageSkeleton } from "@/components/shared/loading-skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";

export default function TeamsPage() {
  const { season, availableSeasons } = useSeason();
  const { setPageTitle, clearPageTitle } = usePageTitle();

  const { data: sessions, isLoading: sessionsLoading } = useOpenF1("sessions", {
    year: season,
    session_type: "Race",
  });

  const latestSession = useMemo(() => {
    return sessions
      ?.filter((s) => new Date(s.date_start) < new Date())
      .sort((a, b) => new Date(b.date_start).getTime() - new Date(a.date_start).getTime())[0];
  }, [sessions]);

  const fallbackSeason = useMemo(() => {
    if (latestSession) return null;
    return availableSeasons.find((y) => y < season) ?? null;
  }, [latestSession, season, availableSeasons]);

  const { data: fallbackSessions } = useOpenF1(
    "sessions",
    { year: fallbackSeason ?? 0, session_type: "Race" },
    { enabled: !!fallbackSeason }
  );

  const fallbackSession = useMemo(() => {
    if (!fallbackSeason || !fallbackSessions?.length) return undefined;
    const completed = fallbackSessions.filter((s) => new Date(s.date_start) < new Date());
    return completed.sort((a, b) => new Date(b.date_start).getTime() - new Date(a.date_start).getTime())[0];
  }, [fallbackSeason, fallbackSessions]);

  const sessionKey = (latestSession ?? fallbackSession)?.session_key?.toString();

  const { data: drivers, isLoading: driversLoading } = useOpenF1(
    "drivers",
    { session_key: sessionKey },
    { enabled: !!sessionKey }
  );

  const { data: constructorStandings, isLoading: standingsLoading } = useOpenF1(
    "championship_teams",
    { session_key: sessionKey },
    { enabled: !!sessionKey }
  );

  const teamsWithDrivers = useMemo(() => {
    if (!drivers?.length) return [];
    const byTeam = new Map<string, typeof drivers>();
    for (const d of drivers) {
      const name = d.team_name;
      if (!name) continue;
      if (!byTeam.has(name)) byTeam.set(name, []);
      byTeam.get(name)!.push(d);
    }
    return Array.from(byTeam.entries())
      .map(([teamName, teamDrivers]) => ({
        teamName,
        drivers: teamDrivers,
        standing: constructorStandings?.find((s) => s.team_name === teamName),
      }))
      .sort(
        (a, b) =>
          (a.standing?.position_current ?? 99) - (b.standing?.position_current ?? 99)
      );
  }, [drivers, constructorStandings]);

  const isLoading = sessionsLoading || driversLoading || standingsLoading;

  useEffect(() => {
    setPageTitle("Teams", `${season} Season`);
    return () => clearPageTitle();
  }, [season, setPageTitle, clearPageTitle]);

  if (isLoading) return <PageSkeleton />;

  if (!teamsWithDrivers.length) {
    return (
      <div className="space-y-6">
        <EmptyState
          icon={Users}
          title="No teams found"
          description={`No team data available for the ${season} season yet.`}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.header
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Teams</h1>
          <p className="text-sm text-muted-foreground">
            {season} constructor lineup
          </p>
        </div>
        <Badge variant="secondary" className="font-mono">
          {season}
        </Badge>
      </motion.header>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
      >
        {teamsWithDrivers.map(({ teamName, drivers, standing }, index) => (
          <TeamCard
            key={teamName}
            teamName={teamName}
            drivers={drivers}
            position={standing?.position_current}
            points={standing?.points_current}
            index={index}
          />
        ))}
      </motion.div>
    </div>
  );
}
