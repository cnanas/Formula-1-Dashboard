"use client";

import { Timer } from "lucide-react";
import { useOpenF1 } from "@/hooks/use-openf1";
import { useSeason } from "@/providers/season-provider";
import { Skeleton } from "@/components/ui/skeleton";

export function FastestPitstopWidget() {
  const { season } = useSeason();

  const { data: sessions, isLoading: sessionsLoading } = useOpenF1("sessions", {
    year: season,
    session_type: "Race",
  });

  // Get all race session keys
  const raceSessionKeys = sessions.map((s) => s.session_key);
  const latestRaceKey = raceSessionKeys[raceSessionKeys.length - 1];

  // Fetch pit data for all race sessions (we use the latest to get recent data)
  const { data: pitData, isLoading: pitLoading } = useOpenF1(
    "pit",
    { session_key: latestRaceKey },
    { enabled: !!latestRaceKey }
  );

  // Fetch drivers for name mapping
  const { data: drivers } = useOpenF1(
    "drivers",
    { session_key: latestRaceKey },
    { enabled: !!latestRaceKey }
  );

  // Fetch meetings for round info
  const { data: meetings } = useOpenF1("meetings", {
    year: season,
  });

  const isLoading = sessionsLoading || pitLoading;

  // Find the fastest pit stop
  const validPits = pitData.filter(
    (p) => p.stop_duration !== null && p.stop_duration > 0 && p.stop_duration < 60
  );
  const fastestPit = validPits.length > 0
    ? validPits.reduce((fastest, p) =>
        (p.stop_duration ?? Infinity) < (fastest.stop_duration ?? Infinity) ? p : fastest
      )
    : null;

  // Get driver info
  const driver = fastestPit
    ? drivers.find((d) => d.driver_number === fastestPit.driver_number)
    : null;

  // Get meeting/round info
  const latestSession = sessions.find((s) => s.session_key === latestRaceKey);
  const meeting = latestSession
    ? meetings.find((m) => m.meeting_key === latestSession.meeting_key)
    : null;
  const roundNumber = meeting
    ? meetings.indexOf(meeting) + 1
    : null;

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-4 w-40" />
      </div>
    );
  }

  return (
    <div className="flex flex-col justify-between h-full">
      <div className="flex items-start justify-between">
        <p className="text-sm text-muted-foreground font-medium">
          {season} Fastest Pit Stop
        </p>
        <Timer className="h-5 w-5 text-muted-foreground/50" />
      </div>

      <div>
        <p className="text-4xl font-bold tracking-tight">
          {fastestPit
            ? `${fastestPit.stop_duration?.toFixed(2)} s`
            : "-- s"}
        </p>
      </div>

      {driver && meeting && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span
            className="inline-block w-3 h-3 rounded-full"
            style={{
              backgroundColor: driver.team_colour
                ? `#${driver.team_colour}`
                : "#666",
            }}
          />
          <span>
            {driver.last_name}
            {roundNumber && ` - Round ${roundNumber}`}
            {meeting && (
              <>
                {" "}
                <span className="inline-flex items-center gap-1">
                  <img
                    src={`https://flagcdn.com/16x12/${meeting.country_code.toLowerCase()}.png`}
                    alt={meeting.country_name}
                    className="inline h-3"
                  />
                  {meeting.country_name}
                </span>
              </>
            )}
          </span>
        </div>
      )}

      {!fastestPit && (
        <p className="text-xs text-muted-foreground">No pit stop data available yet</p>
      )}
    </div>
  );
}
