"use client";

import { format, isPast } from "date-fns";
import { MapPin, Clock, CheckCircle2, ChevronRight } from "lucide-react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useOpenF1 } from "@/hooks/use-openf1";
import { PageSkeleton } from "@/components/shared/loading-skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { CountdownCard } from "@/components/cards/countdown-card";
import type { Meeting } from "@/types/openf1";

export default function CalendarPage() {
  const currentYear = new Date().getFullYear();
  const { data: meetings, isLoading } = useOpenF1("meetings", {
    year: currentYear,
  });

  if (isLoading) return <PageSkeleton />;

  if (meetings.length === 0) {
    return (
      <div className="space-y-6">
        <EmptyState
          title="No races found"
          description={`No race data available for ${currentYear}.`}
        />
      </div>
    );
  }

  const now = new Date();
  const upcomingMeeting =
    meetings.find((m) => new Date(m.date_start) > now) ?? null;

  return (
    <div className="space-y-6">
      {/* Countdown to next race */}
      <div className="max-w-md">
        <CountdownCard meeting={upcomingMeeting} />
      </div>

      {/* Race list */}
      <div className="grid gap-3">
        {meetings.map((meeting, index) => (
          <RaceCard key={meeting.meeting_key} meeting={meeting} round={index + 1} />
        ))}
      </div>
    </div>
  );
}

function RaceCard({ meeting, round }: { meeting: Meeting; round: number }) {
  const startDate = new Date(meeting.date_start);
  const endDate = new Date(meeting.date_end);
  const completed = isPast(endDate);
  const isLive =
    isPast(startDate) && !isPast(endDate);

  return (
    <Link href={`/history?meeting=${meeting.meeting_key}`}>
      <Card
        className={`hover:bg-accent transition-colors cursor-pointer ${
          isLive ? "border-red-500/50" : ""
        }`}
      >
        <CardContent className="flex items-center gap-4 py-4">
          {/* Round number */}
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted font-bold text-sm">
            R{round}
          </div>

          {/* Race info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold truncate">
                {meeting.meeting_name}
              </h3>
              {isLive && (
                <Badge variant="destructive" className="text-xs">
                  LIVE
                </Badge>
              )}
              {completed && (
                <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
              )}
            </div>
            <div className="flex items-center gap-3 text-sm text-muted-foreground mt-0.5">
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {meeting.location}, {meeting.country_name}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {format(startDate, "MMM d")} - {format(endDate, "MMM d")}
              </span>
            </div>
          </div>

          {/* Circuit name */}
          <div className="hidden sm:block text-sm text-muted-foreground text-right">
            {meeting.circuit_short_name}
          </div>

          <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
        </CardContent>
      </Card>
    </Link>
  );
}
