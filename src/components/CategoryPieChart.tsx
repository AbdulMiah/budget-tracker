import { StyleSheet, Text, View } from "react-native";

import { CATEGORY_COLORS } from "../lib/categories";
import { Category } from "../lib/types";
import { useMoney } from "../lib/useMoney";
import { DonutRing } from "./DonutRing";
import { useTheme } from "./theme";

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
          <Text style={{ color: t.muted, fontSize: compact ? 10 : 13 }}>
            Spent
          </Text>
          <Text
            style={{
              color: t.text,
              fontSize: compact ? 14 : 22,
              fontWeight: "800",
              maxWidth: size - 2 * stroke - 12,
            }}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {formatMoney(total)}
          </Text>
        </DonutRing>
      </View>

      {slices.length === 0 ? (
        <Text
          style={{
            color: t.muted,
            fontSize: 13,
            textAlign: "center",
            marginTop: 12,
          }}
        >
          Nothing spent in this period.
        </Text>
      ) : (
        <View style={[styles.legend, compact && styles.legendCompact]}>
          {slices.slice(0, legendLimit).map((s) => {
            const pct = Math.round((s.amount / total) * 100);
            return (
              <View
                key={s.category}
                style={[styles.legendItem, compact && { width: "100%" }]}
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
                  style={{
                    color: t.text,
                    fontSize: compact ? 11 : 13,
                    flex: 1,
                  }}
                  numberOfLines={1}
                >
                  {s.category}
                </Text>
                <Text
                  style={{
                    color: t.muted,
                    fontSize: compact ? 11 : 13,
                    fontWeight: "600",
                  }}
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
  legend: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginTop: 16,
    rowGap: 10,
  },
  legendItem: { width: "47%", flexDirection: "row", alignItems: "center" },
  swatch: { width: 10, height: 10, borderRadius: 5, marginRight: 8 },
  legendCompact: { marginTop: 10, rowGap: 4 },
  swatchCompact: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
});
