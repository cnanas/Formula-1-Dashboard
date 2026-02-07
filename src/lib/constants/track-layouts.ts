// Simplified SVG path data for F1 circuit track outlines
// Each path is drawn in a 100x100 viewBox for consistency
// These are approximate representations of each circuit's shape

export interface TrackLayout {
  path: string;
  viewBox: string;
}

export const TRACK_LAYOUTS: Record<string, TrackLayout> = {
  bahrain: {
    viewBox: "0 0 100 100",
    path: "M35 15 L65 15 Q80 15 80 30 L80 45 L70 50 L80 55 L80 70 Q80 85 65 85 L35 85 Q20 85 20 70 L20 30 Q20 15 35 15 Z",
  },
  jeddah: {
    viewBox: "0 0 100 100",
    path: "M20 90 L20 30 Q20 15 35 15 L75 15 Q85 15 85 25 L85 40 L75 45 L85 50 L85 65 Q85 75 75 75 L50 75 L45 85 L35 90 Z",
  },
  melbourne: {
    viewBox: "0 0 100 100",
    path: "M30 20 L60 20 Q75 20 75 35 L75 50 L65 55 L75 65 Q75 80 60 80 L40 80 Q25 80 25 65 L25 35 Q25 20 30 20 Z",
  },
  suzuka: {
    viewBox: "0 0 100 100",
    path: "M25 75 L25 40 Q25 25 40 25 L55 25 Q65 25 65 35 L65 45 Q65 55 55 55 L45 55 Q35 55 35 45 L35 35 Q40 30 50 35 L60 65 Q65 80 50 85 L35 85 Q20 85 25 75 Z",
  },
  shanghai: {
    viewBox: "0 0 100 100",
    path: "M50 15 Q70 15 75 30 L75 45 Q75 55 65 55 L55 55 Q45 55 45 45 L45 40 Q50 35 55 40 L60 50 L70 65 Q70 85 50 85 L35 85 Q20 85 20 70 L20 35 Q20 15 50 15 Z",
  },
  miami: {
    viewBox: "0 0 100 100",
    path: "M25 25 L70 25 Q80 25 80 35 L80 50 L65 55 L80 60 L80 70 Q80 80 70 80 L25 80 Q15 80 15 70 L15 35 Q15 25 25 25 Z",
  },
  imola: {
    viewBox: "0 0 100 100",
    path: "M30 20 L65 20 Q80 20 80 35 L80 50 Q80 60 70 60 L55 60 Q45 60 45 70 L45 80 Q45 90 35 85 L20 70 Q15 60 20 50 L25 35 Q25 20 30 20 Z",
  },
  monaco: {
    viewBox: "0 0 100 100",
    path: "M30 20 L55 20 Q65 20 70 30 L75 50 Q80 65 70 70 L55 75 Q45 78 40 70 L35 55 Q30 45 35 35 L40 30 Q40 25 35 20 Z",
  },
  montreal: {
    viewBox: "0 0 100 100",
    path: "M20 80 L20 35 Q20 20 35 20 L55 20 L60 30 L65 20 L75 20 Q85 20 85 35 L85 65 Q85 80 70 80 L45 80 L40 70 L35 80 Z",
  },
  barcelona: {
    viewBox: "0 0 100 100",
    path: "M30 15 L70 15 Q85 15 85 30 L85 50 L75 55 L85 60 L85 70 Q85 85 70 85 L30 85 Q15 85 15 70 L15 30 Q15 15 30 15 Z",
  },
  spielberg: {
    viewBox: "0 0 100 100",
    path: "M25 80 L25 35 Q25 20 40 15 L65 15 Q80 15 80 30 L80 55 Q80 65 70 70 L50 80 Z",
  },
  silverstone: {
    viewBox: "0 0 100 100",
    path: "M40 15 L60 15 Q75 15 80 25 L85 45 Q85 55 75 55 L65 50 L55 55 L65 65 Q75 75 65 85 L40 85 Q25 85 20 75 L15 55 Q15 45 25 45 L35 50 L40 40 L30 30 Q25 20 40 15 Z",
  },
  budapest: {
    viewBox: "0 0 100 100",
    path: "M35 15 L65 15 Q80 15 80 30 L80 55 Q80 65 70 65 L60 60 L50 65 L60 75 Q65 85 50 85 L35 85 Q20 85 20 70 L20 30 Q20 15 35 15 Z",
  },
  spa: {
    viewBox: "0 0 100 100",
    path: "M20 75 L20 45 L30 35 L25 25 Q25 15 35 15 L60 15 Q75 15 80 25 L85 45 Q85 55 75 60 L60 65 L65 75 Q65 85 55 85 L30 85 Q20 85 20 75 Z",
  },
  zandvoort: {
    viewBox: "0 0 100 100",
    path: "M35 20 L65 20 Q80 20 80 35 L80 55 Q80 70 65 75 L45 80 Q30 82 25 70 L20 50 Q18 35 35 20 Z",
  },
  monza: {
    viewBox: "0 0 100 100",
    path: "M30 85 L20 50 Q15 30 30 20 L50 15 Q65 15 70 25 L80 55 Q85 70 70 80 L50 85 Z",
  },
  baku: {
    viewBox: "0 0 100 100",
    path: "M80 85 L80 30 Q80 15 65 15 L35 15 Q25 15 20 25 L15 40 L25 50 L15 55 L20 75 Q25 85 35 85 Z",
  },
  singapore: {
    viewBox: "0 0 100 100",
    path: "M25 25 L60 25 L65 20 L75 25 Q85 30 85 40 L85 65 Q85 80 70 80 L40 80 L35 85 L25 80 Q15 75 15 65 L15 40 Q15 25 25 25 Z",
  },
  austin: {
    viewBox: "0 0 100 100",
    path: "M30 15 L50 15 L55 25 L65 15 L75 20 Q85 25 85 35 L85 60 Q85 75 70 80 L40 85 Q25 85 20 75 L15 55 Q15 40 20 30 L25 20 Z",
  },
  mexico: {
    viewBox: "0 0 100 100",
    path: "M30 20 L65 20 Q80 20 80 35 L80 50 Q80 58 72 58 Q64 58 64 50 Q64 42 72 42 L80 50 L80 65 Q80 80 65 80 L30 80 Q15 80 15 65 L15 35 Q15 20 30 20 Z",
  },
  interlagos: {
    viewBox: "0 0 100 100",
    path: "M65 15 Q80 15 80 30 L80 50 Q80 60 70 65 L50 70 Q40 72 35 65 L30 50 L25 55 L20 45 Q15 30 25 20 L40 15 Z",
  },
  lasvegas: {
    viewBox: "0 0 100 100",
    path: "M25 20 L75 20 Q85 20 85 30 L85 50 L75 55 L85 60 L85 70 Q85 80 75 80 L25 80 Q15 80 15 70 L15 30 Q15 20 25 20 Z",
  },
  losail: {
    viewBox: "0 0 100 100",
    path: "M30 20 L65 20 Q80 20 80 35 L80 55 Q80 70 65 75 L45 80 Q25 85 20 70 L20 45 Q20 30 30 20 Z",
  },
  abudhabi: {
    viewBox: "0 0 100 100",
    path: "M35 15 L65 15 Q80 15 80 30 L80 45 L70 50 L80 55 L80 65 Q80 85 60 85 L40 85 Q20 85 20 65 L20 30 Q20 15 35 15 Z",
  },
};

// Map OpenF1 circuit_short_name values to track layout IDs
const CIRCUIT_SHORT_NAME_MAP: Record<string, string> = {
  sakhir: "bahrain",
  bahrain: "bahrain",
  jeddah: "jeddah",
  melbourne: "melbourne",
  albert_park: "melbourne",
  suzuka: "suzuka",
  shanghai: "shanghai",
  miami: "miami",
  imola: "imola",
  monaco: "monaco",
  "montréal": "montreal",
  montreal: "montreal",
  barcelona: "barcelona",
  catalunya: "barcelona",
  spielberg: "spielberg",
  silverstone: "silverstone",
  budapest: "budapest",
  hungaroring: "budapest",
  "spa-francorchamps": "spa",
  spa: "spa",
  zandvoort: "zandvoort",
  monza: "monza",
  baku: "baku",
  singapore: "singapore",
  marina_bay: "singapore",
  austin: "austin",
  cota: "austin",
  "mexico city": "mexico",
  mexico: "mexico",
  "são paulo": "interlagos",
  interlagos: "interlagos",
  "las vegas": "lasvegas",
  vegas: "lasvegas",
  lusail: "losail",
  losail: "losail",
  "yas island": "abudhabi",
  yas_marina: "abudhabi",
  abu_dhabi: "abudhabi",
};

export function getTrackLayout(circuitShortName: string): TrackLayout | null {
  const normalized = circuitShortName.toLowerCase().trim();
  const trackId = CIRCUIT_SHORT_NAME_MAP[normalized];
  return trackId ? TRACK_LAYOUTS[trackId] ?? null : null;
}
