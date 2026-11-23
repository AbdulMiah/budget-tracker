import { StyleSheet, Text, View } from "react-native";

import { DonutRing } from "@/components/DonutRing";
import { CATEGORY_COLORS } from "@/constants";
import { Category } from "@/constants/types";
import { useMoney } from "@/hooks/useMoney";
import { useTheme } from "@/hooks/useTheme";

type Props = {
  /** Spending per category, largest first. */
  slices: { category: Category; amount: number }[];
  size?: number;
  /** Only list this many categories in the legend (the ring still shows them all). */
  legendLimit?: number;
  /** Small version for dashboard columns: thinner ring, one-column legend, smaller text. */
  compact?: boolean;
};

/** Donut of spending by category, with the total in the middle and each category's share below. */
export function CategoryPieChart({
  slices,
  size = 200,
  legendLimit,
  compact = false,
}: Props) {
  const t = useTheme();
  const { formatMoney } = useMoney();
  const total = slices.reduce((s, x) => s + x.amount, 0);
  const stroke = compact ? 14 : 26;

  return (
    <View>
      <View style={styles.ring}>
        <DonutRing
          segments={slices.map((x) => ({
            key: x.category,
            value: x.amount,
            color: CATEGORY_COLORS[x.category],
          }))}
          size={size}
          stroke={stroke}
        >
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
            style={[
              styles.total,
              compact && styles.totalCompact,
              { color: t.text, maxWidth: size - 2 * stroke - 12 },
            ]}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {formatMoney(total)}
          </Text>
        </DonutRing>
      </View>

      {slices.length === 0 ? (
        <Text style={[styles.empty, { color: t.muted }]}>
          Nothing spent in this period.
        </Text>
      ) : (
        <View style={[styles.legend, compact && styles.legendCompact]}>
          {slices.slice(0, legendLimit).map((s) => {
            const pct = Math.round((s.amount / total) * 100);
            return (
              <View
                key={s.category}
                style={[styles.legendItem, compact && styles.legendItemCompact]}
                accessible
                accessibilityLabel={`${s.category} ${pct}%`}
              >
                <View
                  style={[
                    styles.swatch,
                    compact && styles.swatchCompact,
                    { backgroundColor: CATEGORY_COLORS[s.category] },
                  ]}
                />
                <Text
                  style={[
                    styles.legendLabel,
                    compact && styles.legendTextCompact,
                    { color: t.text },
                  ]}
                  numberOfLines={1}
                >
                  {s.category}
                </Text>
                <Text
                  style={[
                    styles.legendPct,
                    compact && styles.legendTextCompact,
                    { color: t.muted },
                  ]}
                >
                  {pct < 1 ? "<1" : pct}%
                </Text>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  ring: { alignSelf: "center", marginTop: 4 },
  spent: { fontSize: 13 },
  spentCompact: { fontSize: 10 },
  total: { fontSize: 22, fontWeight: "800" },
  totalCompact: { fontSize: 14 },
  empty: { fontSize: 13, textAlign: "center", marginTop: 12 },
  legend: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginTop: 16,
    rowGap: 10,
  },
  legendItem: { width: "47%", flexDirection: "row", alignItems: "center" },
  legendItemCompact: { width: "100%" },
  legendLabel: { flex: 1, fontSize: 13 },
  legendPct: { fontSize: 13, fontWeight: "600" },
  legendTextCompact: { fontSize: 11 },
  swatch: { width: 10, height: 10, borderRadius: 5, marginRight: 8 },
  legendCompact: { marginTop: 10, rowGap: 4 },
  swatchCompact: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
});
