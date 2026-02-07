"use client";

import { useCountdown } from "@/hooks/use-countdown";
import { useOpenF1 } from "@/hooks/use-openf1";
import { useSeason } from "@/providers/season-provider";
import { Skeleton } from "@/components/ui/skeleton";
import { TrackOutline } from "@/components/shared/track-outline";

export function CountdownWidget() {
  const { season } = useSeason();

  const { data: meetings, isLoading } = useOpenF1("meetings", {
    year: season,
  });

  const { data: sessions } = useOpenF1("sessions", {
    year: season,
  });

  const now = new Date();
  const upcomingMeeting =
    meetings.find((m) => new Date(m.date_start) > now) ??
    meetings[meetings.length - 1] ??
    null;

  // Find the next session for this meeting to determine session type
  const meetingSessions = upcomingMeeting
    ? sessions
        .filter((s) => s.meeting_key === upcomingMeeting.meeting_key)
        .sort((a, b) => new Date(a.date_start).getTime() - new Date(b.date_start).getTime())
    : [];
  const nextSession = meetingSessions.find((s) => new Date(s.date_start) > now) ?? meetingSessions[0];

  const countdown = useCountdown(upcomingMeeting?.date_start ?? null);

  if (isLoading) {
    return (
      <div className="h-full bg-gradient-to-br from-red-700 to-red-900 rounded-2xl p-5">
        <Skeleton className="h-5 w-20 bg-white/20" />
        <Skeleton className="h-5 w-32 mt-2 bg-white/20" />
        <div className="grid grid-cols-4 gap-3 mt-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-14 bg-white/20" />
          ))}
        </div>
      </div>
    );
  }

  if (!upcomingMeeting) {
    return (
      <div className="h-full bg-gradient-to-br from-red-700 to-red-900 rounded-2xl p-5 flex items-center justify-center">
        <p className="text-sm text-white/70">No upcoming race found</p>
      </div>
    );
  }

  // Determine session type label
  const sessionType = nextSession?.session_name ?? "Race";
  const isTestingOrPractice = sessionType.toLowerCase().includes("practice") || sessionType.toLowerCase().includes("test");

  return (
    <div className="relative h-full bg-gradient-to-br from-red-700 via-red-800 to-red-900 rounded-2xl p-5 flex flex-col justify-between text-white overflow-hidden">
      {/* Track circuit background decoration */}
      <div className="absolute top-1/2 right-0 -translate-y-1/2 translate-x-1/4 opacity-[0.08] pointer-events-none w-48 h-48">
        <TrackOutline
          circuitShortName={upcomingMeeting.circuit_short_name}
          strokeColor="white"
          strokeWidth={3}
        />
      </div>

      {/* Top: Badge + Event name */}
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-1">
          <span className="inline-block text-xs font-semibold bg-white/20 backdrop-blur-sm rounded px-2 py-0.5">
            {isTestingOrPractice ? "Testing" : sessionType}
          </span>
          <span className="text-sm text-white/80 font-medium">
            {upcomingMeeting.circuit_short_name}
          </span>
        </div>
      </div>

      {/* Countdown */}
      <div className="relative z-10">
        {countdown.isExpired ? (
          <p className="text-lg font-bold text-white">
            Race weekend is live!
          </p>
        ) : (
          <div className="grid grid-cols-4 gap-3 text-center">
            {[
              { value: countdown.days, label: "DAYS" },
              { value: countdown.hours, label: "HRS" },
              { value: countdown.minutes, label: "MINS" },
              { value: countdown.seconds, label: "SEC" },
            ].map((unit) => (
              <div key={unit.label}>
                <p className="text-4xl font-bold font-mono leading-none tracking-tight">
                  {String(unit.value).padStart(2, "0")}
                </p>
                <p className="text-[10px] text-white/60 mt-1.5 font-medium tracking-wider">
                  {unit.label}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
