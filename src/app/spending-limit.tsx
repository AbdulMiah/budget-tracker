import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MoneyInput } from '../components/MoneyInput';
import { useTheme } from '../components/theme';
import { CATEGORY_COLORS } from '../lib/categories';
import { SPENDING_CATEGORIES } from '../lib/types';
import { useMoney } from '../lib/useMoney';
import { useStore } from '../store/useStore';

export default function SpendingLimitScreen() {
  const t = useTheme();
  const { formatMoney } = useMoney();
  const { budgetLimit, setBudgetLimit, categoryBudgets, setCategoryBudget } = useStore();
  const allocated = Object.values(categoryBudgets).reduce((sum, v) => sum + (v ?? 0), 0);
  const unallocated = (budgetLimit ?? 0) - allocated;
  const over = unallocated < 0;
  const percent = budgetLimit ? Math.round((allocated / budgetLimit) * 100) : 0;
  const scale = Math.max(budgetLimit ?? 0, allocated, 1);
  // In the same order as the list below, so the bar's colours read left to right like the list.
  const allocations = SPENDING_CATEGORIES.flatMap((c) => (categoryBudgets[c] ? [[c, categoryBudgets[c]] as const] : []));

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: t.bg }]} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" automaticallyAdjustKeyboardInsets>
        <Text style={[styles.section, { color: t.muted }]}>MONTHLY LIMIT</Text>
        <View style={[styles.card, { backgroundColor: t.card, borderColor: t.border }]}>
          <Text style={{ color: t.muted, fontSize: 13, marginBottom: 10 }}>
            The most you want to spend each budget month, including bills and subscriptions. Leave it empty to turn
            budgeting off.
          </Text>
          <MoneyInput value={budgetLimit} onChange={setBudgetLimit} placeholder="e.g. 2000" accessibilityLabel="Monthly spending limit" />
        </View>

        {budgetLimit !== null && (
          <>
            <Text style={[styles.section, { color: t.muted }]}>ALLOCATED</Text>
            <View style={[styles.card, { backgroundColor: t.card, borderColor: t.border }]}>
              <View style={styles.allocatedTop}>
                <Text style={[styles.percent, { color: over ? t.spend : t.text }]}>{percent}%</Text>
                <Text style={{ color: over ? t.spend : t.muted, fontSize: 13, fontWeight: '600' }}>
                  {over ? `${formatMoney(-unallocated)} over` : `${formatMoney(unallocated)} left`}
                </Text>
              </View>
              {/* One segment per category in its colour, scaled to the limit (or the total if over it). */}
              <View style={[styles.track, { backgroundColor: t.border }]}>
                {allocations.map(([c, pence]) => (
                  <View key={c} style={{ width: `${(pence / scale) * 100}%`, backgroundColor: over ? t.spend : CATEGORY_COLORS[c] }} />
                ))}
              </View>
              <Text style={{ color: t.muted, fontSize: 12, marginTop: 8 }}>
                {formatMoney(allocated)} of {formatMoney(budgetLimit)}
              </Text>
            </View>
          </>
        )}

        <Text style={[styles.section, { color: t.muted }]}>SPLIT BY CATEGORY</Text>
        <View style={[styles.card, { backgroundColor: t.card, borderColor: t.border }]}>
          <Text style={{ color: t.muted, fontSize: 13, marginBottom: 6 }}>
            Optional. Set aside part of your limit for the categories you want to keep an eye on.
          </Text>
          {SPENDING_CATEGORIES.map((c) => (
            <View key={c} style={[styles.allocation, { borderTopColor: t.border }]}>
              <View style={[styles.dot, { backgroundColor: CATEGORY_COLORS[c] }]} />
              <Text style={{ color: t.text, fontSize: 15, flex: 1 }}>{c}</Text>
              <View style={{ width: 120 }}>
                <MoneyInput
                  value={categoryBudgets[c] ?? null}
                  onChange={(pence) => setCategoryBudget(c, pence)}
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
  section: { fontSize: 12, fontWeight: '700', letterSpacing: 0.8, marginTop: 8, marginBottom: 8 },
  card: { padding: 16, borderRadius: 16, borderWidth: 1, marginBottom: 16 },
  allocatedTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 },
  percent: { fontSize: 28, fontWeight: '800' },
  track: { flexDirection: 'row', height: 8, borderRadius: 4, overflow: 'hidden' },
  allocation: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderTopWidth: StyleSheet.hairlineWidth },
  dot: { width: 12, height: 12, borderRadius: 6, marginRight: 12 },
});
