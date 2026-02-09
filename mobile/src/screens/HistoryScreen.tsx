import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  PanResponder,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { CircuitCard, type CircuitCardData } from "../components/CircuitCard";
import { CircuitHistoryDetailScreen, type CircuitHistoryData } from "./CircuitHistoryDetailScreen";
import type { RaceRecord } from "../lib/types";

const SWIPE_DELETE_WIDTH = 80;
const SWIPE_THRESHOLD = 40;

function SwipeableCircuitRow({
  children,
  onDelete,
  disabled,
}: {
  children: React.ReactNode;
  onDelete: () => void;
  disabled?: boolean;
}) {
  const [translateX, setTranslateX] = useState(0);
  const translateXRef = useRef(0);

  const animateTo = useCallback((target: number) => {
    const start = translateXRef.current;
    const startTime = Date.now();
    const duration = 200;
    const run = () => {
      const elapsed = Date.now() - startTime;
      const t = Math.min(1, elapsed / duration);
      const eased = 1 - (1 - t) ** 3;
      const value = Math.round(start + (target - start) * eased);
      translateXRef.current = value;
      setTranslateX(value);
      if (t < 1) requestAnimationFrame(run);
    };
    requestAnimationFrame(run);
  }, []);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 10,
      onPanResponderMove: (_, g) => {
        if (disabled) return;
        const dx = g.dx;
        if (dx <= 0) {
          const v = Math.max(-SWIPE_DELETE_WIDTH, dx);
          translateXRef.current = v;
          setTranslateX(v);
        }
      },
      onPanResponderRelease: (_, g) => {
        if (disabled) return;
        const dx = g.dx;
        const vx = g.vx;
        const shouldOpen = dx < -SWIPE_THRESHOLD || (dx < 0 && vx < -0.3);
        animateTo(shouldOpen ? -SWIPE_DELETE_WIDTH : 0);
      },
    })
  ).current;

  const handleDelete = () => {
    onDelete();
  };

  return (
    <View style={styles.swipeRow} {...(disabled ? {} : panResponder.panHandlers)}>
      <View style={styles.swipeDeleteWrap}>
        <TouchableOpacity
          style={styles.swipeDeleteBtn}
          onPress={handleDelete}
          activeOpacity={0.8}
        >
          <Ionicons name="trash-outline" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
      <View
        style={[
          styles.swipeCardWrap,
          { transform: [{ translateX }] },
        ]}
      >
        {children}
      </View>
    </View>
  );
}

function aggregateByCircuit(raceRecords: RaceRecord[]): CircuitHistoryData[] {
  const byCircuit = new Map<string, RaceRecord[]>();
  for (const record of raceRecords) {
    if (record.laps.length === 0) continue;
    const key = record.circuit;
    const existing = byCircuit.get(key) ?? [];
    existing.push(record);
    byCircuit.set(key, existing);
  }

  const result: CircuitHistoryData[] = [];
  for (const [circuit, sessions] of byCircuit) {
    const allLaps = sessions.flatMap((s) => s.laps);
    let bestLapMs: number | null = null;
    for (const lap of allLaps) {
      const t = lap.lapTimeMs;
      if (t != null && t > 0 && Number.isFinite(t)) {
        if (bestLapMs == null || t < bestLapMs) bestLapMs = t;
      }
    }
    const dates = sessions.map((s) => s.date).filter(Boolean);
    const lastRanDate = dates.length > 0
      ? dates.reduce((a, b) => (a > b ? a : b))
      : "";
    result.push({
      circuit,
      sessions: sessions.sort((a, b) => (b.date > a.date ? 1 : -1)),
      lastRanDate,
      bestLapMs,
      totalLaps: allLaps.length,
    });
  }
  return result.sort((a, b) => (b.lastRanDate > a.lastRanDate ? 1 : -1));
}

interface HistoryScreenProps {
  raceRecords: RaceRecord[];
  onClearHistory?: () => Promise<void> | void;
  onDeleteCircuit?: (circuitName: string) => void;
  onRefreshIp?: () => Promise<void> | void;
}

export function HistoryScreen({
  raceRecords = [],
  onClearHistory,
  onDeleteCircuit,
  onRefreshIp,
}: HistoryScreenProps) {
  const [selectedCircuit, setSelectedCircuit] = useState<CircuitHistoryData | null>(null);
  const [clearingHistory, setClearingHistory] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const circuitHistories = useMemo(
    () => aggregateByCircuit(raceRecords),
    [raceRecords]
  );
  const hasHistory = circuitHistories.length > 0;

  const handleRefresh = async () => {
    setRefreshing(true);
    await onRefreshIp?.();
    setRefreshing(false);
  };

  const handleClearHistory = () => {
    if (!onClearHistory || clearingHistory || !hasHistory) return;
    Alert.alert(
      "Delete all history?",
      "This will permanently remove all saved sessions and lap data from this device.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            setClearingHistory(true);
            setSelectedCircuit(null);
            Promise.resolve(onClearHistory()).finally(() => {
              setClearingHistory(false);
            });
          },
        },
      ]
    );
  };

  if (selectedCircuit != null) {
    return (
      <CircuitHistoryDetailScreen
        data={selectedCircuit}
        onBack={() => setSelectedCircuit(null)}
      />
    );
  }

  const cardData: CircuitCardData[] = circuitHistories.map((ch) => ({
    circuit: ch.circuit,
    lastRanDate: ch.lastRanDate,
    bestLapMs: ch.bestLapMs,
    totalLaps: ch.totalLaps,
  }));

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>History</Text>
        <Text style={styles.subtitle}>
          {hasHistory
            ? `${circuitHistories.length} circuit${circuitHistories.length !== 1 ? "s" : ""} driven`
            : "Your past sessions will appear here"}
        </Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          !hasHistory && styles.contentCentered,
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          onRefreshIp ? (
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor="#8e8e93"
            />
          ) : undefined
        }
      >
        {!hasHistory ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconWrap}>
              <Ionicons name="time-outline" size={48} color="#c7c7cc" />
            </View>
            <Text style={styles.emptyTitle}>No circuits yet</Text>
            <Text style={styles.emptyText}>
              Connect to F1 and complete laps during a session. Your laps will be
              saved automatically and grouped by circuit here.
            </Text>
          </View>
        ) : (
          <>
            {cardData.map((data, idx) => {
              const card = (
                <CircuitCard
                  key={`${data.circuit}-${idx}`}
                  data={data}
                  onPress={() => setSelectedCircuit(circuitHistories[idx])}
                  noMargin={!!onDeleteCircuit}
                />
              );
              return onDeleteCircuit ? (
                <SwipeableCircuitRow
                  key={`${data.circuit}-${idx}`}
                  onDelete={() => {
                    Alert.alert(
                      "Delete circuit history?",
                      `Remove all saved sessions and laps for ${data.circuit}?`,
                      [
                        { text: "Cancel", style: "cancel" },
                        {
                          text: "Delete",
                          style: "destructive",
                          onPress: () => onDeleteCircuit(data.circuit),
                        },
                      ]
                    );
                  }}
                  disabled={clearingHistory}
                >
                  {card}
                </SwipeableCircuitRow>
              ) : (
                card
              );
            })}
            {onClearHistory && (
              <TouchableOpacity
                style={[
                  styles.clearBtn,
                  clearingHistory && styles.clearBtnDisabled,
                ]}
                onPress={handleClearHistory}
                disabled={clearingHistory}
                activeOpacity={0.8}
              >
                <Ionicons name="trash-outline" size={16} color="#ff3b30" />
                <Text style={styles.clearBtnText}>
                  {clearingHistory ? "Deleting…" : "Delete all history"}
                </Text>
              </TouchableOpacity>
            )}
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
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: "#ffffff",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#d1d1d6",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1c1c1e",
  },
  subtitle: {
    fontSize: 15,
    color: "#8e8e93",
    marginTop: 4,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  contentCentered: {
    flexGrow: 1,
    justifyContent: "center",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 48,
  },
  emptyIconWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: "#f2f2f7",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#1c1c1e",
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 15,
    color: "#8e8e93",
    textAlign: "center",
    lineHeight: 22,
    maxWidth: 280,
  },
  clearBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 24,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: "#ff3b30",
    borderRadius: 10,
    backgroundColor: "rgba(255, 59, 48, 0.08)",
    alignSelf: "center",
  },
  clearBtnDisabled: {
    opacity: 0.6,
  },
  clearBtnText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#ff3b30",
  },
  swipeRow: {
    marginBottom: 10,
    overflow: "hidden",
    borderRadius: 12,
  },
  swipeDeleteWrap: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    width: SWIPE_DELETE_WIDTH,
    justifyContent: "center",
    alignItems: "center",
  },
  swipeDeleteBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#ff3b30",
    justifyContent: "center",
    alignItems: "center",
  },
  swipeCardWrap: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
  },
});
