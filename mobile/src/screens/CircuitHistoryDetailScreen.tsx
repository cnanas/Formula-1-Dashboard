import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Svg, { Path } from "react-native-svg";
import { getTrackPathD } from "../lib/track-layouts";
import { LapCard } from "../components/LapCard";
import { CountryFlag } from "../components/CountryFlag";
import { LapTelemetrySection } from "../components/LapTelemetrySection";
import type { LapRecord, RaceRecord } from "../lib/types";

function minLapMetric(
  laps: LapRecord[],
  select: (lap: LapRecord) => number | null | undefined
): number | null {
  let best: number | null = null;
  laps.forEach((lap) => {
    const value = select(lap);
    if (value == null || value <= 0 || !Number.isFinite(value)) return;
    if (best == null || value < best) best = value;
  });
  return best;
}

/** Map raw session type from game to display label (Unknown = Time Trial). */
const SESSION_TYPE_LABELS: Record<string, string> = {
  Unknown: "Time Trial",
};

function getSessionTypeLabel(raw: string): string {
  return SESSION_TYPE_LABELS[raw] ?? raw;
}

function formatSessionDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

export interface CircuitHistoryData {
  circuit: string;
  sessions: RaceRecord[];
  lastRanDate: string;
  bestLapMs: number | null;
  totalLaps: number;
}

interface CircuitHistoryDetailScreenProps {
  data: CircuitHistoryData;
  onBack: () => void;
}

const VIEWBOX = "0 0 500 500";

export function CircuitHistoryDetailScreen({
  data,
  onBack,
}: CircuitHistoryDetailScreenProps) {
  const [selectedLapIndex, setSelectedLapIndex] = useState<number | null>(null);
  const [sessionTypeFilter, setSessionTypeFilter] = useState<string | null>(null);

  const uniqueSessionTypes = useMemo(() => {
    const types = new Set(data.sessions.map((s) => s.sessionType));
    return Array.from(types).sort();
  }, [data.sessions]);

  const filteredSessions = useMemo(() => {
    if (sessionTypeFilter == null) return data.sessions;
    return data.sessions.filter((s) => s.sessionType === sessionTypeFilter);
  }, [data.sessions, sessionTypeFilter]);

  const allLaps = useMemo(() => {
    const laps: LapRecord[] = [];
    filteredSessions.forEach((s) => laps.push(...s.laps));
    return laps;
  }, [filteredSessions]);

  const bestLapMs = minLapMetric(allLaps, (lap) => lap.lapTimeMs);
  const bestS1Ms = minLapMetric(allLaps, (lap) => lap.sector1Ms);
  const bestS2Ms = minLapMetric(allLaps, (lap) => lap.sector2Ms);
  const bestS3Ms = minLapMetric(allLaps, (lap) => lap.sector3Ms);

  const pathD = getTrackPathD(data.circuit);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={onBack}
          activeOpacity={0.7}
          accessibilityLabel="Back"
        >
          <Ionicons name="chevron-back" size={28} color="#007aff" />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <View style={styles.titleRow}>
          <CountryFlag circuitName={data.circuit} size={22} />
          <Text style={styles.title} numberOfLines={1}>
            {data.circuit}
          </Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Circuit image / track outline */}
        <View style={styles.trackHeader}>
          {pathD ? (
            <View style={styles.trackSvgWrap}>
              <Svg
                viewBox={VIEWBOX}
                style={styles.trackSvg}
                preserveAspectRatio="xMidYMid meet"
              >
                <Path
                  d={pathD}
                  fill="none"
                  stroke="#A91D3A"
                  strokeWidth={16}
                  strokeLinejoin="round"
                  strokeOpacity={0.9}
                />
              </Svg>
            </View>
          ) : (
            <View style={styles.trackPlaceholder}>
              <Ionicons name="flag-outline" size={40} color="#c7c7cc" />
            </View>
          )}
          <View style={styles.summaryRow}>
            <CountryFlag circuitName={data.circuit} size={28} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Best lap</Text>
              <Text style={styles.summaryValue}>
                {bestLapMs != null && bestLapMs > 0
                  ? `${Math.floor(bestLapMs / 60000)}:${((bestLapMs % 60000) / 1000).toFixed(3).padStart(6, "0")}`
                  : "—"}
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Total laps</Text>
              <Text style={styles.summaryValue}>{allLaps.length}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Sessions</Text>
              <Text style={styles.summaryValue}>{filteredSessions.length}</Text>
            </View>
          </View>
        </View>

        {/* Session type filter */}
        {uniqueSessionTypes.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.filterScroll}
            contentContainerStyle={styles.filterContent}
          >
            <TouchableOpacity
              style={[
                styles.filterPill,
                sessionTypeFilter == null && styles.filterPillActive,
              ]}
              onPress={() => {
                setSessionTypeFilter(null);
                setSelectedLapIndex(null);
              }}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.filterPillText,
                  sessionTypeFilter == null && styles.filterPillTextActive,
                ]}
              >
                All
              </Text>
            </TouchableOpacity>
            {uniqueSessionTypes.map((rawType) => {
              const label = getSessionTypeLabel(rawType);
              const isActive = sessionTypeFilter === rawType;
              return (
                <TouchableOpacity
                  key={rawType}
                  style={[styles.filterPill, isActive && styles.filterPillActive]}
                  onPress={() => {
                    setSessionTypeFilter(rawType);
                    setSelectedLapIndex(null);
                  }}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.filterPillText,
                      isActive && styles.filterPillTextActive,
                    ]}
                  >
                    {label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}

        {/* Sessions with laps */}
        {(() => {
          let globalLapIdx = 0;
          return filteredSessions.map((session, sessionIdx) => (
            <View key={`${session.id}-${session.date}-${sessionIdx}`} style={styles.sessionBlock}>
              <View style={styles.sessionHeader}>
                <CountryFlag circuitName={data.circuit} size={18} />
                <Text style={styles.sessionType}>
                  {getSessionTypeLabel(session.sessionType)}
                </Text>
                <Text style={styles.sessionDate}>
                  {formatSessionDate(session.date)}
                </Text>
              </View>
              {session.laps.map((lap, idx) => {
                const thisGlobalIdx = globalLapIdx++;
                const isSelected = selectedLapIndex === thisGlobalIdx;
                return (
                  <View key={`${session.id}-lap-${idx}`}>
                    <LapCard
                      lap={lap}
                      bestLapMs={bestLapMs}
                      bestS1Ms={bestS1Ms}
                      bestS2Ms={bestS2Ms}
                      bestS3Ms={bestS3Ms}
                      onPress={() =>
                        setSelectedLapIndex((prev) =>
                          prev === thisGlobalIdx ? null : thisGlobalIdx
                        )
                      }
                      selected={isSelected}
                    />
                    {isSelected && (
                      <LapTelemetrySection
                        laps={allLaps}
                        selectedLapIndex={thisGlobalIdx}
                        onSelectLap={(i) => setSelectedLapIndex(i)}
                        inline
                      />
                    )}
                  </View>
                );
              })}
            </View>
          ));
        })()}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f2f2f7",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#d1d1d6",
    backgroundColor: "#ffffff",
  },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingRight: 12,
    minWidth: 72,
  },
  backText: {
    fontSize: 17,
    color: "#007aff",
    fontWeight: "600",
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1c1c1e",
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  trackHeader: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#d1d1d6",
    overflow: "hidden",
    marginBottom: 16,
  },
  trackSvgWrap: {
    height: 140,
    padding: 12,
  },
  trackSvg: {
    width: "100%",
    height: "100%",
  },
  trackPlaceholder: {
    height: 100,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f9f9f9",
  },
  titleRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  headerSpacer: {
    minWidth: 72,
  },
  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#e5e5ea",
    padding: 14,
    gap: 12,
  },
  summaryItem: {
    flex: 1,
    alignItems: "center",
  },
  summaryLabel: {
    fontSize: 11,
    color: "#8e8e93",
    marginBottom: 2,
  },
  summaryValue: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1c1c1e",
    fontFamily: "monospace",
  },
  filterScroll: {
    marginBottom: 16,
    marginHorizontal: -4,
  },
  filterContent: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 4,
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#e5e5ea",
  },
  filterPillActive: {
    backgroundColor: "#A91D3A",
  },
  filterPillText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#3a3a3c",
  },
  filterPillTextActive: {
    color: "#ffffff",
  },
  sessionBlock: {
    marginBottom: 20,
  },
  sessionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  sessionType: {
    fontSize: 14,
    fontWeight: "600",
    color: "#248a3d",
  },
  sessionDate: {
    fontSize: 13,
    color: "#8e8e93",
  },
  lapsContainer: {
    marginBottom: 16,
  },
});
