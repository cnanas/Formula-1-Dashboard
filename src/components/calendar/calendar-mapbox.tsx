"use client";

import dynamic from "next/dynamic";
import type { Meeting } from "@/types/openf1";

interface CalendarMapboxProps {
  meetings: Meeting[];
  selectedMeetingKey: number | null;
  onSelectMeeting: (meetingKey: number) => void;
}

const MapboxInner = dynamic(
  () =>
    import("./calendar-mapbox-inner").then((mod) => mod.CalendarMapboxInner),
  {
    ssr: false,
    loading: () => (
      <div className="h-full w-full bg-muted animate-pulse rounded-lg" />
    ),
  }
);

export function CalendarMapbox(props: CalendarMapboxProps) {
  return <MapboxInner {...props} />;
}
