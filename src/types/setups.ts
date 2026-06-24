export type SetupSource = "theorycrafted" | "gruhnd" | "f1laps";
export type SetupGame = "f125" | "f126";

export interface GameSetup {
  game: SetupGame;
  track: string;
  trackName: string;
  source: SetupSource;
  aero: string;
  differential: string;
  suspensionGeometry: string;
  suspension: string;
  brakes: string;
  tiresQuali: string;
  tiresRace: string;
  compounds: string;
  strategy?: string;
  laps?: string;
  notes?: string;
  createdBy?: string;
}

export interface SetupsResponse {
  setups: GameSetup[];
  byTrack: Record<string, GameSetup[]>;
}
