export interface TrackLayout {
  svgPath: string;
}

const TRACK_LAYOUTS: Record<string, TrackLayout> = {
  bahrain: { svgPath: "/circuits-svg/bahrain-1.svg" },
  sakhir: { svgPath: "/circuits-svg/bahrain-3.svg" },
  jeddah: { svgPath: "/circuits-svg/jeddah-1.svg" },
  melbourne: { svgPath: "/circuits-svg/melbourne-2.svg" },
  suzuka: { svgPath: "/circuits-svg/suzuka-2.svg" },
  shanghai: { svgPath: "/circuits-svg/shanghai-1.svg" },
  miami: { svgPath: "/circuits-svg/miami-1.svg" },
  imola: { svgPath: "/circuits-svg/imola-3.svg" },
  monaco: { svgPath: "/circuits-svg/monaco-5.svg" },
  montreal: { svgPath: "/circuits-svg/montreal-6.svg" },
  barcelona: { svgPath: "/circuits-svg/catalunya-6.svg" },
  spielberg: { svgPath: "/circuits-svg/spielberg-3.svg" },
  silverstone: { svgPath: "/circuits-svg/silverstone-8.svg" },
  budapest: { svgPath: "/circuits-svg/hungaroring-3.svg" },
  spa: { svgPath: "/circuits-svg/spa-francorchamps-4.svg" },
  zandvoort: { svgPath: "/circuits-svg/zandvoort-5.svg" },
  monza: { svgPath: "/circuits-svg/monza-6.svg" },
  baku: { svgPath: "/circuits-svg/baku-1.svg" },
  singapore: { svgPath: "/circuits-svg/marina-bay-4.svg" },
  austin: { svgPath: "/circuits-svg/austin-1.svg" },
  mexico: { svgPath: "/circuits-svg/mexico-city-3.svg" },
  interlagos: { svgPath: "/circuits-svg/interlagos-2.svg" },
  lasvegas: { svgPath: "/circuits-svg/las-vegas-1.svg" },
  losail: { svgPath: "/circuits-svg/lusail-1.svg" },
  abudhabi: { svgPath: "/circuits-svg/yas-marina-2.svg" },
  madring: { svgPath: "/circuits-svg/madring-1.svg" },
};

const CIRCUIT_SHORT_NAME_MAP: Record<string, string> = {
  sakhir: "sakhir",
  bahrain: "bahrain",
  jeddah: "jeddah",
  melbourne: "melbourne",
  "albert park": "melbourne",
  suzuka: "suzuka",
  shanghai: "shanghai",
  miami: "miami",
  imola: "imola",
  monaco: "monaco",
  "monte carlo": "monaco",
  montreal: "montreal",
  barcelona: "barcelona",
  catalunya: "barcelona",
  spielberg: "spielberg",
  silverstone: "silverstone",
  budapest: "budapest",
  hungaroring: "budapest",
  "spa francorchamps": "spa",
  spa: "spa",
  zandvoort: "zandvoort",
  monza: "monza",
  baku: "baku",
  singapore: "singapore",
  "marina bay": "singapore",
  austin: "austin",
  cota: "austin",
  "mexico city": "mexico",
  mexico: "mexico",
  "sao paulo": "interlagos",
  interlagos: "interlagos",
  "las vegas": "lasvegas",
  vegas: "lasvegas",
  lusail: "losail",
  losail: "losail",
  "yas island": "abudhabi",
  "yas marina": "abudhabi",
  "yas marina circuit": "abudhabi",
  "abu dhabi": "abudhabi",
  madring: "madring",
};

function normalizeCircuitShortName(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[._-]+/g, " ")
    .replace(/\s+/g, " ");
}

export function getTrackLayout(circuitShortName: string): TrackLayout | null {
  const normalized = normalizeCircuitShortName(circuitShortName);
  const noCircuitSuffix = normalized.replace(/\bcircuit\b/g, "").replace(/\s+/g, " ").trim();

  const trackId =
    CIRCUIT_SHORT_NAME_MAP[normalized] ??
    CIRCUIT_SHORT_NAME_MAP[noCircuitSuffix] ??
    Object.entries(CIRCUIT_SHORT_NAME_MAP)
      .sort((a, b) => b[0].length - a[0].length)
      .find(([alias]) => normalized.includes(alias) || noCircuitSuffix.includes(alias))?.[1];

  return trackId ? TRACK_LAYOUTS[trackId] ?? null : null;
}
