/**
 * F1 team dashboard/livery image paths.
 * Maps OpenF1 team names to dashboard image paths in public/teams.
 * Teams without images use the placeholder.
 */
const PLACEHOLDER_LIVERY = "/teams/placeholder.svg";

export const TEAM_LIVERIES: Record<string, string> = {
  "Red Bull Racing": "/teams/Red Bull/redbull-dashboard.png",
  McLaren: "/teams/Mclaren/2026-reveal-dashboard.png",
  Ferrari: "/teams/Ferarri/ferrari-dashboard.png",
  Mercedes: "/teams/Mercedes/mercedes-dashboard.png",
  "Aston Martin": "/teams/Aston Martin/2026-reveal-dashboard.png",
  Alpine: "/teams/Alpine/alpine-dashboard.png",
  Williams: "/teams/Williams/williams-dashboard.png",
  RB: "/teams/Racing Bulls/racing-bulls-dashboard.png",
  "Racing Bull": "/teams/Racing Bulls/racing-bulls-dashboard.png",
  "Visa Cash App RB": "/teams/Racing Bulls/racing-bulls-dashboard.png",
  "Kick Sauber": "/teams/Audi/audi-dashboard.png",
  Haas: "/teams/Haas/haas-dashboard.png",
  "Haas F1 Team": "/teams/Haas/haas-dashboard.png",
  Audi: "/teams/Audi/audi-dashboard.png",
  Cadillac: "/teams/Cadillac/2026-reveal-dashboard.png",
};

export function getTeamLiveryUrl(teamName: string): string {
  return TEAM_LIVERIES[teamName] ?? PLACEHOLDER_LIVERY;
}
