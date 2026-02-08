"use client";

import { useTheme } from "next-themes";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!;

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

  const style =
    resolvedTheme === "dark" ? "mapbox/dark-v11" : "mapbox/light-v11";

  const markerColor = "ef4444"; // red-500
  const zoom = 3;
  const width = 400;
  const height = 180;

  const url = `https://api.mapbox.com/styles/v1/${style}/static/pin-s+${markerColor}(${longitude},${latitude})/${longitude},${latitude},${zoom},0,0/${width}x${height}@2x?access_token=${MAPBOX_TOKEN}`;

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
