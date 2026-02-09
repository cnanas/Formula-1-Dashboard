import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import type { LapRecord } from "../lib/types";

const BEST_DELTA_EPSILON_MS = 0.5;

function formatLapTime(ms: number): string {
  const m = Math.floor(ms / 60000);
  const s = ((ms % 60000) / 1000).toFixed(3);
  return m > 0 ? `${m}:${s.padStart(6, "0")}` : `${s}s`;
}

function formatDelta(deltaMs: number): string {
  return `+${(deltaMs / 1000).toFixed(3)}s`;
}

function formatSpeedKph(value: number | null | undefined): string {
  return value == null || !Number.isFinite(value) ? "—" : `${Math.round(value)} km/h`;
}

interface SectorWithDeltaProps {
  label: string;
  valueMs: number | null | undefined;
  bestMs: number | null;
}

function SectorWithDelta({ label, valueMs, bestMs }: SectorWithDeltaProps) {
  if (valueMs == null || valueMs <= 0 || !Number.isFinite(valueMs)) {
    return (
      <Text style={styles.sectorText}>
        {label} <Text style={styles.sectorValue}>—</Text>
      </Text>
    );
  }
  const deltaMs = bestMs != null ? valueMs - bestMs : null;
  const isBest = deltaMs != null && Math.abs(deltaMs) <= BEST_DELTA_EPSILON_MS;
  return (
    <Text style={styles.sectorText}>
      {label}{" "}
      <Text style={styles.sectorValue}>{formatLapTime(valueMs)}</Text>
      {deltaMs != null && (
        <Text style={isBest ? styles.bestText : styles.deltaText}>
          {" "}
          {isBest ? "BEST" : formatDelta(deltaMs)}
        </Text>
      )}
    </Text>
  );
}

export interface LapCardProps {
  lap: LapRecord;
  bestLapMs: number | null;
  bestS1Ms: number | null;
  bestS2Ms: number | null;
  bestS3Ms: number | null;
  onPress?: () => void;
  selected?: boolean;
}

export function LapCard({
  lap,
  bestLapMs,
  bestS1Ms,
  bestS2Ms,
  bestS3Ms,
  onPress,
  selected,
}: LapCardProps) {
  const lapTimeDeltaMs =
    bestLapMs != null && lap.lapTimeMs > 0 && Number.isFinite(lap.lapTimeMs)
      ? lap.lapTimeMs - bestLapMs
      : null;
  const isBestLap =
    lapTimeDeltaMs != null && Math.abs(lapTimeDeltaMs) <= BEST_DELTA_EPSILON_MS;

  const content = (
    <>
      <View style={styles.header}>
        <Text style={styles.lapNum}>Lap {lap.lapNum + 1}</Text>
        <View style={styles.timeBlock}>
          <Text style={styles.lapTime}>
            {lap.lapTimeMs > 0 && Number.isFinite(lap.lapTimeMs)
              ? formatLapTime(lap.lapTimeMs)
              : "—"}
          </Text>
          {lapTimeDeltaMs != null && (
            <Text
              style={isBestLap ? styles.bestText : styles.deltaText}
              numberOfLines={1}
            >
              {isBestLap ? "BEST" : formatDelta(lapTimeDeltaMs)}
            </Text>
          )}
        </View>
      </View>
      <View style={styles.sectors}>
        <SectorWithDelta label="S1" valueMs={lap.sector1Ms} bestMs={bestS1Ms} />
        <SectorWithDelta label="S2" valueMs={lap.sector2Ms} bestMs={bestS2Ms} />
        <SectorWithDelta label="S3" valueMs={lap.sector3Ms} bestMs={bestS3Ms} />
        <Text style={styles.speedBlock}>
          Top {formatSpeedKph(lap.topSpeedKph)} · Min corner{" "}
          {formatSpeedKph(lap.minCornerSpeedKph)}
        </Text>
      </View>
    </>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.7}
        style={[styles.card, selected && styles.cardSelected]}
      >
        {content}
      </TouchableOpacity>
    );
  }
  return <View style={[styles.card, selected && styles.cardSelected]}>{content}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e5e5ea",
    padding: 12,
    marginBottom: 8,
  },
  cardSelected: {
    borderColor: "#007aff",
    borderWidth: 2,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  lapNum: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1c1c1e",
  },
  timeBlock: {
    alignItems: "flex-end",
  },
  lapTime: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1c1c1e",
    fontFamily: "monospace",
  },
  sectors: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    rowGap: 4,
  },
  sectorText: {
    fontSize: 11,
    color: "#6e6e73",
    fontFamily: "monospace",
  },
  sectorValue: {
    color: "#1c1c1e",
  },
  deltaText: {
    color: "#f59e0b",
    fontSize: 10,
  },
  bestText: {
    color: "#34c759",
    fontSize: 10,
    fontWeight: "700",
  },
  speedBlock: {
    fontSize: 11,
    color: "#6e6e73",
    fontFamily: "monospace",
    width: "100%",
    marginTop: 2,
  },
});
