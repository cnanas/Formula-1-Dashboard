import { useOpenF1 } from "./use-openf1";

/**
 * Detects whether an F1 session is currently live.
 * Polls the sessions endpoint every 30 seconds.
 */
export function useSessionStatus() {
  const { data: sessions, isLoading } = useOpenF1(
    "sessions",
    { session_key: "latest" },
    { refreshInterval: 30_000 }
  );

  const latestSession = sessions[0] ?? null;

  const isLive =
    latestSession !== null &&
    (latestSession.date_end === null ||
      new Date(latestSession.date_end) > new Date());

  return {
    latestSession,
    isLive,
    isLoading,
  };
}
