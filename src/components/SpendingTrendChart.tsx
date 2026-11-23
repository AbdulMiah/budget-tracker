import { differenceInCalendarDays, format } from "date-fns";
import { StyleSheet, Text, View } from "react-native";
import Svg, { Circle, Line, Path } from "react-native-svg";

import { useMoney } from "@/hooks/useMoney";
import { useTheme } from "@/hooks/useTheme";
import { DateRange } from "@/utils/spending-periods";

// Room around the plot so the line's stroke and end dot aren't clipped.
const PAD = 6;

type Props = {
  /** Daily spending for the selected period, up to today. */
  current: number[];
  /** Daily spending for the whole previous period. */
  previous: number[];
  /** The selected period in full, which may run past today. */
  fullRange: DateRange;
  /** "week", "month", etc., for "...than at this point last month". */
  periodNoun: string;
  width: number;
  height?: number;
  /** Small version for dashboard columns: shorter wording, thinner lines, no dates or key. */
  compact?: boolean;
};

const cumulative = (daily: number[]) => {
  let sum = 0;
  return daily.map((v) => (sum += v));
};

/**
 * Running total of spending through the selected period (solid) against the previous period
 * (dashed), lined up day by day from the start of each period.
 */
export function SpendingTrendChart({
  current,
  previous,
  fullRange,
  periodNoun,
  width,
  height,
  compact = false,
}: Props) {
  const t = useTheme();
  const { formatMoney } = useMoney();
  const cur = cumulative(current);
  const prev = cumulative(previous);
  const totalDays =
    differenceInCalendarDays(fullRange.end, fullRange.start) + 1;
  const slots = Math.max(totalDays, prev.length, 1);
  const max = Math.max(1, ...cur, ...prev);

  const chartHeight = height ?? (compact ? 70 : 150);
  const plotW = width - 2 * PAD;
  const plotH = chartHeight - 2 * PAD;
  const x = (i: number) =>
    PAD + (slots <= 1 ? plotW / 2 : (i / (slots - 1)) * plotW);
  const y = (v: number) => PAD + plotH - (v / max) * plotH;
  const path = (values: number[]) =>
    values
      .map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(v).toFixed(1)}`)
      .join(" ");

  const spent = cur.length ? cur[cur.length - 1] : 0;
  // Compare with the previous period at the same number of days in.
  const prevAtPoint = prev.length
    ? (prev[Math.min(cur.length, prev.length) - 1] ?? 0)
    : 0;
  const diff = spent - prevAtPoint;
  const previousName = compact
    ? `last ${periodNoun}`
    : `this point in the previous ${periodNoun}`;
  const comparison =
    prevAtPoint === 0 && spent === 0
      ? `Nothing spent in this or the previous ${periodNoun}`
      : diff === 0
        ? `Same as ${previousName}`
        : `${formatMoney(Math.abs(diff))} ${diff < 0 ? "less" : "more"} than ${previousName}`;

  const lastIndex = cur.length - 1;
  const area =
    cur.length > 1
      ? `${path(cur)} L${x(lastIndex).toFixed(1)},${PAD + plotH} L${x(0).toFixed(1)},${PAD + plotH} Z`
      : "";

  return (
    <View>
      <Text
        style={[
          styles.spent,
          compact && styles.spentCompact,
          { color: t.muted },
        ]}
      >
        Spent
      </Text>
      <Text
        style={[styles.big, compact && styles.bigCompact, { color: t.text }]}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {formatMoney(spent)}
      </Text>
      <Text
        style={[
          styles.comparison,
          compact && styles.comparisonCompact,
          { color: diff > 0 ? t.spend : diff < 0 ? t.income : t.muted },
        ]}
        numberOfLines={2}
      >
        {comparison}
      </Text>

      <Svg width={width} height={chartHeight}>
        <Line
          x1={PAD}
          x2={width - PAD}
          y1={PAD + plotH}
          y2={PAD + plotH}
          stroke={t.border}
          strokeWidth={1}
        />
        {prev.length > 0 && (
          <Path
            d={path(prev)}
            stroke={t.muted}
            strokeWidth={compact ? 1.5 : 2}
            strokeDasharray={compact ? "3 3" : "5 5"}
            fill="none"
            strokeLinejoin="round"
          />
        )}
        {area !== "" && <Path d={area} fill={t.spend} fillOpacity={0.1} />}
        {cur.length > 0 && (
          <Path
            d={path(cur)}
            stroke={t.spend}
            strokeWidth={compact ? 2 : 3}
            fill="none"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        )}
        {cur.length > 0 && (
          <Circle
            cx={x(lastIndex)}
            cy={y(spent)}
            r={compact ? 3.5 : 5}
            fill={t.spend}
            stroke={t.card}
            strokeWidth={2}
          />
        )}
      </Svg>
      {!compact && (
        <>
          <View style={styles.axis}>
            <Text style={[styles.axisLabel, { color: t.muted }]}>
              {format(fullRange.start, "d MMM")}
            </Text>
            <Text style={[styles.axisLabel, { color: t.muted }]}>
              {format(fullRange.end, "d MMM")}
            </Text>
          </View>
          <View style={styles.legend}>
            <Key color={t.spend} label="Selected" value={formatMoney(spent)} />
            <Key
              color={t.muted}
              dashed
              label={`Previous ${periodNoun}`}
              value={formatMoney(prev.length ? prev[prev.length - 1] : 0)}
            />
          </View>
        </>
      )}
    </View>
  );
}

function Key({
  color,
  label,
  value,
  dashed,
}: {
  color: string;
  label: string;
  value: string;
  dashed?: boolean;
}) {
  const t = useTheme();
  return (
    <View
      style={styles.keyItem}
      accessible
      accessibilityLabel={`${label} ${value}`}
    >
      <View style={styles.keyRow}>
        {dashed ? (
          <View style={styles.dashes}>
            <View style={[styles.dash, { backgroundColor: color }]} />
            <View style={[styles.dash, { backgroundColor: color }]} />
          </View>
        ) : (
          <View style={[styles.swatch, { backgroundColor: color }]} />
        )}
        <Text style={[styles.keyLabel, { color: t.muted }]} numberOfLines={1}>
          {label}
        </Text>
      </View>
      <Text
        style={[styles.keyValue, { color: t.text }]}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  spent: { fontSize: 13, textAlign: "center" },
  spentCompact: { fontSize: 11 },
  big: { fontSize: 30, fontWeight: "800", textAlign: "center", marginTop: 2 },
  bigCompact: { fontSize: 18 },
  comparison: {
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
    marginTop: 4,
    marginBottom: 12,
  },
  comparisonCompact: { fontSize: 11, marginTop: 2, marginBottom: 6 },
  axis: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: PAD,
    marginTop: 2,
  },
  axisLabel: { fontSize: 11 },
  legend: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 12,
  },
  keyItem: { flex: 1, alignItems: "center", paddingHorizontal: 8 },
  keyRow: { flexDirection: "row", alignItems: "center" },
  keyLabel: { fontSize: 13 },
  keyValue: { fontSize: 17, fontWeight: "700", marginTop: 2 },
  swatch: { width: 14, height: 3, borderRadius: 2, marginRight: 6 },
  dashes: { flexDirection: "row", marginRight: 6, gap: 2 },
  dash: { width: 6, height: 3, borderRadius: 1 },
});
