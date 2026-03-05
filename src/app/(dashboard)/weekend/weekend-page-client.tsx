"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo } from "react";
import useSWR from "swr";
import { format, formatDistanceToNow } from "date-fns";
import { parseApiDate } from "@/lib/utils/formatting";
import {
  BookOpenText,
  CalendarDays,
  Clock3,
  Newspaper,
  PlayCircle,
  Radio,
  RefreshCw,
  Tv,
  Youtube,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { PageSkeleton } from "@/components/shared/loading-skeleton";
import { DataReliability } from "@/components/shared/data-reliability";
import { GlossaryTooltip } from "@/components/shared/glossary-tooltip";
import { useOpenF1 } from "@/hooks/use-openf1";
import { useCountdown } from "@/hooks/use-countdown";
import { useSeason } from "@/providers/season-provider";
import { usePageTitle } from "@/providers/page-title-provider";
import { F1_APPLE_TV_US_URL } from "@/lib/constants/watch";
import type { Session } from "@/types/openf1";
import type { RSSFeed } from "@/types/rss";
import type { YoutubeFeed } from "@/types/youtube";

interface ApiError {
  error: string;
}

function toErrorMessage(error: unknown): string | null {
  if (!error) return null;
  if (error instanceof Error) return error.message;
  return "Could not load data";
}

function toDate(value: string | null): Date | null {
  return parseApiDate(value);
}

function formatDateValue(
  value: string | null | undefined,
  pattern: string,
  fallback: string
): string {
  const date = toDate(value ?? null);
  if (!date) return fallback;
  return format(date, pattern);
}

function formatLocalDateTime(value: string | null | undefined): string {
  const date = toDate(value ?? null);
  if (!date) return "Time TBD";
  return date.toLocaleString([], {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  });
}

function getSessionStatus(session: Session): "done" | "live" | "upcoming" {
  const now = new Date();
  const start = toDate(session.date_start);
  const end = toDate(session.date_end);
  if (!start) return "upcoming";
  if (start <= now && (!end || end >= now)) return "live";
  if (start > now) return "upcoming";
  return "done";
}

export default function WeekendHubPage() {
  const { season } = useSeason();
  const { setPageTitle, clearPageTitle } = usePageTitle();

  useEffect(() => {
    setPageTitle("Weekend Hub", "One-stop race weekend view");
    return () => clearPageTitle();
  }, [setPageTitle, clearPageTitle]);

  const {
    data: meetings,
    isLoading: meetingsLoading,
    error: meetingsError,
    mutate: mutateMeetings,
  } = useOpenF1("meetings", { year: season });

  const sortedMeetings = useMemo(
    () =>
      [...meetings].sort(
        (a, b) => new Date(a.date_start).getTime() - new Date(b.date_start).getTime()
      ),
    [meetings]
  );

  const now = new Date();
  const activeMeeting = sortedMeetings.find((meeting) => {
    const start = toDate(meeting.date_start);
    const end = toDate(meeting.date_end);
    return !!start && !!end && start <= now && end >= now;
  });
  const nextMeeting = sortedMeetings.find(
    (meeting) => toDate(meeting.date_start) && toDate(meeting.date_start)! > now
  );
  const latestMeeting = [...sortedMeetings]
    .reverse()
    .find((meeting) => toDate(meeting.date_end) && toDate(meeting.date_end)! < now);
  const focusMeeting = activeMeeting ?? nextMeeting ?? latestMeeting ?? null;

  const {
    data: sessions,
    isLoading: sessionsLoading,
    error: sessionsError,
    mutate: mutateSessions,
  } = useOpenF1(
    "sessions",
    { meeting_key: focusMeeting?.meeting_key?.toString() ?? "" },
    { enabled: !!focusMeeting }
  );

  const sortedSessions = useMemo(
    () =>
      [...sessions].sort(
        (a, b) => new Date(a.date_start).getTime() - new Date(b.date_start).getTime()
      ),
    [sessions]
  );

  const nextSession = sortedSessions.find((session) => {
    const start = toDate(session.date_start);
    return !!start && start > now;
  });
  const countdownTarget = nextSession?.date_start ?? focusMeeting?.date_start ?? null;
  const countdown = useCountdown(countdownTarget);

  const {
    data: raceSessions,
    isLoading: raceSessionsLoading,
    error: raceSessionsError,
    mutate: mutateRaceSessions,
  } = useOpenF1("sessions", { year: season, session_type: "Race" });
  const latestRaceSession =
    [...raceSessions]
      .filter((session) => {
        const start = toDate(session.date_start);
        return !!start && start < now;
      })
      .sort(
        (a, b) => new Date(b.date_start).getTime() - new Date(a.date_start).getTime()
      )[0] ?? null;

  const {
    data: latestRaceResults,
    isLoading: raceResultsLoading,
    error: raceResultsError,
    mutate: mutateRaceResults,
  } = useOpenF1(
    "session_result",
    { session_key: latestRaceSession?.session_key?.toString() ?? "" },
    { enabled: !!latestRaceSession }
  );
  const {
    data: latestRaceDrivers,
    isLoading: raceDriversLoading,
    error: raceDriversError,
    mutate: mutateRaceDrivers,
  } = useOpenF1(
    "drivers",
    { session_key: latestRaceSession?.session_key?.toString() ?? "" },
    { enabled: !!latestRaceSession }
  );

  const winnerResult = latestRaceResults.find((result) => result.position === 1);
  const winnerName =
    latestRaceDrivers.find((driver) => driver.driver_number === winnerResult?.driver_number)
      ?.full_name ?? null;

  const {
    data: newsResponse,
    isLoading: newsLoading,
    isValidating: newsValidating,
    mutate: mutateNews,
  } = useSWR<RSSFeed | ApiError>("/api/rss?source=all", {
    refreshInterval: 300_000,
  });
  const newsError = newsResponse && "error" in newsResponse ? newsResponse.error : null;
  const newsFeed = newsResponse && "items" in newsResponse ? newsResponse : null;
  const topNews = (newsFeed?.items ?? []).slice(0, 4);

  const {
    data: youtubeResponse,
    isLoading: youtubeLoading,
    isValidating: youtubeValidating,
    mutate: mutateYoutube,
  } = useSWR<YoutubeFeed | ApiError>("/api/youtube?limit=6", {
    refreshInterval: 600_000,
  });
  const youtubeError =
    youtubeResponse && "error" in youtubeResponse ? youtubeResponse.error : null;
  const youtubeFeed =
    youtubeResponse && "items" in youtubeResponse ? youtubeResponse : null;
  const topVideos = (youtubeFeed?.items ?? []).slice(0, 3);

  const openF1Error =
    toErrorMessage(meetingsError) ??
    toErrorMessage(sessionsError) ??
    toErrorMessage(raceSessionsError) ??
    toErrorMessage(raceResultsError) ??
    toErrorMessage(raceDriversError);
  const openF1Loading =
    meetingsLoading ||
    sessionsLoading ||
    raceSessionsLoading ||
    raceResultsLoading ||
    raceDriversLoading;

  const storylines = useMemo(() => {
    const items: string[] = [];
    if (winnerName && latestRaceSession) {
      items.push(
        `${winnerName} won the latest race in ${latestRaceSession.circuit_short_name}. Watch if that momentum continues.`
      );
    }
    if (nextSession) {
      items.push(
        `Next key moment: ${nextSession.session_name} ${formatDistanceToNow(
          new Date(nextSession.date_start),
          { addSuffix: true }
        )}.`
      );
    }
    if (topNews[0]) {
      items.push(`Top headline right now: ${topNews[0].title}`);
    }
    if (items.length === 0) {
      items.push("No major storyline detected yet. Check back as sessions begin.");
    }
    return items.slice(0, 3);
  }, [winnerName, latestRaceSession, nextSession, topNews]);

  const refreshOpenF1 = () => {
    void mutateMeetings();
    if (focusMeeting) void mutateSessions();
    void mutateRaceSessions();
    if (latestRaceSession) {
      void mutateRaceResults();
      void mutateRaceDrivers();
    }
  };

  if (meetingsLoading && meetings.length === 0) {
    return <PageSkeleton />;
  }

  if (!focusMeeting) {
    return (
      <EmptyState
        icon={CalendarDays}
        title="No weekend data found"
        description={`No race weekend data is available for ${season}.`}
      />
    );
  }

  const weekendState = activeMeeting
    ? "Live Weekend"
    : nextMeeting
    ? "Upcoming Weekend"
    : "Recent Weekend";
  const countdownLabel = nextSession ? `Until ${nextSession.session_name}` : "Weekend Status";

  return (
    <div className="space-y-6">
      <div className="grid gap-2 xl:grid-cols-3">
        <DataReliability
          sourceLabel="OpenF1 timing"
          isLoading={openF1Loading}
          error={openF1Error}
          refreshIntervalMs={30_000}
          onRefresh={refreshOpenF1}
        />
        <DataReliability
          sourceLabel="News feed"
          isLoading={newsLoading}
          isRefreshing={newsValidating}
          error={newsError}
          lastUpdated={newsFeed?.lastFetched}
          refreshIntervalMs={300_000}
          onRefresh={() => {
            void mutateNews();
          }}
        />
        <DataReliability
          sourceLabel="YouTube feed"
          isLoading={youtubeLoading}
          isRefreshing={youtubeValidating}
          error={youtubeError}
          lastUpdated={youtubeFeed?.lastFetched}
          refreshIntervalMs={600_000}
          onRefresh={() => {
            void mutateYoutube();
          }}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2 border-border/60">
          <CardHeader className="pb-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant={activeMeeting ? "destructive" : nextMeeting ? "default" : "secondary"}
                className={activeMeeting ? "animate-pulse" : ""}
              >
                {activeMeeting && <Radio className="h-3.5 w-3.5" />}
                {weekendState}
              </Badge>
              <Badge variant="outline">{focusMeeting.country_name}</Badge>
            </div>
            <CardTitle className="text-xl">{focusMeeting.meeting_name}</CardTitle>
            <CardDescription>
              {focusMeeting.location} • {focusMeeting.circuit_short_name}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {countdownLabel}
              </p>
              {countdownTarget && !countdown.isExpired ? (
                <div className="mt-2 grid grid-cols-4 gap-2 text-center">
                  <div className="rounded-md bg-background p-2">
                    <p className="text-xl font-semibold tabular-nums">{countdown.days}</p>
                    <p className="text-[10px] text-muted-foreground">Days</p>
                  </div>
                  <div className="rounded-md bg-background p-2">
                    <p className="text-xl font-semibold tabular-nums">{countdown.hours}</p>
                    <p className="text-[10px] text-muted-foreground">Hours</p>
                  </div>
                  <div className="rounded-md bg-background p-2">
                    <p className="text-xl font-semibold tabular-nums">{countdown.minutes}</p>
                    <p className="text-[10px] text-muted-foreground">Minutes</p>
                  </div>
                  <div className="rounded-md bg-background p-2">
                    <p className="text-xl font-semibold tabular-nums">{countdown.seconds}</p>
                    <p className="text-[10px] text-muted-foreground">Seconds</p>
                  </div>
                </div>
              ) : (
                <p className="mt-2 text-sm text-muted-foreground">
                  Sessions are in progress or completed for this weekend.
                </p>
              )}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-border/60 p-3">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Weekend Dates
                </p>
                <p className="mt-1 text-sm font-medium">
                  {formatDateValue(focusMeeting.date_start, "MMM d", "TBD")} -{" "}
                  {formatDateValue(focusMeeting.date_end, "MMM d, yyyy", "TBD")}
                </p>
              </div>
              <div className="rounded-lg border border-border/60 p-3">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Next Session
                </p>
                <p className="mt-1 text-sm font-medium">
                  {nextSession
                    ? `${nextSession.session_name} • ${formatLocalDateTime(
                        nextSession.date_start
                      )}`
                    : "No upcoming session in this meeting"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Watch + Learn</CardTitle>
            <CardDescription>Quick links for casual fans</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button asChild className="w-full justify-start">
              <a href={F1_APPLE_TV_US_URL} target="_blank" rel="noopener noreferrer">
                <Tv className="h-4 w-4" />
                Watch on Apple TV (US)
              </a>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start">
              <Link href="/calendar">
                <CalendarDays className="h-4 w-4" />
                Full Race Calendar
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start">
              <Link href="/glossary">
                <BookOpenText className="h-4 w-4" />
                F1 Glossary
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start">
              <Link href="/youtube">
                <Youtube className="h-4 w-4" />
                Video Highlights
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2 border-border/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Weekend Timetable</CardTitle>
            <CardDescription>Session times shown in your local timezone</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {sortedSessions.length === 0 ? (
              <p className="text-sm text-muted-foreground">No sessions available yet.</p>
            ) : (
              sortedSessions.map((session) => {
                const sessionStatus = getSessionStatus(session);
                return (
                  <div
                    key={session.session_key}
                    className="flex items-center justify-between rounded-lg border border-border/60 p-3"
                  >
                    <div>
                      <p className="text-sm font-medium">{session.session_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDateValue(session.date_start, "EEE, MMM d • h:mm a", "Time TBD")}
                      </p>
                    </div>
                    <Badge
                      variant={
                        sessionStatus === "live"
                          ? "destructive"
                          : sessionStatus === "upcoming"
                          ? "default"
                          : "secondary"
                      }
                      className={sessionStatus === "live" ? "animate-pulse" : ""}
                    >
                      {sessionStatus === "live"
                        ? "Live"
                        : sessionStatus === "upcoming"
                        ? "Upcoming"
                        : "Done"}
                    </Badge>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Casual Fan Guide</CardTitle>
            <CardDescription>What to watch for this weekend</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {storylines.map((line) => (
              <div key={line} className="rounded-lg border border-border/60 p-3">
                <p className="text-sm">{line}</p>
              </div>
            ))}
            <div className="rounded-lg border border-border/60 bg-muted/20 p-3 text-sm">
              Strategy clue: if passing is hard, teams may attempt an{" "}
              <GlossaryTooltip termId="undercut" /> to gain{" "}
              <GlossaryTooltip termId="track-position" />.
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card className="border-border/60">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Newspaper className="h-4 w-4" />
              Top Headlines
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {topNews.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                News feed unavailable right now.
              </p>
            ) : (
              topNews.map((item, index) => (
                <a
                  key={`${item.link}-${index}`}
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block rounded-lg border border-border/60 p-3 transition-colors hover:bg-muted/40"
                >
                  <p className="line-clamp-2 text-sm font-medium">{item.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {item.source} • {formatDateValue(item.pubDate, "MMM d", "Date TBD")}
                  </p>
                </a>
              ))
            )}
            <Button asChild variant="ghost" size="sm" className="w-full justify-center">
              <Link href="/news">
                <RefreshCw className="h-3.5 w-3.5" />
                Open Full News Feed
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <PlayCircle className="h-4 w-4" />
              Latest Videos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {topVideos.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                YouTube feed unavailable right now.
              </p>
            ) : (
              topVideos.map((video) => (
                <a
                  key={video.videoId}
                  href={video.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 rounded-lg border border-border/60 p-2 transition-colors hover:bg-muted/40"
                >
                  <div className="relative h-14 w-24 shrink-0 overflow-hidden rounded-md bg-muted">
                    {video.thumbnailUrl ? (
                      <Image
                        src={video.thumbnailUrl}
                        alt={video.title}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Youtube className="h-5 w-5 text-red-500/70" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="line-clamp-2 text-sm font-medium">{video.title}</p>
                    <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock3 className="h-3 w-3" />
                      {formatDateValue(video.publishedAt, "MMM d", "Date TBD")}
                    </p>
                  </div>
                </a>
              ))
            )}
            <Button asChild variant="ghost" size="sm" className="w-full justify-center">
              <Link href="/youtube">
                <Youtube className="h-3.5 w-3.5" />
                Open Video Hub
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
