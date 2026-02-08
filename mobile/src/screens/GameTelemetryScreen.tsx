import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import type { GameTelemetry } from "../lib/types";

interface GameTelemetryScreenProps {
  data: GameTelemetry | null;
  connected: boolean;
  localIp: string | null;
  onBackToSetup?: () => void;
}

export function GameTelemetryScreen({
  data,
  connected,
  localIp,
  onBackToSetup,
}: GameTelemetryScreenProps) {
  if (!connected || !data) {
    return (
      <View style={styles.container}>
        <View style={styles.waiting}>
          <Text style={styles.waitingTitle}>Waiting for telemetry</Text>
          <Text style={styles.waitingText}>
            Configure your game to send telemetry to {localIp || "this device"}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.connectedBadge}>
          <View style={styles.connectedDot} />
          <Text style={styles.connectedText}>Connected</Text>
        </View>
        {onBackToSetup && (
          <TouchableOpacity onPress={onBackToSetup} style={styles.backBtn}>
            <Text style={styles.backBtnText}>Setup</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.grid}>
        <TelemetryGauge
          label="Speed"
          value={data.speed}
          max={370}
          unit="km/h"
          color="#3b82f6"
        />
        <TelemetryGauge
          label="RPM"
          value={data.rpm}
          max={15000}
          unit=""
          color="#f59e0b"
        />
        <TelemetryBar
          label="Throttle"
          value={data.throttle}
          max={100}
          color="#22c55e"
        />
        <TelemetryBar label="Brake" value={data.brake} max={100} color="#ef4444" />
        <View style={styles.gearBox}>
          <Text style={styles.gearLabel}>Gear</Text>
          <Text style={styles.gearValue}>
            {data.n_gear === 0 ? "N" : data.n_gear}
          </Text>
        </View>
        <View style={styles.drsBox}>
          <Text style={styles.drsLabel}>DRS</Text>
          <View
            style={[
              styles.drsBadge,
              data.drs >= 10 ? styles.drsOpen : styles.drsOff,
            ]}
          >
            <Text
              style={[
                styles.drsText,
                data.drs >= 10 ? styles.drsTextOpen : styles.drsTextOff,
              ]}
            >
              {data.drs >= 10 ? "OPEN" : "OFF"}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

function TelemetryGauge({
  label,
  value,
  max,
  unit,
  color,
}: {
  label: string;
  value: number;
  max: number;
  unit: string;
  color: string;
}) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <View style={styles.gauge}>
      <Text style={styles.gaugeLabel}>{label}</Text>
      <Text style={styles.gaugeValue}>
        {value}
        {unit ? (
          <Text style={styles.gaugeUnit}> {unit}</Text>
        ) : null}
      </Text>
      <View style={styles.progressTrack}>
        <View
          style={[styles.progressFill, { width: `${pct}%`, backgroundColor: color }]}
        />
      </View>
    </View>
  );
}

function TelemetryBar({
  label,
  value,
  max,
  color,
}: {
  label: string;
  value: number;
  max: number;
  color: string;
}) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <View style={styles.bar}>
      <View style={styles.barHeader}>
        <Text style={styles.barLabel}>{label}</Text>
        <Text style={styles.barValue}>{Math.round(value)}%</Text>
      </View>
      <View style={styles.progressTrack}>
        <View
          style={[styles.progressFill, { width: `${pct}%`, backgroundColor: color }]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0a0a0a",
    padding: 24,
  },
  waiting: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  waitingTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#a1a1aa",
    marginBottom: 8,
  },
  waitingText: {
    fontSize: 14,
    color: "#71717a",
    textAlign: "center",
    paddingHorizontal: 32,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  connectedBadge: {
    flexDirection: "row",
    alignItems: "center",
  },
  backBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  backBtnText: {
    fontSize: 14,
    color: "#71717a",
  },
  connectedDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#22c55e",
    marginRight: 8,
  },
  connectedText: {
    fontSize: 14,
    color: "#22c55e",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  gauge: {
    width: "47%",
    marginBottom: 4,
  },
  gaugeLabel: {
    fontSize: 12,
    color: "#71717a",
    marginBottom: 4,
  },
  gaugeValue: {
    fontSize: 24,
    fontWeight: "700",
    color: "#fff",
    fontFamily: "monospace",
  },
  gaugeUnit: {
    fontSize: 14,
    color: "#71717a",
    fontWeight: "400",
  },
  progressTrack: {
    height: 6,
    backgroundColor: "#27272a",
    borderRadius: 3,
    marginTop: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
  },
  bar: {
    width: "47%",
    marginBottom: 4,
  },
  barHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  barLabel: {
    fontSize: 12,
    color: "#71717a",
  },
  barValue: {
    fontSize: 12,
    color: "#a1a1aa",
    fontFamily: "monospace",
  },
  gearBox: {
    width: "47%",
    alignItems: "center",
  },
  gearLabel: {
    fontSize: 12,
    color: "#71717a",
    marginBottom: 4,
  },
  gearValue: {
    fontSize: 40,
    fontWeight: "700",
    color: "#fff",
    fontFamily: "monospace",
  },
  drsBox: {
    width: "47%",
    alignItems: "center",
  },
  drsLabel: {
    fontSize: 12,
    color: "#71717a",
    marginBottom: 4,
  },
  drsBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  drsOpen: {
    backgroundColor: "#22c55e",
  },
  drsOff: {
    backgroundColor: "#27272a",
  },
  drsText: {
    fontSize: 16,
    fontWeight: "600",
    fontFamily: "monospace",
  },
  drsTextOpen: {
    color: "#fff",
  },
  drsTextOff: {
    color: "#71717a",
  },
});
