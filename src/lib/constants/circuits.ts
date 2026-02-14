import { normalizeTeamName } from "./team-names";

// Circuit data with colors and themes for dynamic backgrounds
export interface CircuitTheme {
  id: string;
  name: string;
  country: string;
  countryCode: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  gradientAngle: number;
}

export const CIRCUIT_THEMES: Record<string, CircuitTheme> = {
  bahrain: {
    id: "bahrain",
    name: "Bahrain International Circuit",
    country: "Bahrain",
    countryCode: "BH",
    primaryColor: "#c41e3a", // Deep red (desert sunset)
    secondaryColor: "#ff6b35", // Orange
    accentColor: "#ffd700", // Gold
    gradientAngle: 135,
  },
  jeddah: {
    id: "jeddah",
    name: "Jeddah Corniche Circuit",
    country: "Saudi Arabia",
    countryCode: "SA",
    primaryColor: "#006c35", // Green
    secondaryColor: "#1a1a2e", // Dark blue
    accentColor: "#ffffff",
    gradientAngle: 180,
  },
  melbourne: {
    id: "melbourne",
    name: "Albert Park Circuit",
    country: "Australia",
    countryCode: "AU",
    primaryColor: "#00008b", // Navy blue
    secondaryColor: "#ffd700", // Gold
    accentColor: "#ffffff",
    gradientAngle: 120,
  },
  suzuka: {
    id: "suzuka",
    name: "Suzuka International Racing Course",
    country: "Japan",
    countryCode: "JP",
    primaryColor: "#bc002d", // Red (Japan flag)
    secondaryColor: "#ffffff",
    accentColor: "#ff69b4", // Cherry blossom pink
    gradientAngle: 45,
  },
  shanghai: {
    id: "shanghai",
    name: "Shanghai International Circuit",
    country: "China",
    countryCode: "CN",
    primaryColor: "#de2910", // Chinese red
    secondaryColor: "#ffde00", // Yellow
    accentColor: "#ffffff",
    gradientAngle: 160,
  },
  miami: {
    id: "miami",
    name: "Miami International Autodrome",
    country: "USA",
    countryCode: "US",
    primaryColor: "#ff6b9d", // Miami pink
    secondaryColor: "#00d4ff", // Cyan
    accentColor: "#ffffff",
    gradientAngle: 135,
  },
  imola: {
    id: "imola",
    name: "Autodromo Enzo e Dino Ferrari",
    country: "Italy",
    countryCode: "IT",
    primaryColor: "#009246", // Italian green
    secondaryColor: "#ce2b37", // Italian red
    accentColor: "#ffffff",
    gradientAngle: 90,
  },
  monaco: {
    id: "monaco",
    name: "Circuit de Monaco",
    country: "Monaco",
    countryCode: "MC",
    primaryColor: "#ce1126", // Monaco red
    secondaryColor: "#ffffff",
    accentColor: "#ffd700", // Gold (luxury)
    gradientAngle: 180,
  },
  montreal: {
    id: "montreal",
    name: "Circuit Gilles Villeneuve",
    country: "Canada",
    countryCode: "CA",
    primaryColor: "#ff0000", // Canadian red
    secondaryColor: "#ffffff",
    accentColor: "#d52b1e",
    gradientAngle: 120,
  },
  barcelona: {
    id: "barcelona",
    name: "Circuit de Barcelona-Catalunya",
    country: "Spain",
    countryCode: "ES",
    primaryColor: "#aa151b", // Spanish red
    secondaryColor: "#f1bf00", // Spanish yellow
    accentColor: "#ffffff",
    gradientAngle: 135,
  },
  spielberg: {
    id: "spielberg",
    name: "Red Bull Ring",
    country: "Austria",
    countryCode: "AT",
    primaryColor: "#ed2939", // Austrian red
    secondaryColor: "#ffffff",
    accentColor: "#1e3a5f", // Red Bull blue
    gradientAngle: 45,
  },
  silverstone: {
    id: "silverstone",
    name: "Silverstone Circuit",
    country: "United Kingdom",
    countryCode: "GB",
    primaryColor: "#012169", // Union Jack blue
    secondaryColor: "#c8102e", // Union Jack red
    accentColor: "#ffffff",
    gradientAngle: 160,
  },
  budapest: {
    id: "budapest",
    name: "Hungaroring",
    country: "Hungary",
    countryCode: "HU",
    primaryColor: "#436f4d", // Hungarian green
    secondaryColor: "#cd2a3e", // Hungarian red
    accentColor: "#ffffff",
    gradientAngle: 90,
  },
  spa: {
    id: "spa",
    name: "Circuit de Spa-Francorchamps",
    country: "Belgium",
    countryCode: "BE",
    primaryColor: "#2d2926", // Dark (Eau Rouge)
    secondaryColor: "#ffd700", // Belgian yellow
    accentColor: "#ed2939",
    gradientAngle: 135,
  },
  zandvoort: {
    id: "zandvoort",
    name: "Circuit Zandvoort",
    country: "Netherlands",
    countryCode: "NL",
    primaryColor: "#ff6600", // Dutch orange
    secondaryColor: "#21468b", // Dutch blue
    accentColor: "#ffffff",
    gradientAngle: 120,
  },
  monza: {
    id: "monza",
    name: "Autodromo Nazionale Monza",
    country: "Italy",
    countryCode: "IT",
    primaryColor: "#009246", // Italian green
    secondaryColor: "#ce2b37", // Italian red
    accentColor: "#ffffff",
    gradientAngle: 180,
  },
  baku: {
    id: "baku",
    name: "Baku City Circuit",
    country: "Azerbaijan",
    countryCode: "AZ",
    primaryColor: "#0092bc", // Caspian blue
    secondaryColor: "#e4002b", // Azerbaijani red
    accentColor: "#00af66",
    gradientAngle: 45,
  },
  singapore: {
    id: "singapore",
    name: "Marina Bay Street Circuit",
    country: "Singapore",
    countryCode: "SG",
    primaryColor: "#ef3340", // Singapore red
    secondaryColor: "#ffffff",
    accentColor: "#ffd700", // Night lights gold
    gradientAngle: 160,
  },
  austin: {
    id: "austin",
    name: "Circuit of the Americas",
    country: "USA",
    countryCode: "US",
    primaryColor: "#002868", // American blue
    secondaryColor: "#bf0a30", // American red
    accentColor: "#ffffff",
    gradientAngle: 135,
  },
  mexico: {
    id: "mexico",
    name: "Autódromo Hermanos Rodríguez",
    country: "Mexico",
    countryCode: "MX",
    primaryColor: "#006847", // Mexican green
    secondaryColor: "#ce1126", // Mexican red
    accentColor: "#ffffff",
    gradientAngle: 90,
  },
  interlagos: {
    id: "interlagos",
    name: "Autódromo José Carlos Pace",
    country: "Brazil",
    countryCode: "BR",
    primaryColor: "#009c3b", // Brazilian green
    secondaryColor: "#ffdf00", // Brazilian yellow
    accentColor: "#002776",
    gradientAngle: 120,
  },
  lasvegas: {
    id: "lasvegas",
    name: "Las Vegas Strip Circuit",
    country: "USA",
    countryCode: "US",
    primaryColor: "#9b59b6", // Vegas purple
    secondaryColor: "#ffd700", // Gold
    accentColor: "#ff1493", // Neon pink
    gradientAngle: 180,
  },
  losail: {
    id: "losail",
    name: "Losail International Circuit",
    country: "Qatar",
    countryCode: "QA",
    primaryColor: "#8d1b3d", // Maroon
    secondaryColor: "#ffffff",
    accentColor: "#ffd700",
    gradientAngle: 135,
  },
  abudhabi: {
    id: "abudhabi",
    name: "Yas Marina Circuit",
    country: "UAE",
    countryCode: "AE",
    primaryColor: "#00732f", // UAE green
    secondaryColor: "#ffffff",
    accentColor: "#c8102e",
    gradientAngle: 45,
  },
};

// Team colors for team-based themes
export const TEAM_COLORS: Record<string, { primary: string; secondary: string; accent: string }> = {
  "Red Bull Racing": {
    primary: "#3671c6",
    secondary: "#1e3a5f",
    accent: "#ffd700",
  },
  McLaren: {
    primary: "#ff8000",
    secondary: "#47c7fc",
    accent: "#ffffff",
  },
  Ferrari: {
    primary: "#e8002d",
    secondary: "#fff200",
    accent: "#ffffff",
  },
  Mercedes: {
    primary: "#27f4d2",
    secondary: "#000000",
    accent: "#ffffff",
  },
  "Aston Martin": {
    primary: "#229971",
    secondary: "#0d3b2d",
    accent: "#ffffff",
  },
  Alpine: {
    primary: "#ff87bc",
    secondary: "#0093cc",
    accent: "#ffffff",
  },
  Williams: {
    primary: "#64c4ff",
    secondary: "#041e42",
    accent: "#ffffff",
  },
  "Racing Bulls": {
    primary: "#6692ff",
    secondary: "#1e3a5f",
    accent: "#ffffff",
  },
  "Kick Sauber": {
    primary: "#52e252",
    secondary: "#000000",
    accent: "#ffffff",
  },
  "Haas F1 Team": {
    primary: "#b6babd",
    secondary: "#e10600",
    accent: "#ffffff",
  },
  Audi: {
    primary: "#dc0000",
    secondary: "#000000",
    accent: "#ffffff",
  },
  Cadillac: {
    primary: "#002856",
    secondary: "#c8102e",
    accent: "#ffffff",
  },
};

// Default theme when no circuit is active
export const DEFAULT_THEME: CircuitTheme = {
  id: "default",
  name: "F1 Default",
  country: "",
  countryCode: "",
  primaryColor: "#e10600", // F1 Red
  secondaryColor: "#1e1e1e",
  accentColor: "#ffffff",
  gradientAngle: 135,
};

// Map circuit short names to theme IDs
export const CIRCUIT_NAME_MAP: Record<string, string> = {
  bahrain: "bahrain",
  jeddah: "jeddah",
  melbourne: "melbourne",
  albert_park: "melbourne",
  suzuka: "suzuka",
  shanghai: "shanghai",
  miami: "miami",
  imola: "imola",
  monaco: "monaco",
  montreal: "montreal",
  canada: "montreal",
  barcelona: "barcelona",
  spain: "barcelona",
  spielberg: "spielberg",
  austria: "spielberg",
  red_bull_ring: "spielberg",
  silverstone: "silverstone",
  britain: "silverstone",
  budapest: "budapest",
  hungary: "budapest",
  spa: "spa",
  belgium: "spa",
  zandvoort: "zandvoort",
  netherlands: "zandvoort",
  monza: "monza",
  italy: "monza",
  baku: "baku",
  azerbaijan: "baku",
  singapore: "singapore",
  austin: "austin",
  cota: "austin",
  usa: "austin",
  mexico: "mexico",
  interlagos: "interlagos",
  brazil: "interlagos",
  sao_paulo: "interlagos",
  las_vegas: "lasvegas",
  vegas: "lasvegas",
  losail: "losail",
  qatar: "losail",
  abu_dhabi: "abudhabi",
  yas_marina: "abudhabi",
};

export function getCircuitTheme(circuitName: string): CircuitTheme {
  const normalizedName = circuitName.toLowerCase().replace(/[^a-z0-9]/g, "_");
  const themeId = CIRCUIT_NAME_MAP[normalizedName];
  return themeId ? CIRCUIT_THEMES[themeId] : DEFAULT_THEME;
}

export function getTeamColors(teamName: string) {
  const normalized = normalizeTeamName(teamName);
  return TEAM_COLORS[normalized] || TEAM_COLORS[teamName] || { primary: "#666666", secondary: "#333333", accent: "#ffffff" };
}
