"use client";

import Link from "next/link";
import useSWR from "swr";
import { MapPin, Flag, Trophy, Calendar, ChevronRight, Award } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { TrackOutline } from "@/components/shared/track-outline";
import { Skeleton } from "@/components/ui/skeleton";
import type { TrackHistoryResponse } from "@/app/api/tracks/[circuitKey]/route";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface TrackHistoryModalProps {
  circuitKey: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TrackHistoryModal({
  circuitKey,
  open,
  onOpenChange,
}: TrackHistoryModalProps) {
  const { data, error, isLoading } = useSWR<TrackHistoryResponse>(
    circuitKey ? `/api/tracks/${encodeURIComponent(circuitKey)}` : null,
    fetcher,
    { revalidateOnFocus: false, isPaused: () => !circuitKey || !open }
  );

  const circuitInfo = data?.circuitInfo;
  const raceHistory = data?.raceHistory ?? [];

  // Most wins and poles
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="flex max-h-[90vh] w-full max-w-2xl flex-col gap-0 p-0 sm:max-w-2xl"
        showCloseButton={true}
      >
        <VisuallyHidden.Root>
          <DialogTitle>
            {circuitInfo?.circuit_short_name
              ? `Track history - ${circuitInfo.circuit_short_name}`
              : "Track history"}
          </DialogTitle>
        </VisuallyHidden.Root>
        <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-6">
          {isLoading && (
            <div className="space-y-4">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-48 w-full" />
            </div>
          )}

          {error && !data && (
            <div className="py-8 text-center text-sm text-muted-foreground">
              Couldn&apos;t load track data. Please try again.
            </div>
          )}

          {!isLoading && circuitInfo && (
            <>
              {/* Circuit header */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-col gap-4 sm:flex-row">
                    <div className="flex h-32 w-full shrink-0 overflow-hidden rounded-xl bg-muted sm:w-48 sm:h-40">
                      {circuitInfo.circuit_image ? (
                        <img
                          src={circuitInfo.circuit_image}
                          alt={circuitInfo.circuit_short_name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-muted-foreground p-4">
                          <TrackOutline
                            circuitShortName={circuitInfo.circuit_short_name}
                            className="h-full w-full"
                            strokeWidth={2}
                          />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h2 className="text-xl font-bold tracking-tight">
                        {circuitInfo.circuit_short_name}
                      </h2>
                      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
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
                            className="h-5 w-6 rounded object-contain"
                          />
                        )}
                        <span className="text-sm font-medium">
                          {raceHistory.length} race
                          {raceHistory.length !== 1 ? "s" : ""} in our records
                          (2023–2026)
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Stats: most wins, most poles */}
              <div className="grid gap-4 sm:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Trophy className="h-4 w-4 text-amber-500" />
                      Most wins
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {topWinners.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        No race data yet.
                      </p>
                    ) : (
                      <ul className="space-y-2">
                        {topWinners.map(([name, count]) => (
                          <li
                            key={name}
                            className="flex items-center justify-between text-sm"
                          >
                            <span className="font-medium">{name}</span>
                            <span className="tabular-nums text-muted-foreground">
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
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Award className="h-4 w-4 text-primary" />
                      Most poles
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {topPoles.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        No qualifying data yet.
                      </p>
                    ) : (
                      <ul className="space-y-2">
                        {topPoles.map(([name, count]) => (
                          <li
                            key={name}
                            className="flex items-center justify-between text-sm"
                          >
                            <span className="font-medium">{name}</span>
                            <span className="tabular-nums text-muted-foreground">
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
                  <CardTitle className="flex items-center gap-2 text-base">
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
                          <TableHead className="hidden sm:table-cell">
                            Team
                          </TableHead>
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
                            <TableCell className="hidden text-muted-foreground sm:table-cell">
                              {race.winner?.team_name ?? "—"}
                            </TableCell>
                            <TableCell className="hidden text-muted-foreground sm:table-cell">
                              {race.pole?.full_name ?? "—"}
                            </TableCell>
                            <TableCell className="tabular-nums text-right text-muted-foreground">
                              {race.laps > 0 ? race.laps : "—"}
                            </TableCell>
                            <TableCell>
                              <Button variant="ghost" size="icon" asChild>
                                <Link
                                  href={`/race/${race.meeting_key}/${race.session_key}`}
                                  className="h-8 w-8"
                                  title="View race analysis"
                                  onClick={() => onOpenChange(false)}
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
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
