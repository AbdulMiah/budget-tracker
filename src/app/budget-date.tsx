import { format } from 'date-fns';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { InfoTip } from '../components/InfoTip';
import { useTheme } from '../components/theme';
import { MAX_BUDGET_DAY, periodEnd, periodStart } from '../lib/budgetPeriod';
import { useStore } from '../store/useStore';

export default function BudgetDateScreen() {
  const t = useTheme();
  const { budgetStartDay, setBudgetStartDay } = useStore();
  const start = periodStart(new Date(), budgetStartDay);
  const days = Array.from({ length: MAX_BUDGET_DAY }, (_, i) => i + 1);

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: t.bg }]} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.card, { backgroundColor: t.card, borderColor: t.border }]}>
          <View style={styles.titleRow}>
            <Text style={{ color: t.text, fontSize: 15, fontWeight: '600' }}>My budget month starts on day {budgetStartDay}</Text>
            <InfoTip label="Budget date" text="Set this to your payday so each month's budget lines up with your salary." />
          </View>
          <Text style={{ color: t.muted, fontSize: 13, marginBottom: 14 }}>
            Current period: {format(start, 'd MMM')} – {format(periodEnd(start), 'd MMM yyyy')}
          </Text>
          <View style={styles.grid}>
            {days.map((d) => {
              const active = d === budgetStartDay;
              return (
                <Pressable
                  key={d}
                  onPress={() => setBudgetStartDay(d)}
                  accessibilityRole="button"
                  accessibilityLabel={`Day ${d}`}
                  accessibilityState={{ selected: active }}
                  style={[
                    styles.day,
                    { backgroundColor: active ? t.primary : 'transparent', borderColor: active ? t.primary : t.border },
                  ]}
                >
                  <Text style={{ color: active ? '#fff' : t.text, fontWeight: '600' }}>{d}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: 16, paddingBottom: 32 },
  card: { padding: 16, borderRadius: 16, borderWidth: 1 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  day: { width: 42, height: 42, borderRadius: 21, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
});
