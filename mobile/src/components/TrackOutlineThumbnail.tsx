import React from "react";
import { View, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Svg, { Path } from "react-native-svg";
import { getTrackPathD } from "../lib/track-layouts";

const VIEWBOX = "0 0 500 500";

interface TrackOutlineThumbnailProps {
  circuitName: string;
  size?: number;
  strokeColor?: string;
  strokeWidth?: number;
}

export function TrackOutlineThumbnail({
  circuitName,
  size = 56,
  strokeColor = "#A91D3A",
  strokeWidth = 12,
}: TrackOutlineThumbnailProps) {
  const pathD = circuitName ? getTrackPathD(circuitName) : null;

  if (!pathD) {
    return (
      <View style={[styles.placeholder, { width: size, height: size }]}>
        <Ionicons name="flag-outline" size={size * 0.4} color="#c7c7cc" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg
        viewBox={VIEWBOX}
        width={size}
        height={size}
        preserveAspectRatio="xMidYMid meet"
      >
        <Path
          d={pathD}
          fill="none"
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeLinejoin="round"
          strokeOpacity={0.9}
        />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: "hidden",
    borderRadius: 8,
    backgroundColor: "transparent",
  },
  placeholder: {
    borderRadius: 8,
    backgroundColor: "transparent",
  },
});
