import { normalizeTeamName } from "./team-names";

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
  "Racing Bulls": "VCARB 03",
  "Kick Sauber": "R26", // Becomes Audi in 2026
  "Haas F1 Team": "VF-26",
  Audi: "R26",
  Cadillac: "TBC",
};

export function getTeamCarModel(teamName: string): string {
  const normalized = normalizeTeamName(teamName);
  return TEAM_CAR_MODELS[normalized] ?? TEAM_CAR_MODELS[teamName] ?? "—";
}
