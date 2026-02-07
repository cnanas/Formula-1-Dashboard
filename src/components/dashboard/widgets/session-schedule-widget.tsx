"use client";

import { useState, useEffect } from "react";
import { format, formatDistanceToNow, isPast, isFuture } from "date-fns";
import { Calendar, Clock, MapPin, Flag, Timer } from "lucide-react";
import { useOpenF1 } from "@/hooks/use-openf1";
import { useSeason } from "@/providers/season-provider";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// Session type colors
function getSessionColor(sessionType: string) {
  switch (sessionType.toLowerCase()) {
    case "race":
      return "bg-red-500";
    case "qualifying":
      return "bg-purple-500";
    case "sprint":
      return "bg-orange-500";
    case "sprint qualifying":
    case "sprint shootout":
      return "bg-amber-500";
    default:
      return "bg-blue-500"; // Practice sessions
  }
}

function getSessionBadgeVariant(sessionType: string): "default" | "secondary" | "destructive" | "outline" {
  switch (sessionType.toLowerCase()) {
    case "race":
      return "destructive";
    case "qualifying":
      return "default";
    default:
      return "secondary";
  }
}

interface CountdownDisplayProps {
  targetDate: Date;
  label: string;
}

function CountdownDisplay({ targetDate, label }: CountdownDisplayProps) {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const difference = targetDate.getTime() - now.getTime();

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  return (
    <div className="text-center space-y-3">
      <p className="text-sm text-muted-foreground font-medium">{label}</p>
      <div className="flex justify-center gap-3">
        <TimeUnit value={timeLeft.days} label="Days" />
        <TimeUnit value={timeLeft.hours} label="Hrs" />
        <TimeUnit value={timeLeft.minutes} label="Min" />
        <TimeUnit value={timeLeft.seconds} label="Sec" />
      </div>
    </div>
  );
}

function TimeUnit({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="bg-muted/50 rounded-xl px-4 py-3 min-w-[60px]">
        <span className="text-2xl font-bold tabular-nums">
          {value.toString().padStart(2, "0")}
        </span>
      </div>
      <span className="text-xs text-muted-foreground mt-1">{label}</span>
    </div>
  );
}

export function SessionScheduleWidget() {
  const { season } = useSeason();

  // Get meetings for selected season
  const { data: meetings, isLoading: meetingsLoading } = useOpenF1("meetings", {
    year: season,
  });

  // Find the next upcoming meeting
  const now = new Date();
  const upcomingMeeting = meetings.find((m) => new Date(m.date_end) > now);

  // Get sessions for the upcoming meeting
  const { data: sessions, isLoading: sessionsLoading } = useOpenF1(
    "sessions",
    { meeting_key: upcomingMeeting?.meeting_key?.toString() ?? "" },
    { enabled: !!upcomingMeeting }
  );

  const isLoading = meetingsLoading || sessionsLoading;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-24 w-full rounded-xl" />
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (!upcomingMeeting) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center py-8">
        <Flag className="h-12 w-12 text-muted-foreground/50 mb-3" />
        <p className="text-muted-foreground">No upcoming races scheduled</p>
      </div>
    );
  }

  // Sort sessions by date
  const sortedSessions = [...sessions].sort(
    (a, b) => new Date(a.date_start).getTime() - new Date(b.date_start).getTime()
  );

  // Find the next upcoming session
  const nextSession = sortedSessions.find((s) => isFuture(new Date(s.date_start)));
  const nextSessionDate = nextSession ? new Date(nextSession.date_start) : null;

  return (
    <div className="space-y-5">
      {/* Meeting header */}
      <div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
          <MapPin className="h-4 w-4" />
          <span>{upcomingMeeting.location}, {upcomingMeeting.country_name}</span>
        </div>
        <h4 className="text-lg font-bold">{upcomingMeeting.meeting_name}</h4>
        <p className="text-sm text-muted-foreground">
          {format(new Date(upcomingMeeting.date_start), "MMM d")} - {format(new Date(upcomingMeeting.date_end), "MMM d, yyyy")}
        </p>
      </div>

      {/* Countdown to next session */}
      {nextSessionDate && nextSession && (
        <div className="bg-gradient-to-br from-muted/30 to-muted/50 rounded-xl p-4">
          <CountdownDisplay
            targetDate={nextSessionDate}
            label={`Until ${nextSession.session_name}`}
          />
        </div>
      )}

      {/* Session schedule */}
      <div className="space-y-2">
        <h5 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          Weekend Schedule
        </h5>
        <div className="space-y-1.5">
          {sortedSessions.map((session) => {
            const sessionDate = new Date(session.date_start);
            const isCompleted = isPast(sessionDate);
            const isNext = session.session_key === nextSession?.session_key;

            return (
              <div
                key={session.session_key}
                className={cn(
                  "flex items-center justify-between p-3 rounded-lg transition-colors",
                  isNext && "bg-primary/10 ring-1 ring-primary/20",
                  isCompleted && "opacity-60",
                  !isNext && !isCompleted && "hover:bg-muted/50"
                )}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "h-2 w-2 rounded-full",
                      getSessionColor(session.session_type)
                    )}
                  />
                  <div>
                    <p className={cn(
                      "text-sm font-medium",
                      isCompleted && "line-through"
                    )}>
                      {session.session_name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(sessionDate, "EEE, MMM d")}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {isNext && (
                    <Badge variant="default" className="text-xs">
                      Next
                    </Badge>
                  )}
                  {isCompleted && (
                    <Badge variant="secondary" className="text-xs">
                      Done
                    </Badge>
                  )}
                  <span className="text-sm font-mono text-muted-foreground">
                    {format(sessionDate, "HH:mm")}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
