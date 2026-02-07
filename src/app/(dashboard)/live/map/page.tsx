"use client";

import { useRef, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useOpenF1 } from "@/hooks/use-openf1";
import { useSessionStatus } from "@/hooks/use-session-status";
import { EmptyState } from "@/components/shared/empty-state";
import { getTeamColor } from "@/lib/utils/colors";
import { MapPin, Radio } from "lucide-react";
import type { Location, Driver } from "@/types/openf1";
import { usePageTitle } from "@/providers/page-title-provider";

export default function TrackMapPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { isLive, latestSession } = useSessionStatus();
  const { setPageTitle, clearPageTitle } = usePageTitle();

  // Set dynamic page title with circuit name
  useEffect(() => {
    if (latestSession) {
      setPageTitle(
        "Track Map",
        `${latestSession.circuit_short_name} - ${latestSession.session_name}`
      );
    }
    return () => clearPageTitle();
  }, [latestSession, setPageTitle, clearPageTitle]);

  const { data: drivers } = useOpenF1(
    "drivers",
    { session_key: "latest" },
    { enabled: !!latestSession }
  );

  const { data: locations } = useOpenF1(
    "location",
    { session_key: "latest" },
    { enabled: isLive, refreshInterval: 2000 }
  );

  const driverMap = new Map(drivers.map((d) => [d.driver_number, d]));

  // Get latest position for each driver
  const latestLocations = new Map<number, Location>();
  for (const loc of locations) {
    const existing = latestLocations.get(loc.driver_number);
    if (!existing || new Date(loc.date) > new Date(existing.date)) {
      latestLocations.set(loc.driver_number, loc);
    }
  }

  const drawTrackMap = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;

    // Clear
    ctx.clearRect(0, 0, width, height);

    const points = [...latestLocations.values()];
    if (points.length === 0) return;

    // Find bounds
    const xs = points.map((p) => p.x);
    const ys = points.map((p) => p.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);

    const rangeX = maxX - minX || 1;
    const rangeY = maxY - minY || 1;
    const padding = 40;

    const scaleX = (x: number) =>
      padding + ((x - minX) / rangeX) * (width - 2 * padding);
    const scaleY = (y: number) =>
      padding + ((y - minY) / rangeY) * (height - 2 * padding);

    // Draw cars
    for (const [driverNumber, loc] of latestLocations) {
      const driver = driverMap.get(driverNumber);
      const color = getTeamColor(driver?.team_colour ?? null);
      const px = scaleX(loc.x);
      const py = scaleY(loc.y);

      // Car dot
      ctx.beginPath();
      ctx.arc(px, py, 8, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.8)";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Driver number label
      ctx.fillStyle = "#fff";
      ctx.font = "bold 8px monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(
        driver?.name_acronym ?? String(driverNumber),
        px,
        py
      );
    }
  }, [latestLocations, driverMap]);

  useEffect(() => {
    drawTrackMap();
  }, [drawTrackMap]);

  // Resize handler
  useEffect(() => {
    const handleResize = () => drawTrackMap();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [drawTrackMap]);

  if (!isLive) {
    return (
      <div className="space-y-6">
        <EmptyState
          icon={MapPin}
          title="No active session"
          description="The track map will show live car positions when a session is in progress."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {latestSession?.circuit_short_name} - Car Positions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative w-full" style={{ aspectRatio: "16/9" }}>
            <canvas
              ref={canvasRef}
              className="w-full h-full bg-muted rounded-lg"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
