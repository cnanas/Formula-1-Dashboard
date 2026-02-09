import React, { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import Svg, { Path, Circle } from "react-native-svg";
import { getTrackPathD, parseTrackPath, getPointAtProgress } from "../lib/track-layouts";
import type { CarPosition } from "../hooks/useUdpTelemetry";

const VIEWBOX = "0 0 500 500";
const CAR_MARKER_R = 12;

interface CircuitTrackMapProps {
  /** Current circuit name from session (e.g. "Monza", "Melbourne"). */
  circuitName: string;
  /** Car position from lap data (progress 0–1, sector 0/1/2). */
  carPosition: CarPosition;
}

export function CircuitTrackMap({ circuitName, carPosition }: CircuitTrackMapProps) {
  const pathD = circuitName ? getTrackPathD(circuitName) : null;

  // Parse the SVG path once per circuit (cached via useMemo)
  const parsedTrack = useMemo(() => {
    if (!pathD) return null;
    return parseTrackPath(pathD);
  }, [pathD]);

  // Position dot on the actual SVG path
  const carPoint = parsedTrack
    ? getPointAtProgress(parsedTrack, carPosition.progress)
    : { x: 250, y: 250 };

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Circuit</Text>
      <View style={styles.mapContainer}>
        {pathD ? (
          <Svg
            viewBox={VIEWBOX}
            style={styles.svg}
            preserveAspectRatio="xMidYMid meet"
          >
            <Path
              d={pathD}
              fill="none"
              stroke="#007aff"
              strokeWidth={20}
              strokeLinejoin="round"
              strokeOpacity={1}
            />
            <Circle
              cx={carPoint.x}
              cy={carPoint.y}
              r={CAR_MARKER_R}
              fill="#34c759"
              stroke="#ffffff"
              strokeWidth={3}
            />
          </Svg>
        ) : (
          <View style={styles.placeholder}>
            <Text style={styles.placeholderText}>
              {circuitName || "—"}
            </Text>
            <Text style={styles.placeholderHint}>
              {circuitName
                ? "Track layout not available for this circuit."
                : "Connect to a session to see the circuit."}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: 20,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1c1c1e",
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  mapContainer: {
    height: 220,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#d1d1d6",
  },
  svg: {
    width: "100%",
    height: "100%",
  },
  placeholder: {
    flex: 1,
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  placeholderText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1c1c1e",
    marginBottom: 6,
  },
  placeholderHint: {
    fontSize: 12,
    color: "#8e8e93",
    textAlign: "center",
  },
});
