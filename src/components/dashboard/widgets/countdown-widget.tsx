"use client";

import { Calendar } from "lucide-react";
import { useCountdown } from "@/hooks/use-countdown";
import { useOpenF1 } from "@/hooks/use-openf1";
import { Skeleton } from "@/components/ui/skeleton";

export function CountdownWidget() {
  const { data: meetings, isLoading } = useOpenF1("meetings", {
    year: new Date().getFullYear(),
  });

  const now = new Date();
  const upcomingMeeting =
    meetings.find((m) => new Date(m.date_start) > now) ??
    meetings[meetings.length - 1] ??
    null;

  const countdown = useCountdown(upcomingMeeting?.date_start ?? null);

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-5 w-2/3" />
        <Skeleton className="h-4 w-1/2" />
        <div className="grid grid-cols-4 gap-2 mt-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-12" />
          ))}
        </div>
      </div>
    );
  }

  if (!upcomingMeeting) {
    return (
      <p className="text-sm text-muted-foreground">No upcoming race found</p>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-1">
        <Calendar className="h-4 w-4 text-muted-foreground" />
        <span className="text-xs text-muted-foreground uppercase tracking-wide">
          Next Race
        </span>
      </div>
      <h3 className="text-lg font-bold leading-tight">
        {upcomingMeeting.meeting_name}
      </h3>
      <p className="text-xs text-muted-foreground mb-3">
        {upcomingMeeting.location}, {upcomingMeeting.country_name}
      </p>

      {countdown.isExpired ? (
        <p className="text-sm font-medium text-green-500">
          Race weekend is live!
        </p>
      ) : (
        <div className="grid grid-cols-4 gap-2 text-center">
          {[
            { value: countdown.days, label: "Days" },
            { value: countdown.hours, label: "Hrs" },
            { value: countdown.minutes, label: "Min" },
            { value: countdown.seconds, label: "Sec" },
          ].map((unit) => (
            <div
              key={unit.label}
              className="rounded-lg bg-muted p-2"
            >
              <p className="text-xl font-bold font-mono leading-none">
                {unit.value}
              </p>
              <p className="text-[10px] text-muted-foreground mt-1">
                {unit.label}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
