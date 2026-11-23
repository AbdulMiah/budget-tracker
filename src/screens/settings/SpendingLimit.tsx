import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { MoneyInput } from "@/components/MoneyInput";
import { SectionTitle } from "@/components/SectionTitle";
import { CATEGORY_COLORS } from "@/constants";
import { SPENDING_CATEGORIES } from "@/constants/types";
import { useMoney } from "@/hooks/useMoney";
import { useSettings } from "@/hooks/useSettings";
import { useTheme } from "@/hooks/useTheme";
import { withEntry } from "@/utils/helpers";

export function SpendingLimitScreen() {
  const t = useTheme();
  const { formatMoney } = useMoney();
  const { settings, update } = useSettings();
  const { budgetLimit, categoryBudgets } = settings;
  const cardColors = { backgroundColor: t.card, borderColor: t.border };
  const allocated = Object.values(categoryBudgets).reduce(
    (sum, v) => sum + (v ?? 0),
    0
  );
  const unallocated = (budgetLimit ?? 0) - allocated;
  const over = unallocated < 0;
  const percent = budgetLimit ? Math.round((allocated / budgetLimit) * 100) : 0;
  const scale = Math.max(budgetLimit ?? 0, allocated, 1);
  // In the same order as the list below, so the bar's colours read left to right like the list.
  const allocations = SPENDING_CATEGORIES.flatMap((c) =>
    categoryBudgets[c] ? [[c, categoryBudgets[c]] as const] : []
  );

  return (
    <SafeAreaView
      style={[styles.screen, { backgroundColor: t.bg }]}
      edges={["bottom"]}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
      >
        <SectionTitle
          title="Monthly limit"
          info="The most you want to spend each budget month, including bills and subscriptions. Leave it empty to turn budgeting off."
        />
        <View style={[styles.card, cardColors]}>
          <MoneyInput
            value={budgetLimit}
            onChange={(pence) => update({ budgetLimit: pence })}
            placeholder="e.g. 2000"
            accessibilityLabel="Monthly spending limit"
          />
        </View>

        {budgetLimit !== null && (
          <>
            <Text style={[styles.section, { color: t.muted }]}>ALLOCATED</Text>
            <View style={[styles.card, cardColors]}>
              <View style={styles.allocatedTop}>
                <Text
                  style={[styles.percent, { color: over ? t.spend : t.text }]}
                >
                  {percent}%
                </Text>
                <Text
                  style={[styles.left, { color: over ? t.spend : t.muted }]}
                >
                  {over
                    ? `${formatMoney(-unallocated)} over`
                    : `${formatMoney(unallocated)} left`}
                </Text>
              </View>
              {/* One segment per category in its colour, scaled to the limit (or the total if over it). */}
              <View style={[styles.track, { backgroundColor: t.border }]}>
                {allocations.map(([c, pence]) => (
                  <View
                    key={c}
                    style={{
                      width: `${(pence / scale) * 100}%`,
                      backgroundColor: over ? t.spend : CATEGORY_COLORS[c],
                    }}
                  />
                ))}
              </View>
              <Text style={[styles.total, { color: t.muted }]}>
                {formatMoney(allocated)} of {formatMoney(budgetLimit)}
              </Text>
            </View>
          </>
        )}

        <SectionTitle
          title="Split by category"
          info="Optional. Set aside part of your limit for the categories you want to keep an eye on."
        />
        <View style={[styles.card, cardColors]}>
          {SPENDING_CATEGORIES.map((c) => (
            <View
              key={c}
              style={[styles.allocation, { borderTopColor: t.border }]}
            >
              <View
                style={[styles.dot, { backgroundColor: CATEGORY_COLORS[c] }]}
              />
              <Text style={[styles.category, { color: t.text }]}>{c}</Text>
              <View style={styles.input}>
                <MoneyInput
                  value={categoryBudgets[c] ?? null}
                  onChange={(pence) =>
                    update((s) => ({
                      categoryBudgets: withEntry(s.categoryBudgets, c, pence),
                    }))
                  }
                  placeholder="—"
                  accessibilityLabel={`${c} budget`}
                />
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: 16, paddingBottom: 32 },
  section: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.8,
    marginTop: 8,
    marginBottom: 8,
  },
  card: { padding: 16, borderRadius: 16, borderWidth: 1, marginBottom: 16 },
  allocatedTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    marginBottom: 10,
  },
  percent: { fontSize: 28, fontWeight: "800" },
  left: { fontSize: 13, fontWeight: "600" },
  total: { fontSize: 12, marginTop: 8 },
  track: {
    flexDirection: "row",
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
  },
  allocation: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  category: { flex: 1, fontSize: 15 },
  input: { width: 120 },
  dot: { width: 12, height: 12, borderRadius: 6, marginRight: 12 },
});
