"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { ChevronRight, History } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useOpenF1 } from "@/hooks/use-openf1";
import { PageSkeleton } from "@/components/shared/loading-skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { usePageTitle } from "@/providers/page-title-provider";

export default function HistoryPage() {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear.toString());
  const [selectedMeeting, setSelectedMeeting] = useState<string>("");
  const { setPageTitle, clearPageTitle } = usePageTitle();

  const { data: meetings, isLoading: meetingsLoading } = useOpenF1("meetings", {
    year: Number(year),
  });

  const { data: sessions, isLoading: sessionsLoading } = useOpenF1(
    "sessions",
    { meeting_key: selectedMeeting },
    { enabled: !!selectedMeeting }
  );

  // Set dynamic page title when a meeting is selected
  useEffect(() => {
    if (selectedMeeting) {
      const meeting = meetings.find(
        (m) => m.meeting_key.toString() === selectedMeeting
      );
      if (meeting) {
        setPageTitle(meeting.meeting_name, `${year} Season`);
      }
    } else {
      setPageTitle("History", `${year} Season`);
    }
    return () => clearPageTitle();
  }, [selectedMeeting, meetings, year, setPageTitle, clearPageTitle]);

  if (meetingsLoading) return <PageSkeleton />;

  return (
    <div className="space-y-6">
      {/* Year selector */}
      <div className="flex gap-3">
        <Select value={year} onValueChange={(v) => { setYear(v); setSelectedMeeting(""); }}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {[currentYear, currentYear - 1, currentYear - 2, currentYear - 3].map((y) => (
              <SelectItem key={y} value={y.toString()}>
                {y}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {meetings.length === 0 ? (
        <EmptyState
          icon={History}
          title="No data available"
          description={`No race data found for ${year}.`}
        />
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {meetings.map((meeting) => (
            <Card
              key={meeting.meeting_key}
              className={`cursor-pointer transition-colors hover:bg-accent ${
                selectedMeeting === meeting.meeting_key.toString()
                  ? "ring-2 ring-primary"
                  : ""
              }`}
              onClick={() =>
                setSelectedMeeting(meeting.meeting_key.toString())
              }
            >
              <CardContent className="pt-6">
                <h3 className="font-semibold">{meeting.meeting_name}</h3>
                <p className="text-sm text-muted-foreground">
                  {meeting.circuit_short_name} - {meeting.country_name}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {format(new Date(meeting.date_start), "MMM d")} -{" "}
                  {format(new Date(meeting.date_end), "MMM d, yyyy")}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Sessions list */}
      {selectedMeeting && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            {sessionsLoading ? (
              <p className="text-sm text-muted-foreground">Loading sessions...</p>
            ) : sessions.length === 0 ? (
              <p className="text-sm text-muted-foreground">No sessions found.</p>
            ) : (
              <div className="space-y-2">
                {sessions.map((session) => (
                  <Link
                    key={session.session_key}
                    href={`/race/${selectedMeeting}/${session.session_key}`}
                  >
                    <div className="flex items-center justify-between rounded-lg border border-border p-3 hover:bg-accent transition-colors">
                      <div>
                        <p className="font-medium text-sm">
                          {session.session_name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(
                            new Date(session.date_start),
                            "MMM d, yyyy HH:mm"
                          )}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {session.session_type}
                        </Badge>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
