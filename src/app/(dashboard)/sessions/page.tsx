"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useOpenF1 } from "@/hooks/use-openf1";
import { usePageTitle } from "@/providers/page-title-provider";
import { useSeason } from "@/providers/season-provider";
import { PageSkeleton } from "@/components/shared/loading-skeleton";
import { SessionStats } from "@/components/sessions/session-stats";

export default function SessionsPage() {
  const { setPageTitle, clearPageTitle } = usePageTitle();
  const { season: globalSeason, availableSeasons } = useSeason();
  const [year, setYear] = useState(globalSeason);
  const [selectedMeeting, setSelectedMeeting] = useState("");
  const [activeSession, setActiveSession] = useState("");

  const { data: meetings, isLoading: meetingsLoading } = useOpenF1("meetings", { year });

  const autoMeeting = useMemo(() => {
    if (selectedMeeting || meetings.length === 0) return "";
    const now = new Date().getTime();
    const sorted = [...meetings].sort(
      (a, b) => new Date(b.date_start).getTime() - new Date(a.date_start).getTime()
    );
    const current = sorted.find((m) => {
      const start = new Date(m.date_start).getTime();
      const end = new Date(m.date_end).getTime();
      return start <= now && end >= now;
    });
    const latestStarted = sorted.find((m) => new Date(m.date_start).getTime() <= now);
    return (current ?? latestStarted ?? sorted[0])?.meeting_key?.toString() ?? "";
  }, [meetings, selectedMeeting]);

  const effectiveMeeting = selectedMeeting || autoMeeting;

  const { data: sessions, isLoading: sessionsLoading } = useOpenF1(
    "sessions",
    { meeting_key: effectiveMeeting || undefined },
    { enabled: !!effectiveMeeting }
  );

  const sortedSessions = useMemo(
    () =>
      [...sessions].sort(
        (a, b) => new Date(a.date_start).getTime() - new Date(b.date_start).getTime()
      ),
    [sessions]
  );

  const autoSession = useMemo(() => {
    if (activeSession || sortedSessions.length === 0) return "";
    const now = new Date().getTime();
    const completed = [...sortedSessions].filter((s) => {
      const end = s.date_end ? new Date(s.date_end).getTime() : NaN;
      return Number.isFinite(end) && end <= now;
    });
    const started = [...sortedSessions].filter((s) => new Date(s.date_start).getTime() <= now);
    const preferred = completed.at(-1) ?? started.at(-1) ?? sortedSessions.at(-1);
    return preferred?.session_key?.toString() ?? "";
  }, [sortedSessions, activeSession]);

  const effectiveActiveSession = activeSession || autoSession;

  // Reset session when meeting changes
  const handleMeetingChange = (meetingKey: string) => {
    setSelectedMeeting(meetingKey);
    setActiveSession("");
  };

  const handleYearChange = (newYear: string) => {
    setYear(Number(newYear));
    setSelectedMeeting("");
    setActiveSession("");
  };

  // Set dynamic page title
  const selectedMeetingData = meetings.find(
    (m) => m.meeting_key.toString() === effectiveMeeting
  );

  useEffect(() => {
    if (selectedMeetingData) {
      setPageTitle("Sessions", selectedMeetingData.meeting_name);
    } else {
      setPageTitle("Sessions");
    }
    return () => clearPageTitle();
  }, [selectedMeetingData, setPageTitle, clearPageTitle]);

  return (
    <div className="space-y-4">
      {/* Selectors */}
      <div className="flex flex-wrap gap-2">
        <Select value={year.toString()} onValueChange={handleYearChange}>
          <SelectTrigger className="w-24">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {availableSeasons.map((y) => (
              <SelectItem key={y} value={y.toString()}>
                {y}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={effectiveMeeting} onValueChange={handleMeetingChange}>
          <SelectTrigger className="w-64">
            <SelectValue
              placeholder={meetingsLoading ? "Loading..." : "Select race weekend"}
            />
          </SelectTrigger>
          <SelectContent>
            {meetings.length === 0 ? (
              <SelectItem value="none" disabled>
                No events found for {year}
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
      </div>

      {/* Session tabs */}
      {!effectiveMeeting && (
        <p className="text-sm text-muted-foreground py-8 text-center">
          Select a race weekend to view session stats.
        </p>
      )}

      {effectiveMeeting && sessionsLoading && <PageSkeleton />}

      {effectiveMeeting && !sessionsLoading && sortedSessions.length === 0 && (
        <p className="text-sm text-muted-foreground py-8 text-center">
          No sessions found for this event.
        </p>
      )}

      {effectiveMeeting && sortedSessions.length > 0 && effectiveActiveSession && (
        <Tabs value={effectiveActiveSession} onValueChange={setActiveSession} className="w-full">
          <TabsList className="w-full justify-start flex-wrap h-auto gap-1 p-1">
            {sortedSessions.map((s) => (
              <TabsTrigger
                key={s.session_key}
                value={s.session_key.toString()}
                className="text-xs px-3 py-1.5"
              >
                {s.session_name}
              </TabsTrigger>
            ))}
          </TabsList>

          {sortedSessions.map((s) => (
            <TabsContent
              key={s.session_key}
              value={s.session_key.toString()}
              className="mt-4"
            >
              <SessionStats sessionKey={s.session_key.toString()} />
            </TabsContent>
          ))}
        </Tabs>
      )}
    </div>
  );
}
