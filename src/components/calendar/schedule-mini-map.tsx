"use client";

import { useTheme } from "next-themes";

interface ScheduleMiniMapProps {
  longitude: number;
  latitude: number;
  className?: string;
}

export function ScheduleMiniMap({
  longitude,
  latitude,
  className,
}: ScheduleMiniMapProps) {
  const { resolvedTheme } = useTheme();

  const theme = resolvedTheme === "dark" ? "dark" : "light";
  const params = new URLSearchParams({
    lng: String(longitude),
    lat: String(latitude),
    theme,
    width: "400",
    height: "180",
    zoom: "3",
  });
  const url = `/api/mapbox/static?${params.toString()}`;

  return (
    <img
      src={url}
      alt="Circuit location"
      className={className}
      loading="lazy"
      draggable={false}
    />
  );
}
