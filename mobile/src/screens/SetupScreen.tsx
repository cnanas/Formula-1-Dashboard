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

interface SetupScreenProps {
  localIp: string | null;
  listening: boolean;
  error: string | null;
  connected?: boolean;
  onRefreshIp: () => void;
  onViewTelemetry?: () => void;
}

export function SetupScreen({
  localIp,
  listening,
  error,
  connected = false,
  onRefreshIp,
  onViewTelemetry,
}: SetupScreenProps) {
  const [refreshing, setRefreshing] = React.useState(false);

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

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    >
      <Text style={styles.title}>F1 Game Telemetry</Text>

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
        {connected && onViewTelemetry && (
          <TouchableOpacity
            style={styles.viewTelemetryBtn}
            onPress={onViewTelemetry}
          >
            <Text style={styles.viewTelemetryText}>View telemetry</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0a0a0a",
  },
  content: {
    padding: 24,
    paddingBottom: 48,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 24,
    textAlign: "center",
  },
  errorBox: {
    backgroundColor: "rgba(239, 68, 68, 0.2)",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: "#ef4444",
    fontSize: 14,
  },
  ipSection: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    color: "#a1a1aa",
    marginBottom: 8,
  },
  ipBox: {
    backgroundColor: "#18181b",
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#27272a",
  },
  ipText: {
    fontSize: 28,
    fontWeight: "700",
    color: "#22c55e",
    fontFamily: "monospace",
  },
  tapHint: {
    fontSize: 12,
    color: "#71717a",
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
    backgroundColor: "#22c55e",
  },
  statusDotInactive: {
    backgroundColor: "#71717a",
  },
  statusText: {
    fontSize: 14,
    color: "#a1a1aa",
  },
  instructions: {
    backgroundColor: "#18181b",
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#27272a",
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 16,
  },
  instruction: {
    fontSize: 14,
    color: "#a1a1aa",
    marginBottom: 8,
    lineHeight: 22,
  },
  viewTelemetryBtn: {
    marginTop: 20,
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: "#22c55e",
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  viewTelemetryText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
});
