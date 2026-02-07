"use client";

import { use, useEffect } from "react";
import Link from "next/link";
import useSWR from "swr";
import { format } from "date-fns";
import {
  ArrowLeft,
  Trophy,
  MapPin,
  Flag,
  Calendar,
  ChevronRight,
  Award,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TrackOutline } from "@/components/shared/track-outline";
import { PageSkeleton } from "@/components/shared/loading-skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { usePageTitle } from "@/providers/page-title-provider";
import type { TrackHistoryResponse } from "@/app/api/tracks/[circuitKey]/route";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function TrackPage({
  params,
}: {
  params: Promise<{ circuitKey: string }>;
}) {
  const { circuitKey } = use(params);
  const { setPageTitle, clearPageTitle } = usePageTitle();

  const { data, error, isLoading } = useSWR<TrackHistoryResponse>(
    `/api/tracks/${encodeURIComponent(circuitKey)}`,
    fetcher,
    { revalidateOnFocus: false }
  );

  useEffect(() => {
    if (data?.circuitInfo) {
      setPageTitle(
        `${data.circuitInfo.circuit_short_name} Track History`,
        data.circuitInfo.country_name
      );
    }
    return () => clearPageTitle();
  }, [data?.circuitInfo, setPageTitle, clearPageTitle]);

  if (isLoading) return <PageSkeleton />;

  if (error || !data) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/calendar" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Calendar
          </Link>
        </Button>
        <EmptyState
          icon={MapPin}
          title="Track not found"
          description="We couldn't load history for this circuit. It may not be in our database yet."
        />
      </div>
    );
  }

  const { circuitInfo, raceHistory } = data;
  if (!circuitInfo) {
    return (
      <EmptyState
        icon={MapPin}
        title="No data"
        description="No circuit information available for this track."
      />
    );
  }

  // Most wins and poles (driver name -> count)
  const winsByDriver = new Map<string, number>();
  const polesByDriver = new Map<string, number>();
  raceHistory.forEach((race) => {
    if (race.winner) {
      winsByDriver.set(
        race.winner.full_name,
        (winsByDriver.get(race.winner.full_name) ?? 0) + 1
      );
    }
    if (race.pole) {
      polesByDriver.set(
        race.pole.full_name,
        (polesByDriver.get(race.pole.full_name) ?? 0) + 1
      );
    }
  });
  const topWinners = [...winsByDriver.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  const topPoles = [...polesByDriver.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" asChild>
        <Link href="/calendar" className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Calendar
        </Link>
      </Button>

      {/* Circuit header */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Track outline or image */}
            <div className="flex-shrink-0 w-full md:w-48 h-32 md:h-40 rounded-xl overflow-hidden bg-muted flex items-center justify-center">
              {circuitInfo.circuit_image ? (
                <img
                  src={circuitInfo.circuit_image}
                  alt={circuitInfo.circuit_short_name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <TrackOutline
                  circuitShortName={circuitInfo.circuit_short_name}
                  className="w-3/4 h-3/4 text-muted-foreground"
                  strokeWidth={2}
                />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold tracking-tight">
                {circuitInfo.circuit_short_name}
              </h1>
              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4" />
                  {circuitInfo.location}, {circuitInfo.country_name}
                </span>
                {circuitInfo.circuit_type && (
                  <span className="flex items-center gap-1.5">
                    <Flag className="h-4 w-4" />
                    {circuitInfo.circuit_type}
                  </span>
                )}
              </div>
              <div className="mt-3 flex items-center gap-2">
                {circuitInfo.country_flag && (
                  <img
                    src={circuitInfo.country_flag}
                    alt=""
                    className="h-5 w-6 object-contain rounded"
                  />
                )}
                <span className="text-sm font-medium">
                  {raceHistory.length} race{raceHistory.length !== 1 ? "s" : ""} in
                  our records (2023–2026)
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats: most wins, most poles */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Trophy className="h-4 w-4 text-amber-500" />
              Most wins at this track
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topWinners.length === 0 ? (
              <p className="text-sm text-muted-foreground">No race data yet.</p>
            ) : (
              <ul className="space-y-2">
                {topWinners.map(([name, count]) => (
                  <li
                    key={name}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="font-medium">{name}</span>
                    <span className="text-muted-foreground tabular-nums">
                      {count} win{count !== 1 ? "s" : ""}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Award className="h-4 w-4 text-primary" />
              Most pole positions
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topPoles.length === 0 ? (
              <p className="text-sm text-muted-foreground">No qualifying data yet.</p>
            ) : (
              <ul className="space-y-2">
                {topPoles.map(([name, count]) => (
                  <li
                    key={name}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="font-medium">{name}</span>
                    <span className="text-muted-foreground tabular-nums">
                      {count} pole{count !== 1 ? "s" : ""}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Race history table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Race history
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {raceHistory.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No race results in our records for this circuit.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Year</TableHead>
                  <TableHead>Winner</TableHead>
                  <TableHead className="hidden sm:table-cell">Team</TableHead>
                  <TableHead className="hidden sm:table-cell">Pole</TableHead>
                  <TableHead className="text-right">Laps</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {raceHistory.map((race) => (
                  <TableRow key={`${race.year}-${race.meeting_key}`}>
                    <TableCell className="font-mono font-semibold">
                      {race.year}
                    </TableCell>
                    <TableCell>
                      {race.winner ? (
                        <span className="font-medium">
                          {race.winner.full_name}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-muted-foreground">
                      {race.winner?.team_name ?? "—"}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-muted-foreground">
                      {race.pole?.full_name ?? "—"}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground tabular-nums">
                      {race.laps > 0 ? race.laps : "—"}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" asChild>
                        <Link
                          href={`/race/${race.meeting_key}/${race.session_key}`}
                          className="h-8 w-8"
                          title="View race analysis"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
