import { normalizeTeamName } from "./team-names";

/**
 * F1 team dashboard/livery image paths.
 * Maps OpenF1 team names to dashboard image paths in public/Teams.
 * Use capital T to match folder name (Vercel/Linux is case-sensitive).
 * Teams without images use the placeholder.
 */
const PLACEHOLDER_LIVERY = "/Teams/placeholder.svg";

export const TEAM_LIVERIES: Record<string, string> = {
  "Red Bull Racing": "/Teams/Red Bull/redbull-dashboard.png",
  McLaren: "/Teams/Mclaren/2026-reveal-dashboard.png",
  Ferrari: "/Teams/Ferarri/ferrari-dashboard.png",
  Mercedes: "/Teams/Mercedes/mercedes-dashboard.png",
  "Aston Martin": "/Teams/Aston Martin/2026-reveal-dashboard.png",
  Alpine: "/Teams/Alpine/alpine-dashboard.png",
  Williams: "/Teams/Williams/williams-dashboard.png",
  "Racing Bulls": "/Teams/Racing Bulls/racing-bulls-dashboard.png",
  "Kick Sauber": "/Teams/Audi/audi-dashboard.png",
  "Haas F1 Team": "/Teams/Haas/haas-dashboard.png",
  Audi: "/Teams/Audi/audi-dashboard.png",
  Cadillac: "/Teams/Cadillac/2026-reveal-dashboard.png",
};

export function getTeamLiveryUrl(teamName: string): string {
  const normalized = normalizeTeamName(teamName);
  return TEAM_LIVERIES[normalized] ?? TEAM_LIVERIES[teamName] ?? PLACEHOLDER_LIVERY;
}
