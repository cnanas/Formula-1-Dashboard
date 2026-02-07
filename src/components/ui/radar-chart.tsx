"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { cn } from "@/lib/utils";
import { useCircuitTheme } from "@/providers/circuit-theme-provider";

interface RadarDataPoint {
  label: string;
  value: number; // 0-100
}

interface RadarChartProps {
  data: RadarDataPoint[];
  size?: number;
  className?: string;
  color?: string;
  showLabels?: boolean;
  showValues?: boolean;
  animated?: boolean;
  levels?: number;
}

export function RadarChart({
  data,
  size = 200,
  className,
  color,
  showLabels = true,
  showValues = false,
  animated = true,
  levels = 5,
}: RadarChartProps) {
  const ref = useRef<SVGSVGElement>(null);
  const isInView = useInView(ref, { once: true });
  const { theme } = useCircuitTheme();

  const chartColor = color || theme.primaryColor;
  const center = size / 2;
  const radius = (size - 60) / 2; // Leave room for labels

  const angleStep = (2 * Math.PI) / data.length;

  // Generate points for the data polygon
  const dataPoints = data.map((point, index) => {
    const angle = index * angleStep - Math.PI / 2; // Start from top
    const r = (point.value / 100) * radius;
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle),
      label: point.label,
      value: point.value,
      angle,
    };
  });

  const dataPath = dataPoints
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
    .join(" ") + " Z";

  // Generate level rings
  const levelRings = Array.from({ length: levels }, (_, i) => {
    const levelRadius = ((i + 1) / levels) * radius;
    return data
      .map((_, index) => {
        const angle = index * angleStep - Math.PI / 2;
        return {
          x: center + levelRadius * Math.cos(angle),
          y: center + levelRadius * Math.sin(angle),
        };
      })
      .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
      .join(" ") + " Z";
  });

  // Generate axis lines
  const axisLines = data.map((_, index) => {
    const angle = index * angleStep - Math.PI / 2;
    return {
      x1: center,
      y1: center,
      x2: center + radius * Math.cos(angle),
      y2: center + radius * Math.sin(angle),
    };
  });

  // Label positions
  const labelPositions = data.map((point, index) => {
    const angle = index * angleStep - Math.PI / 2;
    const labelRadius = radius + 25;
    return {
      x: center + labelRadius * Math.cos(angle),
      y: center + labelRadius * Math.sin(angle),
      label: point.label,
      value: point.value,
      anchor: (Math.abs(Math.cos(angle)) < 0.1
        ? "middle"
        : Math.cos(angle) > 0
        ? "start"
        : "end") as "middle" | "start" | "end",
    };
  });

  return (
    <svg ref={ref} width={size} height={size} className={cn("overflow-visible", className)}>
      {/* Level rings */}
      {levelRings.map((path, index) => (
        <path
          key={`level-${index}`}
          d={path}
          fill="none"
          stroke="currentColor"
          strokeOpacity={0.1}
          strokeWidth={1}
        />
      ))}

      {/* Axis lines */}
      {axisLines.map((line, index) => (
        <line
          key={`axis-${index}`}
          x1={line.x1}
          y1={line.y1}
          x2={line.x2}
          y2={line.y2}
          stroke="currentColor"
          strokeOpacity={0.2}
          strokeWidth={1}
        />
      ))}

      {/* Data area fill */}
      <motion.path
        d={dataPath}
        fill={chartColor}
        fillOpacity={0.2}
        initial={animated ? { opacity: 0 } : undefined}
        animate={isInView ? { opacity: 1 } : undefined}
        transition={{ duration: 0.5, delay: 0.5 }}
      />

      {/* Data line */}
      <motion.path
        d={dataPath}
        fill="none"
        stroke={chartColor}
        strokeWidth={2}
        strokeLinejoin="round"
        initial={animated ? { pathLength: 0, opacity: 0 } : undefined}
        animate={isInView ? { pathLength: 1, opacity: 1 } : undefined}
        transition={{ duration: 1, ease: "easeOut" }}
      />

      {/* Data points */}
      {dataPoints.map((point, index) => (
        <motion.circle
          key={`point-${index}`}
          cx={point.x}
          cy={point.y}
          r={4}
          fill={chartColor}
          initial={animated ? { scale: 0 } : undefined}
          animate={isInView ? { scale: 1 } : undefined}
          transition={{ duration: 0.3, delay: 0.8 + index * 0.05 }}
        />
      ))}

      {/* Labels */}
      {showLabels &&
        labelPositions.map((pos, index) => (
          <motion.text
            key={`label-${index}`}
            x={pos.x}
            y={pos.y}
            textAnchor={pos.anchor}
            dominantBaseline="middle"
            className="text-xs fill-muted-foreground"
            initial={animated ? { opacity: 0 } : undefined}
            animate={isInView ? { opacity: 1 } : undefined}
            transition={{ duration: 0.3, delay: 1 + index * 0.05 }}
          >
            {pos.label}
            {showValues && (
              <tspan className="font-medium fill-foreground"> ({pos.value})</tspan>
            )}
          </motion.text>
        ))}
    </svg>
  );
}

// Comparison radar chart with two datasets
export function ComparisonRadarChart({
  data1,
  data2,
  labels,
  label1,
  label2,
  color1,
  color2,
  size = 250,
  className,
}: {
  data1: number[]; // values 0-100
  data2: number[]; // values 0-100
  labels: string[];
  label1?: string;
  label2?: string;
  color1?: string;
  color2?: string;
  size?: number;
  className?: string;
}) {
  const ref = useRef<SVGSVGElement>(null);
  const isInView = useInView(ref, { once: true });
  const { theme } = useCircuitTheme();

  const chartColor1 = color1 || theme.primaryColor;
  const chartColor2 = color2 || theme.secondaryColor;
  const center = size / 2;
  const radius = (size - 80) / 2;
  const levels = 5;

  const angleStep = (2 * Math.PI) / labels.length;

  const generatePath = (data: number[]) => {
    return data
      .map((value, index) => {
        const angle = index * angleStep - Math.PI / 2;
        const r = (value / 100) * radius;
        const x = center + r * Math.cos(angle);
        const y = center + r * Math.sin(angle);
        return `${index === 0 ? "M" : "L"} ${x} ${y}`;
      })
      .join(" ") + " Z";
  };

  const path1 = generatePath(data1);
  const path2 = generatePath(data2);

  // Level rings
  const levelRings = Array.from({ length: levels }, (_, i) => {
    const levelRadius = ((i + 1) / levels) * radius;
    return labels
      .map((_, index) => {
        const angle = index * angleStep - Math.PI / 2;
        return {
          x: center + levelRadius * Math.cos(angle),
          y: center + levelRadius * Math.sin(angle),
        };
      })
      .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
      .join(" ") + " Z";
  });

  // Label positions
  const labelPositions = labels.map((label, index) => {
    const angle = index * angleStep - Math.PI / 2;
    const labelRadius = radius + 30;
    return {
      x: center + labelRadius * Math.cos(angle),
      y: center + labelRadius * Math.sin(angle),
      label,
      anchor: (Math.abs(Math.cos(angle)) < 0.1
        ? "middle"
        : Math.cos(angle) > 0
        ? "start"
        : "end") as "middle" | "start" | "end",
    };
  });

  return (
    <div className={cn("flex flex-col items-center gap-4", className)}>
      <svg ref={ref} width={size} height={size} className="overflow-visible">
        {/* Level rings */}
        {levelRings.map((path, index) => (
          <path
            key={`level-${index}`}
            d={path}
            fill="none"
            stroke="currentColor"
            strokeOpacity={0.1}
            strokeWidth={1}
          />
        ))}

        {/* Axis lines */}
        {labels.map((_, index) => {
          const angle = index * angleStep - Math.PI / 2;
          return (
            <line
              key={`axis-${index}`}
              x1={center}
              y1={center}
              x2={center + radius * Math.cos(angle)}
              y2={center + radius * Math.sin(angle)}
              stroke="currentColor"
              strokeOpacity={0.2}
              strokeWidth={1}
            />
          );
        })}

        {/* Data 1 area */}
        <motion.path
          d={path1}
          fill={chartColor1}
          fillOpacity={0.15}
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : undefined}
          transition={{ duration: 0.5, delay: 0.3 }}
        />
        <motion.path
          d={path1}
          fill="none"
          stroke={chartColor1}
          strokeWidth={2}
          initial={{ pathLength: 0 }}
          animate={isInView ? { pathLength: 1 } : undefined}
          transition={{ duration: 1 }}
        />

        {/* Data 2 area */}
        <motion.path
          d={path2}
          fill={chartColor2}
          fillOpacity={0.15}
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : undefined}
          transition={{ duration: 0.5, delay: 0.5 }}
        />
        <motion.path
          d={path2}
          fill="none"
          stroke={chartColor2}
          strokeWidth={2}
          strokeDasharray="6 3"
          initial={{ pathLength: 0 }}
          animate={isInView ? { pathLength: 1 } : undefined}
          transition={{ duration: 1, delay: 0.2 }}
        />

        {/* Labels */}
        {labelPositions.map((pos, index) => (
          <text
            key={`label-${index}`}
            x={pos.x}
            y={pos.y}
            textAnchor={pos.anchor}
            dominantBaseline="middle"
            className="text-xs fill-muted-foreground"
          >
            {pos.label}
          </text>
        ))}
      </svg>

      {/* Legend */}
      {(label1 || label2) && (
        <div className="flex gap-6 text-sm">
          {label1 && (
            <span className="flex items-center gap-2">
              <span
                className="h-3 w-6 rounded"
                style={{ backgroundColor: chartColor1 }}
              />
              {label1}
            </span>
          )}
          {label2 && (
            <span className="flex items-center gap-2">
              <span
                className="h-3 w-6 rounded"
                style={{
                  backgroundColor: chartColor2,
                  backgroundImage: `repeating-linear-gradient(90deg, ${chartColor2}, ${chartColor2} 6px, transparent 6px, transparent 9px)`,
                }}
              />
              {label2}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
