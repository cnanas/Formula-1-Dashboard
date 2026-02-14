"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { SessionSummary } from "@/types/game-telemetry";
import { Trophy, Clock, Flag, Zap, MapPin } from "lucide-react";

interface SessionSummaryCardProps {
  summary: SessionSummary;
}

function StatRow({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
}) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-border/60 last:border-0">
      <span className="flex items-center gap-2 text-sm text-muted-foreground">
        <Icon className="h-4 w-4" />
        {label}
      </span>
      <span className="font-semibold tabular-nums">{value}</span>
    </div>
  );
}

export function SessionSummaryCard({ summary }: SessionSummaryCardProps) {
  const positionLabel =
    summary.position === 1
      ? "1st"
      : summary.position === 2
        ? "2nd"
        : summary.position === 3
          ? "3rd"
          : `${summary.position}th`;

  return (
    <Card className="overflow-hidden border-2 border-primary/20 bg-gradient-to-b from-card to-card/95">
      <CardHeader className="pb-3 bg-muted/30">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Trophy className="h-5 w-5 text-amber-500" />
            Session summary
          </CardTitle>
          <Badge variant="secondary" className="font-mono">
            {summary.sessionType}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-1">
          <MapPin className="h-3.5 w-3.5" />
          {summary.trackName}
        </p>
      </CardHeader>
      <CardContent className="pt-4 space-y-1">
        <div className="flex items-center justify-center gap-4 py-4 mb-2 rounded-lg bg-muted/40">
          <div className="text-center">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">
              Position
            </p>
            <p className="text-4xl font-bold text-primary tabular-nums">
              {positionLabel}
            </p>
            {summary.gridPosition > 0 && summary.gridPosition !== summary.position && (
              <p className="text-xs text-muted-foreground mt-0.5">
                from P{summary.gridPosition}
              </p>
            )}
          </div>
          {summary.points > 0 && (
            <div className="text-center pl-4 border-l border-border">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">
                Points
              </p>
              <p className="text-3xl font-bold text-amber-500 tabular-nums">
                +{summary.points}
              </p>
            </div>
          )}
        </div>

        <StatRow
          label="Laps completed"
          value={`${summary.numLaps} / ${summary.totalLaps}`}
          icon={Flag}
        />
        <StatRow
          label="Best lap"
          value={summary.bestLapTimeFormatted}
          icon={Zap}
        />
        <StatRow
          label="Total time"
          value={summary.totalRaceTimeFormatted}
          icon={Clock}
        />
        {summary.numPitStops > 0 && (
          <StatRow label="Pit stops" value={summary.numPitStops} icon={Flag} />
        )}
        {(summary.numPenalties > 0 || (summary.penaltiesTime && summary.penaltiesTime > 0)) && (
          <StatRow
            label="Penalties"
            value={
              summary.penaltiesTime
                ? `${summary.numPenalties} (${(summary.penaltiesTime / 1000).toFixed(1)}s)`
                : summary.numPenalties
            }
            icon={Clock}
          />
        )}
      </CardContent>
    </Card>
  );
}
