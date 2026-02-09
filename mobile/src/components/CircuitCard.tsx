import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { TrackOutlineThumbnail } from "./TrackOutlineThumbnail";
import { CountryFlag } from "./CountryFlag";

function formatLapTime(ms: number | null): string {
  if (ms == null || ms <= 0 || !Number.isFinite(ms)) return "—";
  const m = Math.floor(ms / 60000);
  const s = ((ms % 60000) / 1000).toFixed(3);
  return m > 0 ? `${m}:${s.padStart(6, "0")}` : `${s}s`;
}

function formatLastRan(iso: string): string {
  try {
    const d = new Date(iso);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return iso;
  }
}

export interface CircuitCardData {
  circuit: string;
  lastRanDate: string;
  bestLapMs: number | null;
  totalLaps: number;
}

interface CircuitCardProps {
  data: CircuitCardData;
  onPress: () => void;
  noMargin?: boolean;
}

export function CircuitCard({ data, onPress, noMargin }: CircuitCardProps) {
  return (
    <TouchableOpacity
      style={[styles.card, noMargin && styles.cardNoMargin]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.trackWrap}>
        <TrackOutlineThumbnail circuitName={data.circuit} size={64} />
      </View>
      <View style={styles.content}>
        <View style={styles.circuitRow}>
          <CountryFlag circuitName={data.circuit} size={20} />
          <Text style={styles.circuit} numberOfLines={1}>
            {data.circuit}
          </Text>
        </View>
        <View style={styles.metaRow}>
          <Ionicons name="time-outline" size={12} color="#8e8e93" />
          <Text style={styles.metaText}>{formatLastRan(data.lastRanDate)}</Text>
        </View>
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>Best</Text>
            <Text style={styles.statValue}>{formatLapTime(data.bestLapMs)}</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>Laps</Text>
            <Text style={styles.statValue}>
              {data.totalLaps}
            </Text>
          </View>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#c7c7cc" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#d1d1d6",
    padding: 14,
    marginBottom: 10,
    overflow: "hidden",
  },
  cardNoMargin: {
    marginBottom: 0,
  },
  trackWrap: {
    marginRight: 14,
  },
  content: {
    flex: 1,
    minWidth: 0,
  },
  circuitRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  circuit: {
    fontSize: 17,
    fontWeight: "700",
    color: "#1c1c1e",
    flex: 1,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 8,
  },
  metaText: {
    fontSize: 13,
    color: "#8e8e93",
  },
  statsRow: {
    flexDirection: "row",
    gap: 20,
  },
  stat: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 6,
  },
  statLabel: {
    fontSize: 12,
    color: "#8e8e93",
  },
  statValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1c1c1e",
    fontFamily: "monospace",
  },
});
