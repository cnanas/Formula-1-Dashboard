const TEAM_NAME_ALIASES: Record<string, string> = {
  RB: "Racing Bulls",
  "Racing Bull": "Racing Bulls",
  "Visa Cash App RB": "Racing Bulls",
  "Visa Cash App Racing Bulls": "Racing Bulls",
  "Visa Cash App Racing Bulls F1 Team": "Racing Bulls",
  "Racing Bulls RB": "Racing Bulls",
  Haas: "Haas F1 Team",
  "Kick Sauber": "Kick Sauber",
  "Stake F1 Team Kick Sauber": "Kick Sauber",
  "Stake F1 Team KICK Sauber": "Kick Sauber",
  "Stake Sauber": "Kick Sauber",
  Sauber: "Kick Sauber",
};

export function normalizeTeamName(teamName: string | null | undefined): string {
  if (typeof teamName !== "string") return "";
  const trimmed = teamName.trim();
  if (!trimmed) return trimmed;
  return TEAM_NAME_ALIASES[trimmed] ?? trimmed;
}
