import { NextResponse } from "next/server";
import { redisGet, redisSet } from "@/lib/cache/redis";
import type { GameSetup, SetupsResponse } from "@/types/setups";

const THEORYCRAFTED_F125_SHEET =
  "https://docs.google.com/spreadsheets/d/1fUZKqMpARGJ1XEvsmGlOtN2_NVPOqLehPNiLH-YyYSI/export?format=csv&gid=1370671685";
const GRUHND_SHEET =
  "https://docs.google.com/spreadsheets/d/17e8fkiIzDIimDnH8B4JAiC9gTK6qzmFzg7yrqwczYG0/export?format=csv&gid=1159602742";
const THEORYCRAFTED_F126_SHEET =
  "https://docs.google.com/spreadsheets/d/1mmFai7jDGYpZ2cc_PBk3PBrpUFgbjEzB7z-q5P2VlFE/export?format=csv&gid=673562173";

const CACHE_KEY = "setups:v2";
const CACHE_TTL = 3600; // 1 hour

// Map sheet track names to circuit keys
const TRACK_MAP: Record<string, string> = {
  australia: "melbourne",
  china: "shanghai",
  japan: "suzuka",
  suzuka: "suzuka",
  bahrain: "bahrain",
  "saudi arabia": "jeddah",
  jeddah: "jeddah",
  miami: "miami",
  imola: "imola",
  monaco: "monaco",
  spain: "barcelona",
  barcelona: "barcelona",
  canada: "montreal",
  austria: "spielberg",
  "great britain": "silverstone",
  britain: "silverstone",
  silverstone: "silverstone",
  belgium: "spa",
  hungary: "budapest",
  netherlands: "zandvoort",
  monza: "monza",
  azerbaijan: "baku",
  baku: "baku",
  singapore: "singapore",
  "united states": "austin",
  texas: "austin",
  mexico: "mexico",
  brazil: "interlagos",
  "las vegas": "lasvegas",
  vegas: "lasvegas",
  qatar: "losail",
  "abu dhabi": "abudhabi",
  madrid: "madrid",
};

const TRACK_DISPLAY: Record<string, string> = {
  melbourne: "Australia",
  shanghai: "China",
  suzuka: "Japan",
  bahrain: "Bahrain",
  jeddah: "Saudi Arabia",
  miami: "Miami",
  imola: "Imola",
  monaco: "Monaco",
  barcelona: "Spain",
  montreal: "Canada",
  spielberg: "Austria",
  silverstone: "Great Britain",
  spa: "Belgium",
  budapest: "Hungary",
  zandvoort: "Netherlands",
  monza: "Monza",
  baku: "Azerbaijan",
  singapore: "Singapore",
  austin: "United States",
  mexico: "Mexico",
  interlagos: "Brazil",
  lasvegas: "Las Vegas",
  losail: "Qatar",
  abudhabi: "Abu Dhabi",
  madrid: "Madrid",
};

function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    const next = text[i + 1];

    if (c === '"') {
      if (inQuotes && next === '"') {
        field += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (inQuotes) {
      field += c;
    } else if (c === ",") {
      currentRow.push(field.trim());
      field = "";
    } else if (c === "\n" || (c === "\r" && next !== "\n")) {
      currentRow.push(field.trim());
      field = "";
      if (currentRow.some((cell) => cell.length > 0)) {
        rows.push(currentRow);
      }
      currentRow = [];
    } else if (c === "\r") {
      // skip \r before \n
    } else {
      field += c;
    }
  }

  if (field || currentRow.length > 0) {
    currentRow.push(field.trim());
    rows.push(currentRow);
  }

  return rows;
}

function toCircuitKey(name: string): string | null {
  const normalized = name.toLowerCase().trim().replace(/\s+/g, " ");
  for (const [sheetName, circuitKey] of Object.entries(TRACK_MAP)) {
    if (normalized === sheetName || normalized.includes(sheetName)) {
      return circuitKey;
    }
  }
  return null;
}

async function fetchTheorycraftedF125(): Promise<GameSetup[]> {
  const res = await fetch(THEORYCRAFTED_F125_SHEET, {
    next: { revalidate: CACHE_TTL },
  });
  if (!res.ok) return [];
  const text = await res.text();
  const rows = parseCSV(text);

  const setups: GameSetup[] = [];
  // Row 0: disclaimer, Row 1: headers, Row 2+: data
  for (let i = 2; i < rows.length; i++) {
    const row = rows[i];
    const circuit = row[0]?.trim() ?? "";
    if (!circuit || circuit.toLowerCase().includes("disclaimer")) continue;

    const circuitKey = toCircuitKey(circuit);
    if (!circuitKey) continue;

    setups.push({
      game: "f125",
      track: circuitKey,
      trackName: TRACK_DISPLAY[circuitKey] ?? circuit,
      source: "theorycrafted",
      aero: row[1] ?? "",
      differential: row[2] ?? "",
      suspensionGeometry: row[3] ?? "",
      suspension: row[4] ?? "",
      brakes: row[5] ?? "",
      tiresQuali: row[6] ?? "",
      tiresRace: row[7] ?? "",
      compounds: row[8] ?? "",
      strategy: row[9] ?? "",
      laps: row[10] ?? "",
      notes: row[12] ?? "",
      createdBy: row[11] ?? "Theorycrafted",
    });
  }
  return setups;
}

async function fetchGruhnd(): Promise<GameSetup[]> {
  const res = await fetch(GRUHND_SHEET, {
    next: { revalidate: CACHE_TTL },
  });
  if (!res.ok) return [];
  const text = await res.text();
  const rows = parseCSV(text);

  const setups: GameSetup[] = [];
  // Row 0: disclaimer, Row 1: headers, Row 2+: data
  for (let i = 2; i < rows.length; i++) {
    const row = rows[i];
    const circuit = row[0]?.trim() ?? "";
    if (!circuit || circuit.toLowerCase().includes("disclaimer") || circuit.toLowerCase() === "unnamed") continue;
    if (row[1] === "NO" && row[2] === "SETUPS") continue;

    const circuitKey = toCircuitKey(circuit);
    if (!circuitKey) continue;

    setups.push({
      game: "f125",
      track: circuitKey,
      trackName: TRACK_DISPLAY[circuitKey] ?? circuit,
      source: "gruhnd",
      aero: row[1] ?? "",
      differential: row[2] ?? "",
      suspensionGeometry: row[3] ?? "",
      suspension: row[4] ?? "",
      brakes: row[5] ?? "",
      tiresQuali: row[6] ?? "",
      tiresRace: row[7] ?? "",
      compounds: row[9] ?? "",
      strategy: row[8] ?? "",
      createdBy: row[11] ?? "gruhnd",
    });
  }
  return setups;
}

async function fetchTheorycraftedF126(): Promise<GameSetup[]> {
  const res = await fetch(THEORYCRAFTED_F126_SHEET, {
    next: { revalidate: CACHE_TTL },
  });
  if (!res.ok) return [];
  const text = await res.text();
  const rows = parseCSV(text);

  const setups: GameSetup[] = [];
  // Row 0: headers (empty rows at top are filtered by parseCSV), Row 1+: data
  // Columns: Track, Aerodynamics, Transmission, Suspension Geometry, Suspension, Brakes, Tyres (PSI), Track Guide Link, Race Strategy 50%, Short Format, Raw Hotlap
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const circuit = row[0]?.trim() ?? "";
    if (!circuit || circuit.toLowerCase() === "track") continue;

    const circuitKey = toCircuitKey(circuit);
    if (!circuitKey) continue;

    setups.push({
      game: "f126",
      track: circuitKey,
      trackName: TRACK_DISPLAY[circuitKey] ?? circuit,
      source: "theorycrafted",
      aero: row[1] ?? "",
      differential: row[2] ?? "",
      suspensionGeometry: row[3] ?? "",
      suspension: row[4] ?? "",
      brakes: row[5] ?? "",
      tiresQuali: "",
      tiresRace: row[6] ?? "",
      compounds: "",
      strategy: row[8] ?? "",
      createdBy: "Theorycrafted",
    });
  }
  return setups;
}

export async function GET() {
  const cached = await redisGet<SetupsResponse>(CACHE_KEY);
  if (cached) {
    return NextResponse.json(cached, {
      headers: {
        "Cache-Control": `public, max-age=${CACHE_TTL}, s-maxage=${CACHE_TTL}, stale-while-revalidate=600`,
      },
    });
  }

  try {
    const [theorycraftedF125, gruhnd, theorycraftedF126] = await Promise.all([
      fetchTheorycraftedF125(),
      fetchGruhnd(),
      fetchTheorycraftedF126(),
    ]);

    const setups = [...theorycraftedF125, ...gruhnd, ...theorycraftedF126];
    const byTrack: Record<string, GameSetup[]> = {};
    for (const s of setups) {
      if (!byTrack[s.track]) byTrack[s.track] = [];
      byTrack[s.track].push(s);
    }

    const response: SetupsResponse = { setups, byTrack };
    await redisSet(CACHE_KEY, response, CACHE_TTL);

    return NextResponse.json(response, {
      headers: {
        "Cache-Control": `public, max-age=${CACHE_TTL}, s-maxage=${CACHE_TTL}, stale-while-revalidate=600`,
      },
    });
  } catch (error) {
    console.error("Setups API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch setups" },
      { status: 502 }
    );
  }
}
