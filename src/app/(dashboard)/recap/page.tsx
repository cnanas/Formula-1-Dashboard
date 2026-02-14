"use client";

import Link from "next/link";
import { useEffect, useMemo } from "react";
import type { ComponentType } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Flag,
  Gauge,
  Trophy,
  Users,
} from "lucide-react";
import { DriverAvatar } from "@/components/shared/driver-avatar";
import { DataReliability } from "@/components/shared/data-reliability";
import { EmptyState } from "@/components/shared/empty-state";
import { PageSkeleton } from "@/components/shared/loading-skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useRaceRecap } from "@/hooks/use-race-recap";
import { usePageTitle } from "@/providers/page-title-provider";
import { formatLapTime } from "@/lib/utils/formatting";

function formatSessionDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date TBD";
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function RecapPage() {
  const { setPageTitle, clearPageTitle } = usePageTitle();
  const { recap, sourceSeason, usedFallbackSeason, isLoading, error, refresh } = useRaceRecap();

  const meetingName = recap?.meeting?.meeting_name ?? "Race Recap";
  const meetingLocation = recap?.meeting
    ? `${recap.meeting.circuit_short_name}, ${recap.meeting.location}`
    : recap?.session.circuit_short_name ?? "Unknown Circuit";

  useEffect(() => {
    setPageTitle("Race Recap", meetingName === "Race Recap" ? "Latest completed race" : meetingName);
    return () => clearPageTitle();
  }, [meetingName, setPageTitle, clearPageTitle]);

  const raceLink = useMemo(() => {
    if (!recap) return null;
    return `/race/${recap.session.meeting_key}/${recap.session.session_key}`;
  }, [recap]);

  if (isLoading && !recap) {
    return <PageSkeleton />;
  }

  if (!recap) {
    return (
      <div className="space-y-6">
        <DataReliability
          sourceLabel="OpenF1 race data"
          isLoading={isLoading}
          error={error}
          refreshIntervalMs={60_000}
          onRefresh={refresh}
        />
        <EmptyState
          icon={Trophy}
          title="No completed race found"
          description="A full recap appears once a race has finished."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <DataReliability
        sourceLabel="OpenF1 race data"
        isLoading={isLoading}
        error={error}
        refreshIntervalMs={60_000}
        onRefresh={refresh}
      />

      <Card className="border-border/60">
        <CardHeader className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">Season {sourceSeason}</Badge>
            {usedFallbackSeason && (
              <Badge variant="outline" className="text-xs">
                Fallback season used
              </Badge>
            )}
            <Badge variant="outline">{recap.session.session_name}</Badge>
            <Badge variant="outline">{formatSessionDate(recap.session.date_start)}</Badge>
          </div>
          <CardTitle className="text-xl sm:text-2xl">{recap.headline}</CardTitle>
          <CardDescription>{meetingLocation}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {recap.winner ? (
            <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-muted/20 px-3 py-2.5">
              <DriverAvatar
                headshotUrl={null}
                nameAcronym={recap.winner.acronym}
                teamColour={recap.winner.teamColour}
                size="md"
              />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-foreground">
                  Winner: {recap.winner.name}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {recap.winner.teamName}
                </p>
              </div>
              <Trophy className="ml-auto h-4 w-4 shrink-0 text-amber-500" />
            </div>
          ) : (
            <div className="flex items-center gap-2 rounded-xl border border-border/60 bg-muted/20 px-3 py-2.5 text-sm text-muted-foreground">
              <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500" />
              Winner could not be resolved from this session.
            </div>
          )}

          <div className="grid gap-2 sm:grid-cols-2">
            {recap.highlights.map((highlight) => (
              <div
                key={highlight}
                className="rounded-lg border border-border/60 bg-background/60 px-3 py-2 text-sm text-muted-foreground"
              >
                {highlight}
              </div>
            ))}
          </div>

          {raceLink && (
            <div className="flex flex-wrap items-center gap-2">
              <Button size="sm" asChild>
                <Link href={raceLink}>
                  Open full race analysis
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button size="sm" variant="outline" asChild>
                <Link href={`${raceLink}/strategy`}>Open strategy view</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Podium</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {recap.podium.length === 0 ? (
              <p className="text-sm text-muted-foreground">No podium data available.</p>
            ) : (
              recap.podium.map((finisher) => (
                <div
                  key={finisher.driver.driverNumber}
                  className="flex items-center gap-2.5 rounded-lg border border-border/60 px-2.5 py-2"
                >
                  <Badge variant="secondary" className="w-7 justify-center px-0">
                    P{finisher.finishPosition}
                  </Badge>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{finisher.driver.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{finisher.driver.teamName}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">{finisher.gapLabel}</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Position Swings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-lg border border-border/60 bg-muted/20 px-3 py-2.5">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Biggest Gainer
              </p>
              {recap.biggestGainer ? (
                <p className="mt-1 text-sm">
                  <span className="font-semibold">{recap.biggestGainer.driver.name}</span>{" "}
                  gained <span className="font-semibold">+{recap.biggestGainer.gain}</span>{" "}
                  ({recap.biggestGainer.startPosition} → {recap.biggestGainer.finishPosition})
                </p>
              ) : (
                <p className="mt-1 text-sm text-muted-foreground">No grid delta data.</p>
              )}
            </div>

            <div className="rounded-lg border border-border/60 bg-muted/20 px-3 py-2.5">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Biggest Drop
              </p>
              {recap.biggestLoser ? (
                <p className="mt-1 text-sm">
                  <span className="font-semibold">{recap.biggestLoser.driver.name}</span>{" "}
                  lost <span className="font-semibold">{Math.abs(recap.biggestLoser.gain)}</span>{" "}
                  ({recap.biggestLoser.startPosition} → {recap.biggestLoser.finishPosition})
                </p>
              ) : (
                <p className="mt-1 text-sm text-muted-foreground">No major position losses.</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Race Pulse</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5">
            <div className="grid grid-cols-2 gap-2">
              <MetricPill icon={Users} label="Overtakes" value={String(recap.overtakes)} />
              <MetricPill icon={Flag} label="Pit Stops" value={String(recap.pitStops)} />
              <MetricPill icon={AlertTriangle} label="DNF" value={String(recap.retirements)} />
              <MetricPill
                icon={Gauge}
                label="Penalties"
                value={String(recap.incidents.penalties)}
              />
            </div>

            {recap.fastestLap && (
              <div className="rounded-lg border border-border/60 px-3 py-2 text-xs text-muted-foreground">
                Fastest lap:{" "}
                <span className="font-medium text-foreground">
                  {recap.fastestLap.driver.name}
                </span>{" "}
                ({formatLapTime(recap.fastestLap.lapDuration)})
              </div>
            )}

            {recap.fastestPitStop && (
              <div className="rounded-lg border border-border/60 px-3 py-2 text-xs text-muted-foreground">
                Fastest stop:{" "}
                <span className="font-medium text-foreground">
                  {recap.fastestPitStop.driver.name}
                </span>{" "}
                ({recap.fastestPitStop.stopDuration.toFixed(3)}s)
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Final Classification</CardTitle>
          <CardDescription>Top 10 finishers from the latest completed race</CardDescription>
        </CardHeader>
        <CardContent className="px-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">Pos</TableHead>
                <TableHead>Driver</TableHead>
                <TableHead className="hidden sm:table-cell">Start</TableHead>
                <TableHead className="hidden sm:table-cell">Gain</TableHead>
                <TableHead className="text-right">Gap</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recap.finishers.slice(0, 10).map((finisher) => (
                <TableRow key={finisher.driver.driverNumber}>
                  <TableCell className="font-bold">{finisher.finishPosition}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <DriverAvatar
                        headshotUrl={null}
                        nameAcronym={finisher.driver.acronym}
                        teamColour={finisher.driver.teamColour}
                        size="sm"
                      />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{finisher.driver.name}</p>
                        <p className="truncate text-xs text-muted-foreground">{finisher.driver.teamName}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">{finisher.gridPosition ?? "-"}</TableCell>
                  <TableCell className="hidden sm:table-cell">
                    {finisher.gain == null
                      ? "-"
                      : finisher.gain > 0
                      ? `+${finisher.gain}`
                      : finisher.gain}
                  </TableCell>
                  <TableCell className="text-right">
                    {finisher.status ?? finisher.gapLabel}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function MetricPill({
  icon: Icon,
  label,
  value,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-border/60 px-2.5 py-2">
      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <p className="mt-1 text-base font-semibold">{value}</p>
    </div>
  );
}
