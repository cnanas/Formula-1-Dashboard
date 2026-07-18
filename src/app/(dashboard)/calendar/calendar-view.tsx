"use client";

import { useState, useMemo } from "react";
import { useOpenF1 } from "@/hooks/use-openf1";
import { useSeason } from "@/providers/season-provider";
import { useNavigationMode } from "@/providers/navigation-mode-provider";
import { PageSkeleton } from "@/components/shared/loading-skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { CalendarMapbox } from "@/components/calendar/calendar-mapbox";
import { RaceCarousel } from "@/components/calendar/race-carousel";
import { SeasonBadge } from "@/components/calendar/season-badge";
import { parseApiDate } from "@/lib/utils/formatting";
import type { Meeting, Session } from "@/types/openf1";

interface CalendarViewProps {
  /** Season the server pre-fetched data for */
  defaultYear: number;
  initialMeetings: Meeting[];
  initialSessions: Session[];
}

export function CalendarView({
  defaultYear,
  initialMeetings,
  initialSessions,
}: CalendarViewProps) {
  const { season } = useSeason();
  const { mode } = useNavigationMode();

  // Server-rendered data covers the default season; only fetch client-side
  // when the user switches to a different one.
  const isDefaultSeason = season === defaultYear;

  const { data: fetchedMeetings, isLoading: meetingsFetching } = useOpenF1(
    "meetings",
    { year: season },
    { enabled: !isDefaultSeason }
  );
  const { data: fetchedSessions } = useOpenF1(
    "sessions",
    { year: season },
    { enabled: !isDefaultSeason }
  );

  const meetings = isDefaultSeason ? initialMeetings : fetchedMeetings;
  const sessions = isDefaultSeason ? initialSessions : fetchedSessions;
  const meetingsLoading = !isDefaultSeason && meetingsFetching;

  // Detect which meetings have sprint sessions
  const sprintMeetingKeys = useMemo(() => {
    const keys = new Set<number>();
    sessions.forEach((s) => {
      if (s.session_type?.toLowerCase().includes("sprint")) {
        keys.add(s.meeting_key);
      }
    });
    return keys;
  }, [sessions]);

  // Track selected race — default to next upcoming race
  const [selectedMeetingKey, setSelectedMeetingKey] = useState<number | null>(
    null
  );

  const effectiveSelectedKey = useMemo(() => {
    if (selectedMeetingKey) return selectedMeetingKey;
    if (meetings.length === 0) return null;
    const now = new Date();
    const upcoming = meetings.find((m) => (parseApiDate(m.date_start) ?? new Date(0)) > now);
    return upcoming?.meeting_key ?? meetings[0]?.meeting_key ?? null;
  }, [selectedMeetingKey, meetings]);

  if (meetingsLoading) return <PageSkeleton />;

  if (meetings.length === 0) {
    return (
      <EmptyState
        title="No races found"
        description={`No race data available for ${season}.`}
      />
    );
  }

  return (
    <div
      className={`relative -m-4 md:-m-6 h-[calc(100dvh-4.125rem)] ${
        mode === "bottom" ? "h-[calc(100dvh-4.125rem-6rem)]" : ""
      }`}
    >
      {/* Full-height Mapbox map */}
      <CalendarMapbox
        meetings={meetings}
        selectedMeetingKey={effectiveSelectedKey}
        onSelectMeeting={setSelectedMeetingKey}
      />

      {/* Season badge (top-right) */}
      <SeasonBadge />

      {/* Bottom race carousel */}
      <RaceCarousel
        meetings={meetings}
        selectedMeetingKey={effectiveSelectedKey}
        onSelectMeeting={setSelectedMeetingKey}
        sprintMeetingKeys={sprintMeetingKeys}
      />
    </div>
  );
}
