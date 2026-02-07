"use client";

/** Shared tooltip style for Recharts - use with contentStyle or in custom content. */
export const chartTooltipStyle: React.CSSProperties = {
  backgroundColor: "hsl(var(--popover))",
  border: "1px solid hsl(var(--border))",
  borderRadius: "var(--radius)",
  boxShadow: "0 4px 12px rgba(0,0,0,0.1), 0 0 0 1px rgba(0,0,0,0.05)",
  padding: "10px 14px",
  margin: 0,
  maxWidth: 320,
  fontSize: 13,
};

export interface TooltipPayloadEntry {
  name: string;
  value?: number | string;
  color?: string;
  dataKey: string;
  /** Raw data row from the chart (e.g. { race, fullName, ... }) */
  payload?: Record<string, unknown>;
}

/** Shared tooltip content for Recharts - consistent look and shadow. Use as <Tooltip content={(p) => <ChartTooltipContent {...p} />} /> */
export function ChartTooltipContent({
  active,
  payload: rawPayload,
  label,
  labelFormatter,
  formatter,
  labelClassName = "font-semibold text-foreground mb-1.5",
  itemClassName = "text-muted-foreground text-xs",
}: {
  active?: boolean;
  payload?: readonly TooltipPayloadEntry[] | readonly unknown[];
  label?: string | number;
  labelFormatter?: (label: unknown, payload: unknown[]) => React.ReactNode;
  formatter?: (value: unknown, name: string, item: TooltipPayloadEntry) => [React.ReactNode, React.ReactNode?];
  labelClassName?: string;
  itemClassName?: string;
}) {
  const payload = rawPayload as readonly TooltipPayloadEntry[] | undefined;
  if (!active || !payload?.length) return null;

  const displayLabel = labelFormatter
    ? labelFormatter(label ?? "", payload as unknown[])
    : label;

  return (
    <div style={chartTooltipStyle} className="chart-tooltip">
      {displayLabel != null && displayLabel !== "" && (
        <div className={labelClassName}>{displayLabel}</div>
      )}
      <div className="flex flex-col gap-1">
        {payload.map((entry) => {
          const [formattedValue, formattedName] = formatter
            ? formatter(entry.value, entry.name, entry)
            : [entry.value, entry.name];
          return (
            <div
              key={entry.dataKey}
              className="flex items-center justify-between gap-4"
            >
              <span
                className={itemClassName}
                style={{ color: entry.color ?? undefined }}
              >
                <span
                  className="inline-block w-2.5 h-2.5 rounded-full mr-1.5 align-middle"
                  style={{ backgroundColor: entry.color ?? "#888" }}
                />
                {formattedName ?? entry.name}
              </span>
              <span className="font-medium text-foreground tabular-nums">
                {formattedValue}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
