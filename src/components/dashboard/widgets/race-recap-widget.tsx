"use client";

import Link from "next/link";
import type { ComponentType } from "react";
import { AlertTriangle, ArrowRight, Flag, Gauge, Trophy } from "lucide-react";
import { DriverAvatar } from "@/components/shared/driver-avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useRaceRecap } from "@/hooks/use-race-recap";

export function RaceRecapWidget() {
  const { recap, sourceSeason, usedFallbackSeason, isLoading, error } = useRaceRecap();

  if (isLoading && !recap) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-10 w-full rounded-lg" />
        <div className="grid grid-cols-3 gap-2">
          <Skeleton className="h-14 w-full rounded-lg" />
          <Skeleton className="h-14 w-full rounded-lg" />
          <Skeleton className="h-14 w-full rounded-lg" />
        </div>
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-10/12" />
      </div>
    );
  }

  if (!recap) {
    return (
      <p className="py-4 text-center text-sm text-muted-foreground">
        {error ?? "No completed race to recap yet."}
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Badge variant="secondary" className="text-[10px]">
          Season {sourceSeason}
        </Badge>
        {usedFallbackSeason && (
          <Badge variant="outline" className="text-[10px]">
            Fallback
          </Badge>
        )}
      </div>

      <div className="rounded-lg border border-border/60 bg-muted/20 px-3 py-2.5">
        <p className="text-xs text-muted-foreground">{recap.meeting?.meeting_name ?? "Latest race"}</p>
        {recap.winner ? (
          <div className="mt-1.5 flex items-center gap-2">
            <DriverAvatar
              headshotUrl={null}
              nameAcronym={recap.winner.acronym}
              teamColour={recap.winner.teamColour}
              size="sm"
            />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{recap.winner.name}</p>
              <p className="truncate text-xs text-muted-foreground">{recap.winner.teamName}</p>
            </div>
            <Trophy className="ml-auto h-4 w-4 shrink-0 text-amber-500" />
          </div>
        ) : (
          <p className="mt-1 text-xs text-muted-foreground">Winner unavailable</p>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2">
        <Metric label="Overtakes" value={String(recap.overtakes)} icon={Gauge} />
        <Metric label="Pit Stops" value={String(recap.pitStops)} icon={Flag} />
        <Metric label="DNF" value={String(recap.retirements)} icon={AlertTriangle} />
      </div>

      <div className="space-y-1.5">
        {recap.highlights.slice(0, 2).map((highlight) => (
          <p key={highlight} className="line-clamp-2 text-xs text-muted-foreground">
            {highlight}
          </p>
        ))}
      </div>

      <div className="flex items-center justify-end">
        <Link
          href="/recap"
          className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:text-primary/80"
        >
          Open recap
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: ComponentType<{ className?: string }>;
}) {
  return (
    <div className="rounded-lg border border-border/60 px-2 py-1.5">
      <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
        <Icon className="h-3 w-3" />
        {label}
      </div>
      <p className="mt-1 text-sm font-semibold tabular-nums">{value}</p>
    </div>
  );
}
