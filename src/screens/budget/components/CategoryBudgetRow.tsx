import { StyleSheet, Text, View } from "react-native";

import { CATEGORY_COLORS } from "@/constants";
import { useMoney } from "@/hooks/useMoney";
import { useTheme } from "@/hooks/useTheme";
import { CategoryBudget } from "@/utils/budget";

/** A category's allocation, with spent and committed filling its bar. */
export function CategoryBudgetRow({
  item,
  first,
}: {
  item: CategoryBudget;
  first: boolean;
}) {
  const t = useTheme();
  const { formatMoney } = useMoney();
  const used = item.spent + item.committed;
  const over = used > item.limit;
  const scale = Math.max(item.limit, used, 1);
  const color = CATEGORY_COLORS[item.category];

  return (
    <View
      style={[
        styles.row,
        !first && styles.divided,
        { borderTopColor: t.border },
      ]}
    >
      <View style={styles.top}>
        <View style={[styles.swatch, { backgroundColor: color }]} />
        <Text style={[styles.category, { color: t.text }]}>
          {item.category}
        </Text>
        <Text style={[styles.amounts, { color: over ? t.spend : t.muted }]}>
          {formatMoney(used)} of {formatMoney(item.limit)}
        </Text>
      </View>
      <View style={[styles.track, { backgroundColor: t.border }]}>
        <View
          style={{
            width: `${(item.spent / scale) * 100}%`,
            backgroundColor: over ? t.spend : color,
          }}
        />
        <View
          style={{
            width: `${(item.committed / scale) * 100}%`,
            backgroundColor: t.committed,
          }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { paddingVertical: 10 },
  divided: { borderTopWidth: StyleSheet.hairlineWidth },
  top: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  swatch: { width: 10, height: 10, borderRadius: 5, marginRight: 6 },
  category: { flex: 1, fontSize: 15 },
  amounts: { fontSize: 13, fontWeight: "600" },
  track: {
    flexDirection: "row",
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
  },
});
