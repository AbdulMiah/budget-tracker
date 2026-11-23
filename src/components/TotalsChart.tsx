import { StyleSheet, Text, View } from "react-native";

import { useTheme } from "@/constants/theme";
import { useMoney } from "@/hooks/useMoney";

// Keeps a tiny total visible as a sliver rather than nothing.
const MIN_BAR = 4;

type Props = {
  income: number;
  spending: number;
  height?: number;
  /** Narrower bars, smaller text and whole pounds, for small preview cards. */
  compact?: boolean;
};

/** Two bars, income and spending, with each bar's label and total underneath. No axis. */
export function TotalsChart({
  income,
  spending,
  height = 160,
  compact = false,
}: Props) {
  const t = useTheme();
  const max = Math.max(income, spending, 1);
  const bars = [
    { label: "Income", value: income, color: t.income },
    { label: "Spending", value: spending, color: t.spend },
  ];
  return (
    <View style={styles.row}>
      {bars.map((b) => (
        <Bar
          key={b.label}
          {...b}
          height={b.value ? Math.max(MIN_BAR, (b.value / max) * height) : 0}
          plot={height}
          compact={compact}
        />
      ))}
    </View>
  );
}

type BarProps = {
  label: string;
  value: number;
  color: string;
  height: number;
  plot: number;
  compact: boolean;
};

function Bar({ label, value, color, height, plot, compact }: BarProps) {
  const t = useTheme();
  const { formatMoney, formatMoneyShort } = useMoney();
  const amount = compact ? formatMoneyShort(value) : formatMoney(value);
  return (
    <View
      style={[styles.column, compact && { paddingHorizontal: 2 }]}
      accessible
      accessibilityLabel={`${label} ${amount}`}
    >
      <View style={{ height: plot, justifyContent: "flex-end" }}>
        <View
          style={[
            styles.bar,
            { width: compact ? 32 : 64, height, backgroundColor: color },
            compact && { borderTopLeftRadius: 5, borderTopRightRadius: 5 },
          ]}
        />
      </View>
      <View style={[styles.baseline, { backgroundColor: t.border }]} />
      <View style={[styles.key, compact && { marginTop: 6 }]}>
        <View
          style={[
            styles.swatch,
            compact && styles.swatchSmall,
            { backgroundColor: color },
          ]}
        />
        <Text
          style={{ color: t.muted, fontSize: compact ? 11 : 13 }}
          numberOfLines={1}
        >
          {label}
        </Text>
      </View>
      <Text
        style={{
          color: t.text,
          fontSize: compact ? 13 : 17,
          fontWeight: "700",
          marginTop: 2,
        }}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {amount}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", justifyContent: "space-around" },
  column: { flex: 1, alignItems: "center", paddingHorizontal: 8 },
  bar: { borderTopLeftRadius: 8, borderTopRightRadius: 8 },
  baseline: { alignSelf: "stretch", height: StyleSheet.hairlineWidth },
  key: { flexDirection: "row", alignItems: "center", marginTop: 10 },
  swatch: { width: 10, height: 10, borderRadius: 5, marginRight: 6 },
  swatchSmall: { width: 8, height: 8, borderRadius: 4, marginRight: 4 },
});
