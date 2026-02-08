import { useEffect, useState, useCallback } from "react";
import dgram from "react-native-udp";
import NetInfo from "@react-native-community/netinfo";
import { parseCarTelemetryPacket } from "../lib/parser";
import type { GameTelemetry } from "../lib/types";

const UDP_PORT = 20777;

export interface UseUdpTelemetryResult {
  data: GameTelemetry | null;
  connected: boolean;
  listening: boolean;
  localIp: string | null;
  error: string | null;
  refreshLocalIp: () => Promise<void>;
}

export function useUdpTelemetry(): UseUdpTelemetryResult {
  const [data, setData] = useState<GameTelemetry | null>(null);
  const [listening, setListening] = useState(false);
  const [connected, setConnected] = useState(false);
  const [localIp, setLocalIp] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch local IP from NetInfo
  const refreshLocalIp = useCallback(async () => {
    const state = await NetInfo.fetch();
    const ip =
      state.details && "ipAddress" in state.details
        ? (state.details as { ipAddress?: string }).ipAddress ?? null
        : null;
    setLocalIp(ip);
  }, []);

  useEffect(() => {
    refreshLocalIp();
  }, [refreshLocalIp]);

  useEffect(() => {
    setError(null);
    const socket = dgram.createSocket("udp4");

    const handleMessage = (msg: Buffer) => {
      try {
        const telemetry = parseCarTelemetryPacket(msg);
        if (telemetry) {
          setData(telemetry);
          setConnected(true);
        }
      } catch {
        // Ignore parse errors
      }
    };

    const handleError = (err: Error) => {
      setError(err.message);
      setListening(false);
    };

    const handleListening = () => {
      setListening(true);
      refreshLocalIp();
    };

    socket.on("message", handleMessage);
    socket.on("error", handleError);
    socket.once("listening", handleListening);

    socket.bind(UDP_PORT, "0.0.0.0");

    return () => {
      socket.removeAllListeners();
      try {
        socket.close();
      } catch {
        // Ignore close errors
      }
      setListening(false);
      setConnected(false);
    };
  }, [refreshLocalIp]);

  return { data, connected, listening, localIp, error, refreshLocalIp };
}
