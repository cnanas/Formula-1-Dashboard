/**
 * F1 team logo paths.
 * Maps OpenF1 team names to logo image paths in public/teams.
 */
export const TEAM_LOGOS: Record<string, string> = {
  "Red Bull Racing": "/teams/Red Bull/redbull-logo.png",
  McLaren: "/teams/Mclaren/mclaren-logo.png",
  Ferrari: "/teams/Ferarri/ferrari-logo.png",
  Mercedes: "/teams/Mercedes/mercedes-logo.png",
  "Aston Martin": "/teams/Aston Martin/aston-martin-logo.png",
  Alpine: "/teams/Alpine/alpine-logo.png",
  Williams: "/teams/Williams/williams-logo.png",
  RB: "/teams/Racing Bulls/racing-bulls-logo.png",
  "Racing Bull": "/teams/Racing Bulls/racing-bulls-logo.png",
  "Visa Cash App RB": "/teams/Racing Bulls/racing-bulls-logo.png",
  "Kick Sauber": "/teams/Audi/audi-logo.png",
  Haas: "/teams/Haas/haas-logo.png",
  "Haas F1 Team": "/teams/Haas/haas-logo.png",
  Audi: "/teams/Audi/audi-logo.png",
  Cadillac: "/teams/Cadillac/cadillac-logo.png",
};

export function getTeamLogoUrl(teamName: string): string | null {
  return TEAM_LOGOS[teamName] ?? null;
}
