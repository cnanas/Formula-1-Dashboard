"use client";

import Link from "next/link";
import Image from "next/image";
import { format, isPast } from "date-fns";
import { MapPin, CheckCircle2 } from "lucide-react";
import { useOpenF1 } from "@/hooks/use-openf1";
import { useSeason } from "@/providers/season-provider";
import { Skeleton } from "@/components/ui/skeleton";
import { getCircuitTheme } from "@/lib/constants/circuits";
import { getCountryFlagCode } from "@/lib/constants/country-codes";
import { parseApiDate } from "@/lib/utils/formatting";

export function CalendarWidget() {
  const { season } = useSeason();

  const { data: meetings, isLoading } = useOpenF1("meetings", {
    year: season,
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-lg" />
            <div className="space-y-1 flex-1">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Show next 5 upcoming + current
  const now = new Date();
  const upcoming = meetings
    .filter((m) => (parseApiDate(m.date_end) ?? new Date(0)) >= now)
    .slice(0, 5);

  if (upcoming.length === 0) {
    const completed = [...meetings]
      .filter((m) => (parseApiDate(m.date_end) ?? new Date(0)) < now)
      .sort((a, b) => (parseApiDate(b.date_end)?.getTime() ?? 0) - (parseApiDate(a.date_end)?.getTime() ?? 0))
      .slice(0, 5);

    if (completed.length === 0) {
      return (
        <p className="text-sm text-muted-foreground text-center py-4">
          No race data available
        </p>
      );
    }

    return (
      <div className="space-y-1">
        {completed.map((meeting) => {
          const startDate = parseApiDate(meeting.date_start) ?? new Date(0);
          const flagCode = (getCircuitTheme(meeting.circuit_short_name).countryCode || getCountryFlagCode(meeting.country_code)).toLowerCase();
          return (
            <div
              key={meeting.meeting_key}
              className="flex items-center gap-3 py-2 px-1 rounded-md hover:bg-muted/50 transition-colors"
            >
              {flagCode && (
                <span className="relative h-5 w-6 shrink-0 overflow-hidden rounded-sm">
                  <Image
                    src={`https://flagcdn.com/24x18/${flagCode}.png`}
                    alt=""
                    width={24}
                    height={18}
                    className="object-cover h-full w-full"
                    unoptimized
                  />
                </span>
              )}
              <div className="flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-lg bg-muted text-[10px]">
                <span className="font-bold leading-none">
                  {format(startDate, "dd")}
                </span>
                <span className="text-muted-foreground uppercase">
                  {format(startDate, "MMM")}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {meeting.meeting_name}
                </p>
                <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                  <MapPin className="h-2.5 w-2.5" />
                  {meeting.circuit_short_name}
                </p>
              </div>
              <span className="text-[10px] text-muted-foreground font-medium inline-flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" />
                Done
              </span>
            </div>
          );
        })}
        <Link
          href="/calendar"
          className="block text-xs text-center text-muted-foreground hover:text-foreground pt-2"
        >
          Full calendar →
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {upcoming.map((meeting) => {
        const startDate = parseApiDate(meeting.date_start) ?? new Date(0);
        const isActive = isPast(startDate) && !isPast(parseApiDate(meeting.date_end) ?? new Date(0));
        const flagCode = (getCircuitTheme(meeting.circuit_short_name).countryCode || getCountryFlagCode(meeting.country_code)).toLowerCase();

        return (
          <div
            key={meeting.meeting_key}
            className={`flex items-center gap-3 py-2 px-1 rounded-md ${
              isActive ? "bg-red-500/5" : "hover:bg-muted/50"
            } transition-colors`}
          >
            {flagCode && (
              <span className="relative h-5 w-6 shrink-0 overflow-hidden rounded-sm">
                <Image
                  src={`https://flagcdn.com/24x18/${flagCode}.png`}
                  alt=""
                  width={24}
                  height={18}
                  className="object-cover h-full w-full"
                  unoptimized
                />
              </span>
            )}
            <div className="flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-lg bg-muted text-[10px]">
              <span className="font-bold leading-none">
                {format(startDate, "dd")}
              </span>
              <span className="text-muted-foreground uppercase">
                {format(startDate, "MMM")}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {meeting.meeting_name}
              </p>
              <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                <MapPin className="h-2.5 w-2.5" />
                {meeting.circuit_short_name}
              </p>
            </div>
            {isActive && (
              <span className="text-[10px] text-red-500 font-medium">
                LIVE
              </span>
            )}
          </div>
        );
      })}
      <Link
        href="/calendar"
        className="block text-xs text-center text-muted-foreground hover:text-foreground pt-2"
      >
        Full calendar →
      </Link>
    </div>
  );
}
