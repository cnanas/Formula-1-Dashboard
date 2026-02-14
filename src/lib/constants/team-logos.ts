import { normalizeTeamName } from "./team-names";

/**
 * F1 team logo paths.
 * Maps OpenF1 team names to logo image paths in public/Teams.
 * Use capital T to match folder name (Vercel/Linux is case-sensitive).
 */
export const TEAM_LOGOS: Record<string, string> = {
  "Red Bull Racing": "/Teams/Red Bull/redbull-logo.png",
  McLaren: "/Teams/Mclaren/mclaren-logo.png",
  Ferrari: "/Teams/Ferarri/ferrari-logo.png",
  Mercedes: "/Teams/Mercedes/mercedes-logo.png",
  "Aston Martin": "/Teams/Aston Martin/aston-martin-logo.png",
  Alpine: "/Teams/Alpine/alpine-logo.png",
  Williams: "/Teams/Williams/williams-logo.png",
  "Racing Bulls": "/Teams/Racing Bulls/racing-bulls-logo.png",
  "Kick Sauber": "/Teams/Audi/audi-logo.png",
  "Haas F1 Team": "/Teams/Haas/haas-logo.png",
  Audi: "/Teams/Audi/audi-logo.png",
  Cadillac: "/Teams/Cadillac/cadillac-logo.png",
};

export function getTeamLogoUrl(teamName: string): string | null {
  const normalized = normalizeTeamName(teamName);
  return TEAM_LOGOS[normalized] ?? TEAM_LOGOS[teamName] ?? null;
}
