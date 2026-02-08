/**
 * Maps country codes to ISO 3166-1 alpha-2 (2-letter) for flagcdn.com.
 * OpenF1 API may return 2-letter or 3-letter (alpha-3) codes.
 */
const ALPHA3_TO_ALPHA2: Record<string, string> = {
  BHR: "bh",
  SAU: "sa",
  AUS: "au",
  CHN: "cn",
  JPN: "jp",
  USA: "us",
  MYS: "my",
  ITA: "it",
  MCO: "mc",
  CAN: "ca",
  ESP: "es",
  AUT: "at",
  GBR: "gb",
  HUN: "hu",
  BEL: "be",
  NLD: "nl",
  AZE: "az",
  SGP: "sg",
  MEX: "mx",
  BRA: "br",
  QAT: "qa",
  ARE: "ae",
};

/**
 * Returns the 2-letter country code for flagcdn.com (e.g. "bh", "au").
 * Handles both 2-letter and 3-letter (alpha-3) input from OpenF1.
 */
export function getCountryFlagCode(countryCode: string | undefined): string {
  if (!countryCode || typeof countryCode !== "string") return "";
  const upper = countryCode.toUpperCase().trim();
  if (upper.length === 2) return upper.toLowerCase();
  return ALPHA3_TO_ALPHA2[upper] ?? upper.slice(0, 2).toLowerCase();
}
