import type { Driver, Session } from "@/types/openf1";
import { parseApiDate } from "@/lib/utils/formatting";

function toTimestamp(value: string | null): number {
  return parseApiDate(value)?.getTime() ?? Number.NaN;
}

function getSessionEndTimestamp(session: Session): number {
  const end = toTimestamp(session.date_end);
  if (Number.isFinite(end)) return end;
  return toTimestamp(session.date_start);
}

export function isSessionStarted(session: Session): boolean {
  const start = toTimestamp(session.date_start);
  return Number.isFinite(start) && start <= Date.now();
}

export function isSessionCompleted(session: Session): boolean {
  const end = getSessionEndTimestamp(session);
  return Number.isFinite(end) && end <= Date.now();
}

export function isGrandPrixRaceSession(session: Session): boolean {
  return (
    session.session_type?.toLowerCase() === "race" &&
    session.session_name?.toLowerCase() === "race"
  );
}

export function getLatestStartedSession(sessions: Session[]): Session | undefined {
  return [...sessions]
    .filter(isSessionStarted)
    .sort((a, b) => toTimestamp(b.date_start) - toTimestamp(a.date_start))[0];
}

export function getLatestCompletedSession(sessions: Session[]): Session | undefined {
  return [...sessions]
    .filter(isSessionCompleted)
    .sort((a, b) => toTimestamp(b.date_start) - toTimestamp(a.date_start))[0];
}

export function getLatestCompletedGrandPrixRaceSession(
  sessions: Session[]
): Session | undefined {
  return [...sessions]
    .filter((session) => isGrandPrixRaceSession(session) && isSessionCompleted(session))
    .sort((a, b) => toTimestamp(b.date_start) - toTimestamp(a.date_start))[0];
}

export function hasUsableDriverProfiles(drivers: Driver[]): boolean {
  if (drivers.length === 0) return false;

  const completeProfiles = drivers.filter(
    (driver) =>
      typeof driver.full_name === "string" &&
      driver.full_name.trim().length > 0 &&
      typeof driver.team_name === "string" &&
      driver.team_name.trim().length > 0 &&
      typeof driver.name_acronym === "string" &&
      driver.name_acronym.trim().length > 0
  ).length;

  const minimumProfiles = Math.max(6, Math.floor(drivers.length / 2));
  return completeProfiles >= minimumProfiles;
}
