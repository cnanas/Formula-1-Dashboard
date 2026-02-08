"use client";

import { useState, useEffect } from "react";
import type { CarData } from "@/types/openf1";

const WS_DEFAULT_URL = "ws://localhost:20978";

export interface UseGameTelemetryResult {
  data: CarData | null;
  connected: boolean;
  error: string | null;
}

export function useGameTelemetry(url?: string): UseGameTelemetryResult {
  const [data, setData] = useState<CarData | null>(null);
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
        const parsed = JSON.parse(e.data as string);
        setData({
          brake: parsed.brake ?? 0,
          date: new Date().toISOString(),
          driver_number: 1,
          drs: parsed.drs ?? 0,
          meeting_key: 0,
          n_gear: parsed.n_gear ?? 0,
          rpm: parsed.rpm ?? 0,
          session_key: 0,
          speed: parsed.speed ?? 0,
          throttle: parsed.throttle ?? 0,
        });
      } catch {
        // Ignore parse errors
      }
    };

    return () => ws.close();
  }, [wsUrl]);

  return { data, connected, error };
}
