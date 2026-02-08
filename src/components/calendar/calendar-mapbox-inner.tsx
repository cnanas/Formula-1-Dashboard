"use client";

import { useRef, useEffect, useMemo, useState } from "react";
import Map, { Marker, NavigationControl, AttributionControl } from "react-map-gl/mapbox";
import { useTheme } from "next-themes";
import { isPast } from "date-fns";
import { getCircuitCoordinates } from "@/lib/constants/circuit-coordinates";
import type { Meeting } from "@/types/openf1";
import type { MapRef } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";

const MAP_STYLES = {
  dark: "mapbox://styles/mapbox/dark-v11",
  light: "mapbox://styles/mapbox/light-v11",
};

const CIRCUIT_ZOOM = 13;

interface CalendarMapboxInnerProps {
  meetings: Meeting[];
  selectedMeetingKey: number | null;
  onSelectMeeting: (meetingKey: number) => void;
}

export function CalendarMapboxInner({
  meetings,
  selectedMeetingKey,
  onSelectMeeting,
}: CalendarMapboxInnerProps) {
  const mapRef = useRef<MapRef>(null);
  const { resolvedTheme } = useTheme();
  const [mapboxToken, setMapboxToken] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/mapbox/token")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("No token"))))
      .then((data: { token: string }) => setMapboxToken(data.token))
      .catch(() => setMapboxToken(""));
  }, []);

  const mapStyle =
    resolvedTheme === "dark" ? MAP_STYLES.dark : MAP_STYLES.light;

  const meetingsWithCoords = useMemo(
    () =>
      meetings
        .map((m) => {
          const coords = getCircuitCoordinates(m.circuit_short_name);
          if (!coords) return null;
          return { meeting: m, longitude: coords[0], latitude: coords[1] };
        })
        .filter(
          (x): x is { meeting: Meeting; longitude: number; latitude: number } =>
            x !== null
        ),
    [meetings]
  );

  // Fly to selected meeting
  useEffect(() => {
    if (!selectedMeetingKey || !mapRef.current) return;
    const target = meetingsWithCoords.find(
      (m) => m.meeting.meeting_key === selectedMeetingKey
    );
    if (!target) return;
    mapRef.current.flyTo({
      center: [target.longitude, target.latitude],
      zoom: CIRCUIT_ZOOM,
      duration: 2000,
      essential: true,
    });
  }, [selectedMeetingKey, meetingsWithCoords]);

  if (mapboxToken === null) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-muted/30 rounded-lg">
        <p className="text-sm text-muted-foreground">Loading map…</p>
      </div>
    );
  }
  if (!mapboxToken) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-muted/30 rounded-lg">
        <p className="text-sm text-muted-foreground">Map unavailable (no token)</p>
      </div>
    );
  }

  return (
    <Map
      ref={mapRef}
      mapboxAccessToken={mapboxToken}
      initialViewState={{
        longitude: 20,
        latitude: 30,
        zoom: 1.5,
      }}
      mapStyle={mapStyle}
      style={{ width: "100%", height: "100%" }}
      attributionControl={false}
    >
      <NavigationControl position="top-left" showCompass={false} />
      <AttributionControl compact position="bottom-right" />

      {meetingsWithCoords.map((item) => {
        const isSelected = item.meeting.meeting_key === selectedMeetingKey;
        const endDate = new Date(item.meeting.date_end);
        const completed = isPast(endDate);

        return (
          <Marker
            key={item.meeting.meeting_key}
            longitude={item.longitude}
            latitude={item.latitude}
            anchor="center"
            onClick={(e) => {
              e.originalEvent.stopPropagation();
              onSelectMeeting(item.meeting.meeting_key);
            }}
          >
            <div
              className={`rounded-full border-2 border-white shadow-lg cursor-pointer transition-all duration-300 ${
                isSelected
                  ? "w-5 h-5 bg-red-600 scale-110"
                  : completed
                    ? "w-3 h-3 bg-muted-foreground/60"
                    : "w-3 h-3 bg-red-500 hover:scale-125"
              }`}
            />
          </Marker>
        );
      })}
    </Map>
  );
}
