"use client";

import { useState, useEffect } from "react";
import type { CarData } from "@/types/openf1";
import type { SessionSummary } from "@/types/game-telemetry";

const WS_DEFAULT_URL = "ws://localhost:20978";

export interface UseGameTelemetryResult {
  data: CarData | null;
  summary: SessionSummary | null;
  connected: boolean;
  error: string | null;
}

function toCarData(parsed: Record<string, unknown>): CarData {
  return {
    brake: Number(parsed.brake) ?? 0,
    date: new Date().toISOString(),
    driver_number: 1,
    drs: Number(parsed.drs) ?? 0,
    meeting_key: 0,
    n_gear: Number(parsed.n_gear) ?? 0,
    rpm: Number(parsed.rpm) ?? 0,
    session_key: 0,
    speed: Number(parsed.speed) ?? 0,
    throttle: Number(parsed.throttle) ?? 0,
  };
}

export function useGameTelemetry(url?: string): UseGameTelemetryResult {
  const [data, setData] = useState<CarData | null>(null);
  const [summary, setSummary] = useState<SessionSummary | null>(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const wsUrl = url ?? WS_DEFAULT_URL;

  useEffect(() => {
    setError(null);
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => setConnected(true);
    ws.onclose = () => setConnected(false);
    ws.onerror = () => setError("WebSocket connection failed");
    ws.onmessage = (e) => {
      try {
        const parsed = JSON.parse(e.data as string) as Record<string, unknown>;
        // New format: { live, summary }; legacy: flat object with speed, rpm, ...
        const hasLive = parsed && typeof parsed.live === "object";
        const rawLive = hasLive ? (parsed.live as Record<string, unknown>) : parsed;
        if (rawLive && (rawLive.speed != null || rawLive.throttle != null)) {
          setData(toCarData(rawLive));
        }
        if (parsed && typeof parsed.summary === "object" && parsed.summary !== null) {
          setSummary(parsed.summary as SessionSummary);
        }
      } catch {
        // Ignore parse errors
      }
    };

    return () => ws.close();
  }, [wsUrl]);

  return { data, summary, connected, error };
}
