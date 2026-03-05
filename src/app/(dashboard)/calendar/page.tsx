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

export default function CalendarPage() {
  const { season } = useSeason();
  const { mode } = useNavigationMode();

  const { data: meetings, isLoading: meetingsLoading } = useOpenF1("meetings", {
    year: season,
  });
  const { data: sessions } = useOpenF1("sessions", { year: season });

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
