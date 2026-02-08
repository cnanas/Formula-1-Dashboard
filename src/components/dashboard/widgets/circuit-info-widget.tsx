"use client";

import { format } from "date-fns";
import {
  Cloud,
  CloudRain,
  Sun,
  CloudSun,
  Wind,
  Thermometer,
  MapPin,
  Calendar,
} from "lucide-react";
import { useOpenF1 } from "@/hooks/use-openf1";
import { useSessionStatus } from "@/hooks/use-session-status";
import { useSeason } from "@/providers/season-provider";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { TrackOutline } from "@/components/shared/track-outline";
import { ScheduleMiniMap } from "@/components/calendar/schedule-mini-map";
import { getCircuitCoordinates } from "@/lib/constants/circuit-coordinates";

function WeatherIcon({ condition }: { condition?: string }) {
  const iconClass = "h-6 w-6";
  
  if (!condition) return <Sun className={iconClass} />;
  
  const lower = condition.toLowerCase();
  if (lower.includes("rain") || lower.includes("wet")) {
    return <CloudRain className={`${iconClass} text-blue-500`} />;
  }
  if (lower.includes("cloud") || lower.includes("overcast")) {
    return <Cloud className={`${iconClass} text-gray-500`} />;
  }
  if (lower.includes("partly")) {
    return <CloudSun className={`${iconClass} text-yellow-500`} />;
  }
  return <Sun className={`${iconClass} text-yellow-500`} />;
}

export function CircuitInfoWidget() {
  const { season } = useSeason();
  const { latestSession } = useSessionStatus();

  // Get meetings for selected season
  const { data: meetings, isLoading: meetingsLoading } = useOpenF1("meetings", {
    year: season,
  });

  // Find the next upcoming meeting or the most recent one
  const now = new Date();
  const upcomingMeeting = meetings.find((m) => new Date(m.date_start) > now);
  const pastMeetings = meetings
    .filter((m) => new Date(m.date_end) < now)
    .sort((a, b) => new Date(b.date_end).getTime() - new Date(a.date_end).getTime());
  
  const currentMeeting = upcomingMeeting ?? pastMeetings[0];

  // Get weather for the session if available
  const { data: weatherData } = useOpenF1(
    "weather",
    { session_key: latestSession?.session_key?.toString() ?? "" },
    { enabled: !!latestSession }
  );

  const latestWeather = weatherData.length > 0 
    ? weatherData[weatherData.length - 1] 
    : null;

  if (meetingsLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full rounded-xl" />
        <div className="grid grid-cols-3 gap-4">
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
        </div>
      </div>
    );
  }

  if (!currentMeeting) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        No circuit data available
      </div>
    );
  }

  const isUpcoming = upcomingMeeting !== undefined;
  const meetingStart = new Date(currentMeeting.date_start);
  const meetingEnd = new Date(currentMeeting.date_end);

  return (
    <div className="space-y-5">
      {/* Circuit Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          {currentMeeting.circuit_image && (
            <img
              src={currentMeeting.circuit_image}
              alt={currentMeeting.circuit_short_name}
              className="h-12 w-16 object-contain rounded-lg bg-muted shrink-0"
            />
          )}
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1 flex-wrap">
              {currentMeeting.country_flag && (
                <img
                  src={currentMeeting.country_flag}
                  alt=""
                  className="h-4 w-5 object-contain rounded shrink-0"
                />
              )}
              <span className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4 shrink-0" />
                {currentMeeting.location}, {currentMeeting.country_name}
              </span>
            </div>
            <h4 className="text-lg font-bold">{currentMeeting.circuit_short_name}</h4>
            {currentMeeting.circuit_type && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {currentMeeting.circuit_type}
              </p>
            )}
          </div>
        </div>
        <Badge 
          variant={isUpcoming ? "default" : "secondary"}
          className="rounded-full px-3 shrink-0"
        >
          {isUpcoming ? "Upcoming" : "Completed"}
        </Badge>
      </div>

      {/* Date */}
      <div className="flex items-center gap-2 text-sm">
        <Calendar className="h-4 w-4 text-muted-foreground" />
        <span className="font-medium">
          {format(meetingStart, "EEEE, d MMMM yyyy")}
        </span>
      </div>

      {/* Mini Map + Track Visualization */}
      {(() => {
        const coords = getCircuitCoordinates(currentMeeting.circuit_short_name);
        return coords ? (
          <div className="relative rounded-xl overflow-hidden min-h-[140px]">
            <ScheduleMiniMap
              longitude={coords[0]}
              latitude={coords[1]}
              className="w-full h-[140px] object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
            <div className="absolute bottom-0 inset-x-0 p-4 flex items-end justify-between">
              <div>
                <p className="text-lg font-bold">{currentMeeting.meeting_name}</p>
                <p className="text-xs text-muted-foreground">
                  Round {meetings.indexOf(currentMeeting) + 1} of {meetings.length}
                </p>
              </div>
              <div className="w-16 h-16 text-foreground/30">
                <TrackOutline
                  circuitShortName={currentMeeting.circuit_short_name}
                  strokeWidth={3}
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="relative bg-gradient-to-br from-muted/50 to-muted rounded-xl p-6 min-h-[140px] flex items-center justify-center">
            <div className="absolute right-4 top-1/2 -translate-y-1/2 w-28 h-28 text-foreground/15">
              <TrackOutline
                circuitShortName={currentMeeting.circuit_short_name}
                strokeWidth={3}
              />
            </div>
            <div className="relative text-center">
              <p className="text-2xl font-bold">{currentMeeting.meeting_name}</p>
              <p className="text-sm text-muted-foreground mt-1">
                Round {meetings.indexOf(currentMeeting) + 1} of {meetings.length}
              </p>
            </div>
          </div>
        );
      })()}

      {/* Weather & Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Weather */}
        <div className="bg-muted/30 rounded-xl p-3 text-center">
          <div className="flex justify-center mb-1">
            {latestWeather ? (
              <Thermometer className="h-5 w-5 text-orange-500" />
            ) : (
              <WeatherIcon />
            )}
          </div>
          <p className="text-xs text-muted-foreground">Temperature</p>
          <p className="text-lg font-bold">
            {latestWeather ? `${Math.round(latestWeather.air_temperature)}°C` : "--"}
          </p>
        </div>

        {/* Track Temp */}
        <div className="bg-muted/30 rounded-xl p-3 text-center">
          <div className="flex justify-center mb-1">
            <Thermometer className="h-5 w-5 text-red-500" />
          </div>
          <p className="text-xs text-muted-foreground">Track Temp</p>
          <p className="text-lg font-bold">
            {latestWeather ? `${Math.round(latestWeather.track_temperature)}°C` : "--"}
          </p>
        </div>

        {/* Wind */}
        <div className="bg-muted/30 rounded-xl p-3 text-center">
          <div className="flex justify-center mb-1">
            <Wind className="h-5 w-5 text-blue-500" />
          </div>
          <p className="text-xs text-muted-foreground">Wind</p>
          <p className="text-lg font-bold">
            {latestWeather ? `${Math.round(latestWeather.wind_speed)} km/h` : "--"}
          </p>
        </div>

        {/* Humidity */}
        <div className="bg-muted/30 rounded-xl p-3 text-center">
          <div className="flex justify-center mb-1">
            <Cloud className="h-5 w-5 text-cyan-500" />
          </div>
          <p className="text-xs text-muted-foreground">Humidity</p>
          <p className="text-lg font-bold">
            {latestWeather ? `${Math.round(latestWeather.humidity)}%` : "--"}
          </p>
        </div>
      </div>
    </div>
  );
}
