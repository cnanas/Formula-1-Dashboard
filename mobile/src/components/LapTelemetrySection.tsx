import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { TelemetryLineChart } from "./TelemetryLineChart";
import type { LapRecord, LapTelemetryPoint, SectorMetricTriplet } from "../lib/types";

/**
 * Filter telemetry to remove data from before the lap started.
 * Detects the S3 → S1 transition (lap boundary) and removes everything before it.
 * Only filters if we can clearly identify stale data - otherwise returns original data.
 */
function filterTelemetryToCurrentLap(telemetry: LapTelemetryPoint[]): LapTelemetryPoint[] {
  if (telemetry.length < 2) return telemetry;
  
  // Look for a S3 → S1 transition which indicates the lap boundary
  // This is the most reliable way to detect where the current lap starts
  for (let i = 1; i < telemetry.length; i++) {
    const prevSector = telemetry[i - 1]?.sector;
    const currSector = telemetry[i]?.sector;
    // Detect transition from S3 (2) to S1 (0) - this is the lap boundary
    if (prevSector === 2 && currSector === 0) {
      // Found the lap boundary - remove everything before it
      return telemetry.slice(i);
    }
  }
  
  // No clear lap boundary found - return original data
  // This preserves telemetry when sector data is missing or incomplete
  return telemetry;
}

/** Compute sector boundaries using lap sector times (most accurate) or per-point sector data as fallback. */
function computeSectorsFromTelemetry(
  telemetry: LapTelemetryPoint[],
  lap: LapRecord | null
): { s1End: number; s2End: number } | undefined {
  if (telemetry.length < 2) return undefined;

  // Primary: use lap sector times from the game (most accurate)
  if (
    lap != null &&
    lap.lapTimeMs > 0 &&
    lap.sector1Ms != null &&
    lap.sector2Ms != null &&
    lap.sector1Ms > 0 &&
    lap.sector2Ms > 0
  ) {
    const s1End = lap.sector1Ms / lap.lapTimeMs;
    const s2End = (lap.sector1Ms + lap.sector2Ms) / lap.lapTimeMs;
    // Sanity check: sectors should be in order and reasonable
    if (s1End > 0 && s1End < s2End && s2End < 1) {
      return { s1End, s2End };
    }
  }

  // Fallback: use per-point sector data when lap times are unavailable
  let s1EndIdx = -1;
  let s2EndIdx = -1;
  for (let i = 0; i < telemetry.length; i++) {
    const s = telemetry[i].sector;
    if (s === 1 && s1EndIdx < 0) s1EndIdx = i;
    if (s === 2 && s2EndIdx < 0) s2EndIdx = i;
  }

  if (s1EndIdx >= 0 && s2EndIdx >= 0 && s1EndIdx < s2EndIdx) {
    const n = telemetry.length - 1;
    return {
      s1End: Math.min(1, Math.max(0, s1EndIdx / n)),
      s2End: Math.min(1, Math.max(s1EndIdx / n, s2EndIdx / n)),
    };
  }

  return undefined;
}

function formatSpeedKph(value: number | null | undefined): string {
  return value == null || !Number.isFinite(value)
    ? "—"
    : `${Math.round(value)} km/h`;
}

function formatSectorTriplet(metrics: SectorMetricTriplet | undefined): string {
  if (!metrics) return "S1 — · S2 — · S3 —";
  return `S1 ${formatSpeedKph(metrics.s1)} · S2 ${formatSpeedKph(metrics.s2)} · S3 ${formatSpeedKph(metrics.s3)}`;
}

interface LapTelemetrySectionProps {
  laps: LapRecord[];
  selectedLapIndex: number;
  onSelectLap: (index: number) => void;
  /** When true, hide lap selector (used when telemetry is shown inline below a tapped lap). */
  inline?: boolean;
}

export function LapTelemetrySection({
  laps,
  selectedLapIndex,
  onSelectLap,
  inline = false,
}: LapTelemetrySectionProps) {
  const idx = Math.max(0, Math.min(selectedLapIndex, laps.length - 1));
  const lap = laps[idx];
  const rawTelemetry = lap?.telemetry ?? [];
  // Filter out stale data from before the lap started
  const telemetry = filterTelemetryToCurrentLap(rawTelemetry);
  const hasTelemetry = telemetry.length >= 2;
  const contentWidth = Math.max(360, telemetry.length * 2);

  const sectors = computeSectorsFromTelemetry(telemetry, lap);

  const chartProps = (metric: "speed" | "brake" | "throttle", title: string, max: number, unit: string, color: string) => ({
    data: telemetry,
    metric,
    title,
    max,
    unit,
    color,
    sectors,
    scrollable: false,
    contentWidth,
  });

  return (
    <View style={[styles.telemetrySection, inline && styles.telemetrySectionInline]}>
      <View style={[styles.telemetrySectionHeader, inline && styles.telemetrySectionHeaderInline]}>
        <Text style={styles.telemetryTitle}>
          {inline ? "Telemetry" : "Lap telemetry"}
        </Text>
      </View>
      {!inline && (
      <View style={styles.lapSelector}>
        {laps.map((l, i) => (
          <TouchableOpacity
            key={`sel-${i}`}
            style={[styles.lapSelectorBtn, idx === i && styles.lapSelectorBtnActive]}
            onPress={() => onSelectLap(i)}
            activeOpacity={0.7}
          >
            <Text style={[styles.lapSelectorText, idx === i && styles.lapSelectorTextActive]}>
              Lap {l.lapNum + 1}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      )}
      {lap != null && (
        <View style={styles.lapSpeedSummary}>
          <Text style={styles.lapSpeedSummaryLine}>
            Top {formatSpeedKph(lap.topSpeedKph)} · Min corner{" "}
            {formatSpeedKph(lap.minCornerSpeedKph)}
            {lap.fuelUsedL != null ? ` · Fuel ${lap.fuelUsedL.toFixed(2)} L` : ""}
          </Text>
          <Text style={styles.lapSpeedSummarySubline}>
            Top by sector: {formatSectorTriplet(lap.topSpeedBySectorKph)}
          </Text>
          <Text style={styles.lapSpeedSummarySubline}>
            Min by sector: {formatSectorTriplet(lap.minCornerSpeedBySectorKph)}
          </Text>
        </View>
      )}
      {!hasTelemetry ? (
        <Text style={styles.noTelemetry}>No telemetry recorded for this lap.</Text>
      ) : (
        <>
          <TelemetryLineChart {...chartProps("speed", "Speed", 370, "km/h", "#3b82f6")} />
          <TelemetryLineChart {...chartProps("brake", "Brake", 100, "%", "#ef4444")} />
          <TelemetryLineChart {...chartProps("throttle", "Throttle", 100, "%", "#22c55e")} />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  telemetrySection: {
    borderTopWidth: 1,
    borderTopColor: "#d1d1d6",
    paddingHorizontal: 14,
    paddingBottom: 14,
    paddingTop: 12,
  },
  telemetrySectionInline: {
    borderTopWidth: 0,
    marginTop: 0,
    marginBottom: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e5e5ea",
    backgroundColor: "#ffffff",
  },
  telemetrySectionHeaderInline: {
    marginBottom: 8,
  },
  telemetrySectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  telemetryTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#3a3a3c",
  },
  lapSelector: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 10,
  },
  lapSpeedSummary: {
    borderWidth: 1,
    borderColor: "#d1d1d6",
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
    backgroundColor: "#ffffff",
    gap: 2,
  },
  lapSpeedSummaryLine: {
    fontSize: 12,
    color: "#1c1c1e",
    fontFamily: "monospace",
  },
  lapSpeedSummarySubline: {
    fontSize: 11,
    color: "#6e6e73",
    fontFamily: "monospace",
  },
  lapSelectorBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "#e5e5ea",
  },
  lapSelectorBtnActive: {
    backgroundColor: "#007aff",
  },
  lapSelectorText: {
    fontSize: 12,
    color: "#3a3a3c",
  },
  lapSelectorTextActive: {
    color: "#ffffff",
    fontWeight: "600",
  },
  noTelemetry: {
    fontSize: 12,
    color: "#8e8e93",
    fontStyle: "italic",
  },
});
