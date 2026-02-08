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
  RB: "/Teams/Racing Bulls/racing-bulls-logo.png",
  "Racing Bull": "/Teams/Racing Bulls/racing-bulls-logo.png",
  "Visa Cash App RB": "/Teams/Racing Bulls/racing-bulls-logo.png",
  "Kick Sauber": "/Teams/Audi/audi-logo.png",
  Haas: "/Teams/Haas/haas-logo.png",
  "Haas F1 Team": "/Teams/Haas/haas-logo.png",
  Audi: "/Teams/Audi/audi-logo.png",
  Cadillac: "/Teams/Cadillac/cadillac-logo.png",
};

export function getTeamLogoUrl(teamName: string): string | null {
  return TEAM_LOGOS[teamName] ?? null;
}
