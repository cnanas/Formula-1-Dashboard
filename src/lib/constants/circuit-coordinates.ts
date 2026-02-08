import { getCircuitSlug } from "./track-layouts";

/**
 * F1 circuit coordinates (longitude, latitude) for world map markers.
 * Uses getCircuitSlug for consistent matching with OpenF1 circuit_short_name.
 */
export const CIRCUIT_COORDINATES: Record<string, [number, number]> = {
  bahrain: [50.5106, 26.0325],
  sakhir: [50.5106, 26.0325],
  jeddah: [39.1742, 21.5433],
  melbourne: [144.968, -37.8494],
  suzuka: [136.5412, 34.8431],
  shanghai: [121.2203, 31.3389],
  miami: [-80.2389, 25.9581],
  imola: [11.7167, 44.3439],
  monaco: [7.4206, 43.7347],
  montreal: [-73.5228, 45.5001],
  barcelona: [2.2611, 41.5701],
  spielberg: [14.7647, 47.2197],
  silverstone: [-1.0169, 52.0786],
  budapest: [19.2486, 47.5789],
  spa: [5.9714, 50.4372],
  zandvoort: [4.5408, 52.3888],
  monza: [9.2811, 45.6156],
  baku: [49.8533, 40.3725],
  singapore: [103.8642, 1.2914],
  austin: [-97.6411, 30.1328],
  mexico: [-99.0907, 19.4061],
  interlagos: [-46.6997, -23.7036],
  lasvegas: [-115.1728, 36.1147],
  losail: [51.4528, 25.4894],
  abudhabi: [54.6031, 24.4672],
  madring: [-3.6242, 40.3719],
};

/** Get [longitude, latitude] for a circuit by short name. Returns null if not found. */
export function getCircuitCoordinates(circuitShortName: string): [number, number] | null {
  const slug = getCircuitSlug(circuitShortName);
  return slug ? CIRCUIT_COORDINATES[slug] ?? null : null;
}
