"use client";

import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useOpenF1 } from "@/hooks/use-openf1";
import type { Meeting, Session } from "@/types/openf1";

// Available years for the session picker
// Use fixed max year to avoid hydration issues
const MIN_YEAR = 2023;
const MAX_YEAR = 2026;
const AVAILABLE_YEARS = Array.from(
  { length: MAX_YEAR - MIN_YEAR + 1 },
  (_, i) => MAX_YEAR - i
);

interface SessionPickerProps {
  selectedMeeting: string;
  selectedSession: string;
  onMeetingChange: (meetingKey: string) => void;
  onSessionChange: (sessionKey: string) => void;
}

// Default to 2025 since 2026 season may not have data yet
const DEFAULT_YEAR = 2025;

export function SessionPicker({
  selectedMeeting,
  selectedSession,
  onMeetingChange,
  onSessionChange,
}: SessionPickerProps) {
  const [year, setYear] = useState(DEFAULT_YEAR);
  
  const { data: meetings, isLoading: meetingsLoading } = useOpenF1("meetings", { year });
  const { data: sessions } = useOpenF1(
    "sessions",
    { meeting_key: selectedMeeting || undefined },
    { enabled: !!selectedMeeting }
  );

  const handleYearChange = (newYear: string) => {
    setYear(Number(newYear));
    // Reset meeting and session when year changes
    onMeetingChange("");
    onSessionChange("");
  };

  return (
    <div className="flex flex-wrap gap-2">
      {/* Year selector */}
      <Select value={year.toString()} onValueChange={handleYearChange}>
        <SelectTrigger className="w-24">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {AVAILABLE_YEARS.map((y) => (
            <SelectItem key={y} value={y.toString()}>
              {y}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Meeting selector */}
      <Select value={selectedMeeting} onValueChange={onMeetingChange}>
        <SelectTrigger className="w-64">
          <SelectValue placeholder={meetingsLoading ? "Loading..." : "Select race weekend"} />
        </SelectTrigger>
        <SelectContent>
          {meetings.length === 0 ? (
            <SelectItem value="none" disabled>
              No races found for {year}
            </SelectItem>
          ) : (
            meetings.map((m) => (
              <SelectItem key={m.meeting_key} value={m.meeting_key.toString()}>
                {m.meeting_name}
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>

      {/* Session selector */}
      <Select
        value={selectedSession}
        onValueChange={onSessionChange}
        disabled={!selectedMeeting}
      >
        <SelectTrigger className="w-48">
          <SelectValue placeholder="Select session" />
        </SelectTrigger>
        <SelectContent>
          {sessions.map((s) => (
            <SelectItem key={s.session_key} value={s.session_key.toString()}>
              {s.session_name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
