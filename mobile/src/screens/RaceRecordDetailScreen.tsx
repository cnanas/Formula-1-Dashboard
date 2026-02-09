import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LapCard } from "../components/LapCard";
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
    if (best == null || value < best) {
      best = value;
    }
  });
  return best;
}

function formatRaceDate(iso: string): string {
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

interface RaceRecordDetailScreenProps {
  record: RaceRecord;
  onBack: () => void;
}

export function RaceRecordDetailScreen({
  record,
  onBack,
}: RaceRecordDetailScreenProps) {
  const [selectedLapIndex, setSelectedLapIndex] = useState(0);
  const bestLapMs = minLapMetric(record.laps, (lap) => lap.lapTimeMs);
  const bestS1Ms = minLapMetric(record.laps, (lap) => lap.sector1Ms);
  const bestS2Ms = minLapMetric(record.laps, (lap) => lap.sector2Ms);
  const bestS3Ms = minLapMetric(record.laps, (lap) => lap.sector3Ms);

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
        <Text style={styles.title} numberOfLines={1}>
          {record.circuit}
        </Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.meta}>
          <Text style={styles.sessionTypeLabel}>
            Session type: <Text style={styles.sessionType}>{record.sessionType}</Text>
          </Text>
          <Text style={styles.date}>{formatRaceDate(record.date)}</Text>
          <Text style={styles.lapCount}>
            {record.laps.length} lap{record.laps.length !== 1 ? "s" : ""}
          </Text>
        </View>

        {record.laps.length > 0 && (
          <>
            <View style={styles.lapsContainer}>
              {record.laps.map((lap: LapRecord, idx: number) => (
                <LapCard
                  key={`${record.id}-lap-${idx}`}
                  lap={lap}
                  bestLapMs={bestLapMs}
                  bestS1Ms={bestS1Ms}
                  bestS2Ms={bestS2Ms}
                  bestS3Ms={bestS3Ms}
                />
              ))}
            </View>
            <LapTelemetrySection
              laps={record.laps}
              selectedLapIndex={Math.min(selectedLapIndex, record.laps.length - 1)}
              onSelectLap={setSelectedLapIndex}
            />
          </>
        )}
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
  },
  backText: {
    fontSize: 17,
    color: "#007aff",
    fontWeight: "600",
  },
  title: {
    flex: 1,
    fontSize: 18,
    fontWeight: "700",
    color: "#1c1c1e",
    marginLeft: 8,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  meta: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#d1d1d6",
    padding: 14,
    marginBottom: 16,
  },
  sessionTypeLabel: {
    fontSize: 13,
    color: "#6e6e73",
    marginBottom: 4,
  },
  sessionType: {
    color: "#248a3d",
    fontWeight: "600",
  },
  date: {
    fontSize: 13,
    color: "#6e6e73",
    marginBottom: 4,
  },
  lapCount: {
    fontSize: 12,
    color: "#8e8e93",
  },
  lapsContainer: {
    marginBottom: 16,
  },
});
