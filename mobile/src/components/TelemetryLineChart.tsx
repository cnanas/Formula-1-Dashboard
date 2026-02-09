import React from "react";
import { View, Text, StyleSheet, Dimensions, ScrollView } from "react-native";
/** Shared shape for live or historical telemetry (hook + lap record). */
export interface TelemetryChartDataPoint {
  t: number;
  speed: number;
  brake: number;
  throttle: number;
}

const CHART_HEIGHT = 120;
const PADDING = { top: 8, right: 8, bottom: 20, left: 8 };
const LINE_EDGE = 4;
const LINE_WIDTH = 2;
const MAX_POINTS_COMPACT = 100;
const MAX_POINTS_SCROLLABLE = 1200;
const SMOOTH_RADIUS = 3; // moving average window = 2*radius+1

/** Smooth values with a centered moving average for a softer line. */
function smoothValues(values: number[], radius: number): number[] {
  if (values.length === 0 || radius <= 0) return values;
  const out: number[] = [];
  for (let i = 0; i < values.length; i++) {
    let sum = 0;
    let count = 0;
    for (let j = i - radius; j <= i + radius; j++) {
      if (j >= 0 && j < values.length) {
        sum += values[j];
        count++;
      }
    }
    out.push(count > 0 ? sum / count : values[i]);
  }
  return out;
}

export type TelemetryLineChartMetric = "speed" | "brake" | "throttle";

/** Sector boundaries as fraction of lap (0–1). Used to draw S1/S2/S3 bands. */
export interface ChartSectors {
  s1End: number;
  s2End: number;
}

interface TelemetryLineChartProps {
  data: TelemetryChartDataPoint[];
  metric: TelemetryLineChartMetric;
  title: string;
  max: number;
  unit: string;
  color: string;
  /** When set with contentWidth, chart is horizontally scrollable (e.g. full lap). */
  scrollable?: boolean;
  /** Chart content width when scrollable (e.g. 2px per point for full lap). */
  contentWidth?: number;
  /** Sector boundaries (fractions 0–1) to highlight S1, S2, S3. */
  sectors?: ChartSectors;
}

const SECTOR_COLORS = {
  s1: "rgba(34, 197, 94, 0.12)",
  s2: "rgba(234, 179, 8, 0.12)",
  s3: "rgba(255, 59, 48, 0.12)",
};

export function TelemetryLineChart({
  data,
  metric,
  title,
  max,
  unit,
  color,
  scrollable = false,
  contentWidth: contentWidthProp,
  sectors: sectorsProp,
}: TelemetryLineChartProps) {
  // Match screen content padding (24 each side) so chart aligns with gauges/grid
  const containerWidth = Dimensions.get("window").width - 48;
  const chartWidth =
    scrollable && contentWidthProp != null && contentWidthProp > containerWidth
      ? contentWidthProp
      : containerWidth;
  const innerWidth = chartWidth - PADDING.left - PADDING.right;
  const innerHeight = CHART_HEIGHT - PADDING.top - PADDING.bottom;
  const width = containerWidth;

  if (data.length < 2) {
    return (
      <View style={[styles.wrapper, { width }]}>
        <Text style={styles.title}>{title}</Text>
        <View style={[styles.placeholder, { height: CHART_HEIGHT }]}>
          <Text style={styles.placeholderText}>Collecting data…</Text>
        </View>
      </View>
    );
  }

  const rawValues = data.map((p) => p[metric]);
  const values = smoothValues(rawValues, SMOOTH_RADIUS);
  const valueMin = 0;
  const valueRange = Math.max(max - valueMin, 1);
  const n = data.length;
  const maxPoints = scrollable ? MAX_POINTS_SCROLLABLE : MAX_POINTS_COMPACT;
  const step = Math.max(1, Math.ceil(n / maxPoints));
  // Map index [0, n-1] to x so the line spans full width
  const xMin = PADDING.left + LINE_EDGE;
  const xMax = PADDING.left + innerWidth - LINE_EDGE;
  const xSpan = Math.max(xMax - xMin, 1);
  const points: { x: number; y: number }[] = [];
  for (let i = 0; i < n; i += step) {
    const v = values[i];
    const x = xMin + (i / Math.max(n - 1, 1)) * xSpan;
    const y =
      PADDING.top +
      innerHeight -
      ((v - valueMin) / valueRange) * innerHeight;
    points.push({ x, y });
  }
  const lastIdx = n - 1;
  if (lastIdx >= 0 && (points.length === 0 || points[points.length - 1].x < xMax - 1)) {
    points.push({
      x: xMax,
      y:
        PADDING.top +
        innerHeight -
        ((values[lastIdx] - valueMin) / valueRange) * innerHeight,
    });
  }

  // Line segments between consecutive points (no SVG - works without native module)
  const segments: { length: number; angle: number; left: number; top: number }[] = [];
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i];
    const b = points[i + 1];
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const length = Math.sqrt(dx * dx + dy * dy) || 1;
    const angleRad = Math.atan2(dy, dx);
    const angleDeg = (angleRad * 180) / Math.PI;
    segments.push({
      length,
      angle: angleDeg,
      left: (a.x + b.x) / 2 - length / 2,
      top: (a.y + b.y) / 2 - LINE_WIDTH / 2,
    });
  }

  const s1End = sectorsProp
    ? Math.max(0, Math.min(1, sectorsProp.s1End))
    : null;
  const s2End =
    sectorsProp != null
      ? Math.max(s1End ?? 0, Math.min(1, sectorsProp.s2End))
      : null;
  const hasSectors = s1End != null && s2End != null && s1End < s2End;

  const chartContent = (
    <View style={[styles.chart, { width: chartWidth, height: CHART_HEIGHT }]}>
      {hasSectors && (
        <>
          <View
            style={[
              styles.sectorBand,
              {
                left: PADDING.left,
                width: innerWidth * s1End,
                top: PADDING.top,
                height: innerHeight,
                backgroundColor: SECTOR_COLORS.s1,
              },
            ]}
          />
          <View
            style={[
              styles.sectorBand,
              {
                left: PADDING.left + innerWidth * s1End,
                width: innerWidth * (s2End - s1End),
                top: PADDING.top,
                height: innerHeight,
                backgroundColor: SECTOR_COLORS.s2,
              },
            ]}
          />
          <View
            style={[
              styles.sectorBand,
              {
                left: PADDING.left + innerWidth * s2End,
                width: innerWidth * (1 - s2End),
                top: PADDING.top,
                height: innerHeight,
                backgroundColor: SECTOR_COLORS.s3,
              },
            ]}
          />
        </>
      )}
      {segments.map((seg, i) => (
        <View
          key={`seg-${i}`}
          style={[
            styles.segment,
            {
              left: seg.left,
              top: seg.top,
              width: seg.length,
              height: LINE_WIDTH,
              backgroundColor: color,
              transform: [{ rotate: `${seg.angle}deg` }],
            },
          ]}
        />
      ))}
    </View>
  );

  const showScroll =
    scrollable && contentWidthProp != null && contentWidthProp > containerWidth;

  return (
    <View style={[styles.wrapper, { width }]}>
      <Text style={styles.title}>{title}</Text>
      {showScroll ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={true}
          style={[styles.chartScroll, { width, height: CHART_HEIGHT }]}
          contentContainerStyle={{ width: chartWidth }}
        >
          {chartContent}
        </ScrollView>
      ) : (
        chartContent
      )}
      <View style={styles.labels}>
        <Text style={styles.label}>0 {unit}</Text>
        <Text style={styles.label}>{max} {unit}</Text>
      </View>
      {hasSectors && (
        <View style={styles.sectorLegend}>
          <View style={styles.sectorLegendItem}>
            <View style={[styles.sectorLegendDot, { backgroundColor: "rgba(34, 197, 94, 0.5)" }]} />
            <Text style={styles.sectorLegendText}>S1</Text>
          </View>
          <View style={styles.sectorLegendItem}>
            <View style={[styles.sectorLegendDot, { backgroundColor: "rgba(234, 179, 8, 0.5)" }]} />
            <Text style={styles.sectorLegendText}>S2</Text>
          </View>
          <View style={styles.sectorLegendItem}>
            <View style={[styles.sectorLegendDot, { backgroundColor: "rgba(239, 68, 68, 0.5)" }]} />
            <Text style={styles.sectorLegendText}>S3</Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginTop: 20,
    width: "100%",
  },
  title: {
    fontSize: 14,
    fontWeight: "600",
    color: "#3a3a3c",
    marginBottom: 6,
  },
  chart: {
    position: "relative",
    backgroundColor: "#ffffff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#d1d1d6",
    overflow: "hidden",
  },
  sectorBand: {
    position: "absolute",
  },
  chartScroll: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#d1d1d6",
  },
  segment: {
    position: "absolute",
  },
  placeholder: {
    backgroundColor: "#ffffff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#d1d1d6",
    alignItems: "center",
    justifyContent: "center",
  },
  placeholderText: {
    fontSize: 12,
    color: "#8e8e93",
  },
  labels: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: PADDING.left,
    marginTop: 4,
  },
  label: {
    fontSize: 10,
    color: "#8e8e93",
  },
  sectorLegend: {
    flexDirection: "row",
    gap: 12,
    marginTop: 6,
    paddingHorizontal: PADDING.left,
  },
  sectorLegendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  sectorLegendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  sectorLegendText: {
    fontSize: 10,
    color: "#8e8e93",
    fontWeight: "600",
  },
});
