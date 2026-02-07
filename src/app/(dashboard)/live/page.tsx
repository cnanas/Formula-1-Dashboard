"use client";

import { useState, useEffect } from "react";
import { Radio } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useOpenF1 } from "@/hooks/use-openf1";
import { useSessionStatus } from "@/hooks/use-session-status";
import { TimingTower } from "@/components/live/timing-tower";
import { TelemetryPanel } from "@/components/live/telemetry-panel";
import { RaceControlFeed } from "@/components/live/race-control-feed";
import { WeatherWidget } from "@/components/live/weather-widget";
import { TeamRadioPlayer } from "@/components/live/team-radio-player";
import { EmptyState } from "@/components/shared/empty-state";
import { PageSkeleton } from "@/components/shared/loading-skeleton";
import { usePageTitle } from "@/providers/page-title-provider";

export default function LivePage() {
  const { latestSession, isLive, isLoading: sessionLoading } = useSessionStatus();
  const [selectedDriver, setSelectedDriver] = useState<string>("");
  const { setPageTitle, clearPageTitle } = usePageTitle();

  // Set dynamic page title with session info
  useEffect(() => {
    if (latestSession && isLive) {
      setPageTitle(
        "Live Session",
        `${latestSession.circuit_short_name} - ${latestSession.session_name}`
      );
    } else if (latestSession) {
      setPageTitle("Live Session", "No active session");
    }
    return () => clearPageTitle();
  }, [latestSession, isLive, setPageTitle, clearPageTitle]);

  // Fetch drivers for the session
  const { data: drivers } = useOpenF1(
    "drivers",
    { session_key: "latest" },
    { enabled: !!latestSession }
  );

  // Polling live data - only active when session is live
  const { data: positions } = useOpenF1(
    "position",
    { session_key: "latest" },
    { enabled: isLive, refreshInterval: 4000 }
  );

  const { data: intervals } = useOpenF1(
    "intervals",
    { session_key: "latest" },
    { enabled: isLive, refreshInterval: 4000 }
  );

  const { data: stints } = useOpenF1(
    "stints",
    { session_key: "latest" },
    { enabled: isLive, refreshInterval: 10000 }
  );

  const { data: raceControl } = useOpenF1(
    "race_control",
    { session_key: "latest" },
    { enabled: isLive, refreshInterval: 5000 }
  );

  const { data: weatherData } = useOpenF1(
    "weather",
    { session_key: "latest" },
    { enabled: isLive, refreshInterval: 60000 }
  );

  const { data: teamRadio } = useOpenF1(
    "team_radio",
    { session_key: "latest" },
    { enabled: isLive, refreshInterval: 10000 }
  );

  // Telemetry for selected driver
  const driverNumber = selectedDriver || drivers[0]?.driver_number?.toString();
  const { data: carData } = useOpenF1(
    "car_data",
    {
      session_key: "latest",
      driver_number: driverNumber,
    },
    { enabled: isLive && !!driverNumber, refreshInterval: 1000 }
  );

  const latestCarData = carData.length > 0 ? carData[carData.length - 1] : null;
  const latestWeather = weatherData.length > 0 ? weatherData[weatherData.length - 1] : null;
  const selectedDriverInfo = drivers.find(
    (d) => d.driver_number === Number(driverNumber)
  );

  if (sessionLoading) return <PageSkeleton />;

  if (!isLive) {
    return (
      <div className="space-y-6">
        <EmptyState
          icon={Radio}
          title="No active session"
          description="Live data will appear here when an F1 session is in progress. Check the calendar for upcoming sessions."
        />
        {latestSession && (
          <p className="text-sm text-muted-foreground text-center">
            Last session: {latestSession.session_name} - {latestSession.circuit_short_name}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Driver selector for telemetry */}
      <div className="flex justify-end">
        <Select
          value={driverNumber}
          onValueChange={setSelectedDriver}
        >
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Select driver" />
          </SelectTrigger>
          <SelectContent>
            {drivers.map((d) => (
              <SelectItem
                key={d.driver_number}
                value={d.driver_number.toString()}
              >
                {d.name_acronym} - {d.team_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Main layout: timing tower + panels */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Timing tower - takes 1/3 */}
        <div className="lg:col-span-1">
          <TimingTower
            positions={positions}
            intervals={intervals}
            drivers={drivers}
            stints={stints}
          />
        </div>

        {/* Right panels - takes 2/3 */}
        <div className="lg:col-span-2 space-y-4">
          {/* Telemetry + Weather row */}
          <div className="grid gap-4 md:grid-cols-2">
            <TelemetryPanel
              carData={latestCarData}
              driverName={
                selectedDriverInfo?.name_acronym ?? `#${driverNumber}`
              }
            />
            <WeatherWidget weather={latestWeather} />
          </div>

          {/* Race control + Team radio row */}
          <div className="grid gap-4 md:grid-cols-2">
            <RaceControlFeed messages={raceControl} />
            <TeamRadioPlayer radios={teamRadio} drivers={drivers} />
          </div>
        </div>
      </div>
    </div>
  );
}
