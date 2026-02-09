import React from "react";
import { Image, View, StyleSheet } from "react-native";
import { getCountryFlagCode } from "../lib/track-layouts";

const FLAG_BASE = "https://flagcdn.com";

interface CountryFlagProps {
  circuitName: string;
  size?: number;
}

export function CountryFlag({ circuitName, size = 24 }: CountryFlagProps) {
  const code = getCountryFlagCode(circuitName);
  if (!code) return null;

  const width = size;
  const height = Math.round(size * (18 / 24));

  return (
    <View style={[styles.wrap, { width, height }]}>
      <Image
        source={{ uri: `${FLAG_BASE}/${width}x${height}/${code}.png` }}
        style={styles.flag}
        resizeMode="cover"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    overflow: "hidden",
    borderRadius: 2,
  },
  flag: {
    width: "100%",
    height: "100%",
  },
});
