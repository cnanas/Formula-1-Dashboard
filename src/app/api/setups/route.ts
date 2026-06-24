import { NextResponse } from "next/server";
import { redisGet, redisSet } from "@/lib/cache/redis";
import type { GameSetup, SetupsResponse } from "@/types/setups";

const THEORYCRAFTED_F125_SHEET =
  "https://docs.google.com/spreadsheets/d/1fUZKqMpARGJ1XEvsmGlOtN2_NVPOqLehPNiLH-YyYSI/export?format=csv&gid=1370671685";
const GRUHND_SHEET =
  "https://docs.google.com/spreadsheets/d/17e8fkiIzDIimDnH8B4JAiC9gTK6qzmFzg7yrqwczYG0/export?format=csv&gid=1159602742";
const THEORYCRAFTED_F126_SHEET =
  "https://docs.google.com/spreadsheets/d/1mmFai7jDGYpZ2cc_PBk3PBrpUFgbjEzB7z-q5P2VlFE/export?format=csv&gid=673562173";
const F1LAPS_BASE = "https://www.f1laps.com";

const CACHE_KEY = "setups:v6";
const CACHE_TTL = 3600;

// ---------------------------------------------------------------------------
// Static maps
// ---------------------------------------------------------------------------

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

// F1Laps track slugs → circuit keys
const F1LAPS_TRACKS: { slug: string; circuitKey: string }[] = [
  { slug: "australia",   circuitKey: "melbourne"  },
  { slug: "china",       circuitKey: "shanghai"   },
  { slug: "japan",       circuitKey: "suzuka"     },
  { slug: "bahrain",     circuitKey: "bahrain"    },
  { slug: "saudi_arabia",circuitKey: "jeddah"     },
  { slug: "miami",       circuitKey: "miami"      },
  { slug: "canada",      circuitKey: "montreal"   },
  { slug: "monaco",      circuitKey: "monaco"     },
  { slug: "spain",       circuitKey: "barcelona"  },
  { slug: "austria",     circuitKey: "spielberg"  },
  { slug: "silverstone", circuitKey: "silverstone"},
  { slug: "spa",         circuitKey: "spa"        },
  { slug: "hungary",     circuitKey: "budapest"   },
  { slug: "netherlands", circuitKey: "zandvoort"  },
  { slug: "monza",       circuitKey: "monza"      },
  { slug: "madrid",      circuitKey: "madrid"     },
  { slug: "azerbaijan",  circuitKey: "baku"       },
  { slug: "singapore",   circuitKey: "singapore"  },
  { slug: "usa",         circuitKey: "austin"     },
  { slug: "mexico",      circuitKey: "mexico"     },
  { slug: "brazil",      circuitKey: "interlagos" },
  { slug: "las_vegas",   circuitKey: "lasvegas"   },
  { slug: "qatar",       circuitKey: "losail"     },
  { slug: "abudhabi",    circuitKey: "abudhabi"   },
  { slug: "imola",       circuitKey: "imola"      },
];

// ---------------------------------------------------------------------------
// CSV helpers (for F1 25 sheets)
// ---------------------------------------------------------------------------

function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    const next = text[i + 1];

    if (c === '"') {
      if (inQuotes && next === '"') { field += '"'; i++; }
      else inQuotes = !inQuotes;
    } else if (inQuotes) {
      field += c;
    } else if (c === ",") {
      currentRow.push(field.trim()); field = "";
    } else if (c === "\n" || (c === "\r" && next !== "\n")) {
      currentRow.push(field.trim()); field = "";
      if (currentRow.some((cell) => cell.length > 0)) rows.push(currentRow);
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
    if (normalized === sheetName || normalized.includes(sheetName)) return circuitKey;
  }
  return null;
}

// ---------------------------------------------------------------------------
// F1 25 fetchers
// ---------------------------------------------------------------------------

async function fetchTheorycraftedF125(): Promise<GameSetup[]> {
  try {
    const res = await fetch(THEORYCRAFTED_F125_SHEET, { next: { revalidate: CACHE_TTL } });
    if (!res.ok) return [];
    const rows = parseCSV(await res.text());
    const setups: GameSetup[] = [];
    for (let i = 2; i < rows.length; i++) {
      const row = rows[i];
      const circuit = row[0]?.trim() ?? "";
      if (!circuit || circuit.toLowerCase().includes("disclaimer")) continue;
      const circuitKey = toCircuitKey(circuit);
      if (!circuitKey) continue;
      setups.push({
        game: "f125", track: circuitKey,
        trackName: TRACK_DISPLAY[circuitKey] ?? circuit,
        source: "theorycrafted",
        aero: row[1] ?? "", differential: row[2] ?? "",
        suspensionGeometry: row[3] ?? "", suspension: row[4] ?? "",
        brakes: row[5] ?? "", tiresQuali: row[6] ?? "", tiresRace: row[7] ?? "",
        compounds: row[8] ?? "", strategy: row[9] ?? "", laps: row[10] ?? "",
        notes: row[12] ?? "", createdBy: row[11] ?? "Theorycrafted",
      });
    }
    return setups;
  } catch { return []; }
}

async function fetchGruhnd(): Promise<GameSetup[]> {
  try {
    const res = await fetch(GRUHND_SHEET, { next: { revalidate: CACHE_TTL } });
    if (!res.ok) return [];
    const rows = parseCSV(await res.text());
    const setups: GameSetup[] = [];
    for (let i = 2; i < rows.length; i++) {
      const row = rows[i];
      const circuit = row[0]?.trim() ?? "";
      if (!circuit || circuit.toLowerCase().includes("disclaimer") || circuit.toLowerCase() === "unnamed") continue;
      if (row[1] === "NO" && row[2] === "SETUPS") continue;
      const circuitKey = toCircuitKey(circuit);
      if (!circuitKey) continue;
      setups.push({
        game: "f125", track: circuitKey,
        trackName: TRACK_DISPLAY[circuitKey] ?? circuit,
        source: "gruhnd",
        aero: row[1] ?? "", differential: row[2] ?? "",
        suspensionGeometry: row[3] ?? "", suspension: row[4] ?? "",
        brakes: row[5] ?? "", tiresQuali: row[6] ?? "", tiresRace: row[7] ?? "",
        compounds: row[9] ?? "", strategy: row[8] ?? "",
        createdBy: row[11] ?? "gruhnd",
      });
    }
    return setups;
  } catch { return []; }
}

// ---------------------------------------------------------------------------
// F1 26 — Theorycrafted Google Sheet
// ---------------------------------------------------------------------------

async function fetchTheorycraftedF126(): Promise<GameSetup[]> {
  try {
    const res = await fetch(THEORYCRAFTED_F126_SHEET, { cache: "no-store" });
    if (!res.ok) return [];
    const rows = parseCSV(await res.text());
    const setups: GameSetup[] = [];
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const circuit = row[0]?.trim() ?? "";
      if (!circuit || circuit.toLowerCase() === "track") continue;
      if (!row[1]?.trim()) continue;
      const circuitKey = toCircuitKey(circuit);
      if (!circuitKey) continue;
      setups.push({
        game: "f126", track: circuitKey,
        trackName: TRACK_DISPLAY[circuitKey] ?? circuit,
        source: "theorycrafted",
        aero: row[1] ?? "", differential: row[2] ?? "",
        suspensionGeometry: row[3] ?? "", suspension: row[4] ?? "",
        brakes: row[5] ?? "", tiresQuali: "", tiresRace: row[6] ?? "",
        compounds: "", strategy: row[8] ?? "",
        createdBy: "Theorycrafted",
      });
    }
    return setups;
  } catch { return []; }
}

// ---------------------------------------------------------------------------
// F1 26 — F1Laps (top ranked setup per track)
// ---------------------------------------------------------------------------

function parseF1LapsValues(html: string): Record<string, string> {
  const values: Record<string, string> = {};
  // Each row: dt (label) + two dd's; the second dd has class "w-2/12" and holds the number
  const re = /<dt class="w-10\/12[^"]*">\s*([\s\S]*?)\s*<\/dt>[\s\S]*?<dd class="w-2\/12[^"]*">\s*([\s\S]*?)\s*<\/dd>/g;
  let m;
  while ((m = re.exec(html)) !== null) {
    const label = m[1].replace(/\s+/g, " ").trim();
    const val   = m[2].replace(/\s+/g, " ").trim();
    values[label] = val;
  }
  return values;
}

function parseF1LapsUsername(html: string): string {
  const m = html.match(/by\s+([A-Za-z0-9_\-\.]+)/);
  return m ? m[1] : "F1Laps";
}

async function fetchF1LapsTrack(
  slug: string,
  circuitKey: string,
  condition: "dry" | "wet"
): Promise<GameSetup | null> {
  try {
    const listUrl =
      condition === "wet"
        ? `${F1LAPS_BASE}/f1-26/setups/${slug}/wet/`
        : `${F1LAPS_BASE}/f1-26/setups/${slug}/`;

    // Step 1: get the listing to find the top setup UUID
    const listRes = await fetch(listUrl, { cache: "no-store" });
    if (!listRes.ok) return null;
    const listHtml = await listRes.text();

    const uuidMatch = listHtml.match(
      new RegExp(`href="/f1-26/setups/${slug}/([a-f0-9-]{36})/"`)
    );
    if (!uuidMatch) return null;
    const uuid = uuidMatch[1];

    // Step 2: fetch the setup detail page
    const detailRes = await fetch(`${F1LAPS_BASE}/f1-26/setups/${slug}/${uuid}/`, { cache: "no-store" });
    if (!detailRes.ok) return null;
    const detailHtml = await detailRes.text();

    const v = parseF1LapsValues(detailHtml);
    const username = parseF1LapsUsername(detailHtml);

    const fw  = v["Front Wing"] ?? "";
    const rw  = v["Rear Wing"] ?? "";
    const don = v["Differential Adjustment On Throttle"] ?? "";
    const dof = v["Differential Adjustment Off Throttle"] ?? "";
    const fc  = v["Front Camber"] ?? "";
    const rc  = v["Rear Camber"] ?? "";
    const ft  = v["Front Toe"] ?? "";
    const rt  = v["Rear Toe"] ?? "";
    const fs  = v["Front Suspension"] ?? "";
    const rs  = v["Rear Suspension"] ?? "";
    const fa  = v["Front Anti-Roll Bar"] ?? "";
    const ra  = v["Rear Anti-Roll Bar"] ?? "";
    const frh = v["Front Ride Height"] ?? "";
    const rrh = v["Rear Ride Height"] ?? "";
    const bp  = v["Break Pressure"] ?? "";
    const bb  = v["Front Break Bias"] ?? "";
    const tfr = v["Front Right Tyre Pressure"] ?? "";
    const tfl = v["Front Left Tyre Pressure"] ?? "";
    const trr = v["Rear Right Tyre Pressure"] ?? "";
    const trl = v["Rear Left Tyre Pressure"] ?? "";

    return {
      game: "f126",
      condition,
      track: circuitKey,
      trackName: TRACK_DISPLAY[circuitKey] ?? slug,
      source: "f1laps",
      aero:               [fw, rw].filter(Boolean).join(" / "),
      differential:       [don, dof].filter(Boolean).join(" / "),
      suspensionGeometry: [fc, rc, ft, rt].filter(Boolean).join(" / "),
      suspension:         [fs, rs, fa, ra, frh, rrh].filter(Boolean).join(" / "),
      brakes:             [bp, bb].filter(Boolean).join(" / "),
      tiresQuali:         "",
      tiresRace:          [tfr, tfl, trr, trl].filter(Boolean).join(" / "),
      compounds:          "",
      createdBy:          username,
    };
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// F1 26 — F1Laps meta setups (aggregate of what fast drivers use)
// ---------------------------------------------------------------------------

async function fetchF1LapsMetaTrack(slug: string, circuitKey: string): Promise<GameSetup | null> {
  try {
    const res = await fetch(`${F1LAPS_BASE}/f1-26/setups/${slug}/meta/`, { cache: "no-store" });
    if (!res.ok) return null;
    const html = await res.text();

    const v = parseF1LapsValues(html);

    // Meta uses slightly different label names and includes "psi" suffix on tyre values
    const strip = (s: string) => s.replace(/psi$/i, "").replace(/°$/, "").trim();
    const get = (...keys: string[]) => {
      for (const k of keys) { if (v[k]) return strip(v[k]); }
      return "";
    };

    const fw  = get("Front Wing");
    const rw  = get("Rear Wing");
    const don = get("Differential On Throttle", "Differential Adjustment On Throttle");
    const dof = get("Differential Off Throttle", "Differential Adjustment Off Throttle");
    const eb  = get("Engine Braking");
    const fc  = get("Front Camber");
    const rc  = get("Rear Camber");
    const ft  = get("Front Toe");
    const rt  = get("Rear Toe");
    const fs  = get("Front Suspension");
    const rs  = get("Rear Suspension");
    const fa  = get("Front Anti-Roll Bar");
    const ra  = get("Rear Anti-Roll Bar");
    const frh = get("Front Ride Height");
    const rrh = get("Rear Ride Height");
    const bp  = get("Brake Pressure", "Break Pressure");
    const bb  = get("Front Brake Bias", "Front Break Bias");
    const tfr = get("Front Right Tyre Pressure");
    const tfl = get("Front Left Tyre Pressure");
    const trr = get("Rear Right Tyre Pressure");
    const trl = get("Rear Left Tyre Pressure");

    return {
      game: "f126",
      condition: "meta",
      track: circuitKey,
      trackName: TRACK_DISPLAY[circuitKey] ?? slug,
      source: "f1laps",
      aero:               [fw, rw].filter(Boolean).join(" / "),
      differential:       [don, dof, eb ? `EB: ${eb}` : ""].filter(Boolean).join(" / "),
      suspensionGeometry: [fc, rc, ft, rt].filter(Boolean).join(" / "),
      suspension:         [fs, rs, fa, ra, frh, rrh].filter(Boolean).join(" / "),
      brakes:             [bp, bb].filter(Boolean).join(" / "),
      tiresQuali:         "",
      tiresRace:          [tfr, tfl, trr, trl].filter(Boolean).join(" / "),
      compounds:          "",
      createdBy:          "F1Laps Meta",
    };
  } catch {
    return null;
  }
}

async function fetchF1Laps(): Promise<GameSetup[]> {
  const tasks = F1LAPS_TRACKS.flatMap(({ slug, circuitKey }) => [
    fetchF1LapsTrack(slug, circuitKey, "dry"),
    fetchF1LapsTrack(slug, circuitKey, "wet"),
    fetchF1LapsMetaTrack(slug, circuitKey),
  ]);
  const results = await Promise.all(tasks);
  return results.filter((s): s is GameSetup => s !== null);
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function GET() {
  const cached = await redisGet<SetupsResponse>(CACHE_KEY);
  if (cached) {
    return NextResponse.json(cached, {
      headers: {
        "Cache-Control": `public, max-age=${CACHE_TTL}, s-maxage=${CACHE_TTL}, stale-while-revalidate=600`,
      },
    });
  }

  const [theorycraftedF125, gruhnd, theorycraftedF126, f1laps] = await Promise.all([
    fetchTheorycraftedF125(),
    fetchGruhnd(),
    fetchTheorycraftedF126(),
    fetchF1Laps(),
  ]);

  const setups = [...theorycraftedF125, ...gruhnd, ...theorycraftedF126, ...f1laps];
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
}
