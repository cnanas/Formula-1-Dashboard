import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  RefreshControl,
} from "react-native";
import { RaceRecordsList } from "../components/RaceRecordsList";
import { RaceRecordDetailScreen } from "./RaceRecordDetailScreen";
import type { RaceRecord } from "../lib/types";

interface SetupScreenProps {
  localIp: string | null;
  listening: boolean;
  error: string | null;
  connected?: boolean;
  raceRecords?: RaceRecord[];
  onRefreshIp: () => void;
  onClearHistory?: () => Promise<void> | void;
  onViewTelemetry?: () => void;
}

export function SetupScreen({
  localIp,
  listening,
  error,
  connected = false,
  raceRecords = [],
  onRefreshIp,
  onClearHistory,
  onViewTelemetry,
}: SetupScreenProps) {
  const [refreshing, setRefreshing] = React.useState(false);
  const [clearingHistory, setClearingHistory] = React.useState(false);
  const [selectedRaceRecord, setSelectedRaceRecord] = React.useState<RaceRecord | null>(null);
  const showBackToTelemetry = connected && onViewTelemetry != null;
  const raceRecordsWithLaps = raceRecords.filter(
    (record) => record.laps.length > 0
  );
  const hasHistory = raceRecordsWithLaps.length > 0;

  const handleCopyIp = () => {
    if (localIp) {
      // Clipboard API is not in RN core - we'd need @react-native-clipboard/clipboard
      // For now show alert
      Alert.alert("IP Address", `Copy this: ${localIp}\n\n${localIp}`, [
        { text: "OK" },
      ]);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await onRefreshIp();
    setRefreshing(false);
  };

  const handleClearHistory = () => {
    if (!onClearHistory || clearingHistory || !hasHistory) return;
    Alert.alert(
      "Delete historical records?",
      "This will remove all saved sessions and lap telemetry from this device.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            setClearingHistory(true);
            Promise.resolve(onClearHistory()).finally(() => {
              setClearingHistory(false);
            });
          },
        },
      ]
    );
  };

  if (selectedRaceRecord != null) {
    return (
      <RaceRecordDetailScreen
        record={selectedRaceRecord}
        onBack={() => setSelectedRaceRecord(null)}
      />
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    >
      <View style={styles.headerRow}>
        {showBackToTelemetry ? (
          <View style={styles.headerRowWithBack}>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={onViewTelemetry}
              activeOpacity={0.7}
            >
              <Text style={styles.backBtnText}>‹ Back</Text>
            </TouchableOpacity>
            <Text style={styles.title}>F1 Game Telemetry</Text>
            <View style={styles.backBtnPlaceholder} />
          </View>
        ) : (
          <Text style={styles.titleSolo}>F1 Game Telemetry</Text>
        )}
      </View>

      {error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <View style={styles.ipSection}>
        <Text style={styles.label}>Your phone's IP address</Text>
        <TouchableOpacity
          style={styles.ipBox}
          onPress={handleCopyIp}
          activeOpacity={0.7}
        >
          <Text style={styles.ipText}>
            {localIp || "Loading…"}
          </Text>
          {localIp && (
            <Text style={styles.tapHint}>Tap to copy</Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.statusRow}>
        <View
          style={[
            styles.statusDot,
            listening ? styles.statusDotActive : styles.statusDotInactive,
          ]}
        />
        <Text style={styles.statusText}>
          {listening
            ? "Listening on port 20777"
            : "Starting…"}
        </Text>
      </View>

      <View style={styles.instructions}>
        <Text style={styles.instructionsTitle}>Configure your F1 game</Text>
        <Text style={styles.instruction}>1. Ensure phone and game are on the same Wi‑Fi</Text>
        <Text style={styles.instruction}>2. In F1 game: Settings → Telemetry</Text>
        <Text style={styles.instruction}>3. Turn UDP Telemetry On</Text>
        <Text style={styles.instruction}>4. Set UDP IP to the address above</Text>
        <Text style={styles.instruction}>5. Set UDP Port to 20777</Text>
        <Text style={styles.instruction}>6. Set UDP Format to 2024 or 2025</Text>
        <Text style={styles.instruction}>7. Enter a session (Practice, Qualifying, or Race)</Text>
        {onClearHistory && (
          <TouchableOpacity
            style={[
              styles.clearHistoryBtn,
              (!hasHistory || clearingHistory) && styles.clearHistoryBtnDisabled,
            ]}
            onPress={handleClearHistory}
            disabled={!hasHistory || clearingHistory}
            activeOpacity={0.8}
          >
            <Text style={styles.clearHistoryBtnText}>
              {clearingHistory ? "Deleting…" : "Delete historical records"}
            </Text>
          </TouchableOpacity>
        )}
        {connected && onViewTelemetry && (
          <TouchableOpacity
            style={styles.viewTelemetryBtn}
            onPress={onViewTelemetry}
          >
            <Text style={styles.viewTelemetryText}>View telemetry</Text>
          </TouchableOpacity>
        )}
      </View>

      {raceRecordsWithLaps.length > 0 && (
        <RaceRecordsList
          raceRecords={raceRecordsWithLaps}
          title="Past sessions"
          maxHeight={320}
          onRecordPress={(record) => setSelectedRaceRecord(record)}
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f2f2f7",
  },
  content: {
    padding: 24,
    paddingTop: 48,
    paddingBottom: 48,
  },
  headerRow: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  headerRowWithBack: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backBtn: {
    paddingVertical: 8,
    paddingHorizontal: 4,
    minWidth: 72,
  },
  backBtnText: {
    fontSize: 17,
    color: "#007aff",
    fontWeight: "600",
  },
  backBtnPlaceholder: {
    minWidth: 72,
  },
  title: {
    flex: 1,
    fontSize: 20,
    fontWeight: "700",
    color: "#1c1c1e",
    textAlign: "center",
  },
  titleSolo: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1c1c1e",
    textAlign: "center",
  },
  errorBox: {
    backgroundColor: "rgba(255, 59, 48, 0.12)",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: "#d70015",
    fontSize: 14,
  },
  ipSection: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    color: "#6e6e73",
    marginBottom: 8,
  },
  ipBox: {
    backgroundColor: "#ffffff",
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#d1d1d6",
  },
  ipText: {
    fontSize: 28,
    fontWeight: "700",
    color: "#007aff",
    fontFamily: "monospace",
  },
  tapHint: {
    fontSize: 12,
    color: "#8e8e93",
    marginTop: 4,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 32,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusDotActive: {
    backgroundColor: "#34c759",
  },
  statusDotInactive: {
    backgroundColor: "#8e8e93",
  },
  statusText: {
    fontSize: 14,
    color: "#6e6e73",
  },
  instructions: {
    backgroundColor: "#ffffff",
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#d1d1d6",
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1c1c1e",
    marginBottom: 16,
  },
  instruction: {
    fontSize: 14,
    color: "#3a3a3c",
    marginBottom: 8,
    lineHeight: 22,
  },
  viewTelemetryBtn: {
    marginTop: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: "#007aff",
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  viewTelemetryText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  clearHistoryBtn: {
    marginTop: 20,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ff3b30",
    backgroundColor: "rgba(255, 59, 48, 0.08)",
    alignSelf: "flex-start",
  },
  clearHistoryBtnDisabled: {
    borderColor: "#d1d1d6",
    backgroundColor: "#f2f2f7",
  },
  clearHistoryBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#d70015",
  },
});
