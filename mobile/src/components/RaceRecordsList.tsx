import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import type { RaceRecord } from "../lib/types";

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

interface RaceRecordsListProps {
  raceRecords: RaceRecord[];
  title?: string;
  maxHeight?: number;
  /** When true, render cards without inner ScrollView (for embedding in parent ScrollView). */
  embedded?: boolean;
  onRecordPress?: (record: RaceRecord) => void;
}

export function RaceRecordsList({
  raceRecords,
  title = "Race records",
  maxHeight = 280,
  embedded = false,
  onRecordPress,
}: RaceRecordsListProps) {
  if (raceRecords.length === 0) return null;

  const cards = [...raceRecords].reverse().map((record, index) => {
    const cardKey = `${record.id}-${record.date}-${index}`;
    return (
      <TouchableOpacity
        key={cardKey}
        style={styles.card}
        onPress={() => onRecordPress?.(record)}
        activeOpacity={0.7}
      >
        <View style={styles.header}>
          <View style={styles.meta}>
            <Text style={styles.circuit}>{record.circuit}</Text>
            <Text style={styles.sessionTypeLabel}>
              Session type: <Text style={styles.sessionType}>{record.sessionType}</Text>
            </Text>
            <Text style={styles.date}>
              {formatRaceDate(record.date)}
            </Text>
          </View>
          <Text style={styles.lapCount}>
            {record.laps.length} lap{record.laps.length !== 1 ? "s" : ""}
          </Text>
          <Text style={styles.toggle}>›</Text>
        </View>
      </TouchableOpacity>
    );
  });

  return (
    <View style={[styles.section, embedded && styles.sectionEmbedded]}>
      <Text style={styles.title}>{title}</Text>
      {embedded ? (
        <View style={styles.content}>{cards}</View>
      ) : (
        <ScrollView
          style={[styles.scroll, { maxHeight }]}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {cards}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: 24,
    borderTopWidth: 1,
    borderTopColor: "#d1d1d6",
    paddingTop: 16,
  },
  sectionEmbedded: {
    marginTop: 0,
    borderTopWidth: 0,
    paddingTop: 0,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1c1c1e",
    marginBottom: 12,
  },
  scroll: {},
  content: {
    paddingBottom: 16,
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#d1d1d6",
    marginBottom: 12,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
  },
  meta: {
    flex: 1,
  },
  circuit: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1c1c1e",
  },
  sessionTypeLabel: {
    fontSize: 13,
    color: "#6e6e73",
    marginTop: 2,
  },
  sessionType: {
    color: "#248a3d",
  },
  date: {
    fontSize: 12,
    color: "#8e8e93",
    marginTop: 2,
  },
  lapCount: {
    fontSize: 12,
    color: "#6e6e73",
    marginRight: 8,
  },
  toggle: {
    fontSize: 12,
    color: "#6e6e73",
  },
});
