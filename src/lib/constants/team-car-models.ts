/**
 * 2026 F1 car model names by team.
 * Maps OpenF1 team names to their car model designation.
 */
export const TEAM_CAR_MODELS: Record<string, string> = {
  "Red Bull Racing": "RB22",
  McLaren: "MCL40",
  Ferrari: "SF-26",
  Mercedes: "W17",
  "Aston Martin": "AMR26",
  Alpine: "A526",
  Williams: "FW48",
  RB: "VCARB 03",
  "Racing Bull": "VCARB 03",
  "Visa Cash App RB": "VCARB 03",
  "Kick Sauber": "R26", // Becomes Audi in 2026
  Haas: "VF-26",
  "Haas F1 Team": "VF-26",
  Audi: "R26",
  Cadillac: "TBC",
};

export function getTeamCarModel(teamName: string): string {
  return TEAM_CAR_MODELS[teamName] ?? "—";
}
