"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useOpenF1 } from "@/hooks/use-openf1";
import type { Meeting, Session } from "@/types/openf1";

interface SessionPickerProps {
  selectedMeeting: string;
  selectedSession: string;
  onMeetingChange: (meetingKey: string) => void;
  onSessionChange: (sessionKey: string) => void;
}

export function SessionPicker({
  selectedMeeting,
  selectedSession,
  onMeetingChange,
  onSessionChange,
}: SessionPickerProps) {
  const currentYear = new Date().getFullYear();
  const { data: meetings } = useOpenF1("meetings", { year: currentYear });
  const { data: sessions } = useOpenF1(
    "sessions",
    { meeting_key: selectedMeeting || undefined },
    { enabled: !!selectedMeeting }
  );

  return (
    <div className="flex flex-wrap gap-2">
      <Select value={selectedMeeting} onValueChange={onMeetingChange}>
        <SelectTrigger className="w-64">
          <SelectValue placeholder="Select race weekend" />
        </SelectTrigger>
        <SelectContent>
          {meetings.map((m) => (
            <SelectItem key={m.meeting_key} value={m.meeting_key.toString()}>
              {m.meeting_name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

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
