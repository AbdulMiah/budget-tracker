import { Ionicons } from '@expo/vector-icons';
import { format, startOfDay, subMonths } from 'date-fns';
import { router } from 'expo-router';
import { Fragment, ReactNode, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CategoryPieChart } from '../../components/CategoryPieChart';
import { DonutRing } from '../../components/DonutRing';
import { RecurringRow } from '../../components/RecurringRow';
import { SectionHeader } from '../../components/SectionHeader';
import { SpendingTrendChart } from '../../components/SpendingTrendChart';
import { EyeButton } from '../../components/EyeButton';
import { useTheme } from '../../components/theme';
import { TransactionEditModal } from '../../components/TransactionEditModal';
import { TotalsChart } from '../../components/TotalsChart';
import { TransactionRow } from '../../components/TransactionRow';
import { netWorthSeries } from '../../lib/analytics';
import { periodEnd, periodStart } from '../../lib/budgetPeriod';
import { useBudgetStatus } from '../../lib/useBudget';
import { useMoney } from '../../lib/useMoney';
import { detectRecurring } from '../../lib/recurring';
import { dailySpending, groupTotals, PeriodSelection, rangeTotals, resolvePeriod, stepSelection } from '../../lib/spendingPeriods';
import { ChartType, Transaction } from '../../lib/types';
import { useStore } from '../../store/useStore';

const SCREEN_PADDING = 16;
const COLUMN_GAP = 12;
const COLUMN_PADDING = 12;
const PREVIEW_COUNT = 5;

export default function DashboardScreen() {
  const t = useTheme();
  const { formatMoney, formatMoneyShort, formatSigned } = useMoney();
  const budget = useBudgetStatus();
  const { width } = useWindowDimensions();
  const { accounts, transactions, budgetStartDay, loading, error, load, setOverride, setAnalyticsChart } = useStore();
  const [editing, setEditing] = useState<Transaction | null>(null);

  const today = useMemo(() => new Date(), []);
  const netWorth = accounts.reduce((sum, a) => sum + a.balance, 0);
  const monthChange = useMemo(() => {
    const series = netWorthSeries(accounts, transactions, subMonths(today, 1), today);
    return series.length ? series[series.length - 1].value - series[0].value : 0;
  }, [accounts, transactions, today]);

  // Current budget period, up to today.
  const period = useMemo(() => {
    const start = periodStart(today, budgetStartDay);
    const end = periodEnd(start);
    return rangeTotals(transactions, { start, end: end > today ? today : end });
  }, [transactions, budgetStartDay, today]);

  // This budget month against the one before, for the trend and category charts.
  const month = useMemo(() => {
    const day = startOfDay(today);
    const sel: PeriodSelection = { kind: 'month', anchor: day, custom: { start: day, end: day } };
    const current = resolvePeriod(sel, budgetStartDay, day);
    const previous = stepSelection(sel, -1, budgetStartDay, day);
    return {
      fullRange: current.fullRange,
      daily: dailySpending(transactions, current.range),
      previousDaily: previous ? dailySpending(transactions, resolvePeriod(previous, budgetStartDay, day).range) : [],
      slices: groupTotals(transactions, current.range, 'category')
        .filter((r) => r.spending > 0)
        .sort((a, b) => b.spending - a.spending)
        .map((r) => ({ category: r.category, amount: r.spending })),
    };
  }, [transactions, budgetStartDay, today]);
  const openAnalytics = (chart: ChartType) => {
    setAnalyticsChart(chart);
    router.navigate('/analytics');
  };

  const accountById = useMemo(() => new Map(accounts.map((a) => [a.id, a])), [accounts]);
  const recent = transactions.slice(0, PREVIEW_COUNT);
  const recurring = useMemo(
    () => detectRecurring(transactions, today)
      .filter((r) => r.direction === 'out')
      .slice(0, PREVIEW_COUNT),
    [transactions, today],
  );

  const columnWidth = (width - 2 * SCREEN_PADDING - COLUMN_GAP) / 2;
  const columnInner = columnWidth - 2 * COLUMN_PADDING;
  const cardStyle = { backgroundColor: t.card, borderColor: t.border };

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: t.bg }]} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={t.muted} />}
      >
        <View style={styles.titleRow}>
          <Text style={[styles.h1, { color: t.text }]}>Dashboard</Text>
          <EyeButton />
        </View>
        {error && <Text style={{ color: t.spend, marginBottom: 12 }}>{error}</Text>}

        <Pressable
          onPress={() => router.push('/net-worth')}
          accessibilityRole="button"
          accessibilityHint="Opens the net worth chart"
          style={({ pressed }) => [styles.card, styles.hero, cardStyle, { opacity: pressed ? 0.7 : 1 }]}
        >
          <View style={{ flex: 1 }}>
            <Text style={{ color: t.muted, fontSize: 14 }}>Net worth</Text>
            {loading && !accounts.length ? (
              <ActivityIndicator style={{ alignSelf: 'flex-start', marginVertical: 12 }} />
            ) : (
              <Text style={[styles.netWorth, { color: t.text }]} numberOfLines={1} adjustsFontSizeToFit>
                {formatMoney(netWorth)}
              </Text>
            )}
            <Text style={{ color: monthChange >= 0 ? t.income : t.spend, fontWeight: '600' }}>
              {formatSigned(monthChange)} in the last month
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={22} color={t.muted} />
        </Pressable>

        <SectionHeader title="This budget month" />
        <View style={styles.columns}>
          <ChartColumn
            title="Income & spending"
            subtitle={`${format(period.start, 'd MMM')} – ${format(period.end, 'd MMM')}`}
            width={columnWidth}
            onPress={() => openAnalytics('income-spending')}
          >
            <Text style={{ color: t.muted, fontSize: 11, textAlign: 'center' }}>Net</Text>
            <Text
              style={[styles.net, { color: period.income >= period.spending ? t.income : t.spend }]}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {formatSigned(period.income - period.spending)}
            </Text>
            <TotalsChart income={period.income} spending={period.spending} height={70} compact />
          </ChartColumn>

          <ChartColumn
            title="Budget"
            subtitle={budget ? `${formatMoneyShort(budget.limit)} this month` : 'Not set up'}
            width={columnWidth}
            onPress={() => router.navigate('/budget')}
            hint="Opens your budget"
          >
            <View style={styles.donut}>
              <DonutRing
                segments={
                  budget
                    ? [
                        { key: 'spent', value: budget.spent, color: t.spend },
                        { key: 'committed', value: budget.committed, color: t.committed },
                      ]
                    : []
                }
                total={budget ? Math.max(budget.limit, budget.spent + budget.committed) : 1}
                size={Math.min(columnInner, 100)}
                stroke={12}
              >
                <Text style={{ color: t.muted, fontSize: 10 }}>{budget && budget.remaining < 0 ? 'Over by' : 'Left'}</Text>
                <Text
                  style={{ color: budget && budget.remaining < 0 ? t.spend : t.text, fontSize: 14, fontWeight: '800', maxWidth: 70 }}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                >
                  {budget ? formatMoneyShort(Math.abs(budget.remaining)) : '–'}
                </Text>
              </DonutRing>
            </View>
            <Text style={{ color: t.muted, fontSize: 12, textAlign: 'center' }}>
              {budget ? `${formatMoneyShort(budget.dailyAllowance)} a day to spend` : 'Tap to set a limit'}
            </Text>
          </ChartColumn>
        </View>

        <View style={[styles.columns, { marginTop: COLUMN_GAP }]}>
          <ChartColumn
            title="Spending trend"
            subtitle="vs last month"
            width={columnWidth}
            onPress={() => openAnalytics('spending-trend')}
          >
            <SpendingTrendChart
              current={month.daily}
              previous={month.previousDaily}
              fullRange={month.fullRange}
              periodNoun="month"
              width={columnInner}
              compact
            />
          </ChartColumn>

          <ChartColumn title="By category" subtitle="Top 5" width={columnWidth} onPress={() => openAnalytics('categories')}>
            <CategoryPieChart slices={month.slices} size={Math.min(columnInner, 100)} legendLimit={5} compact />
          </ChartColumn>
        </View>

        <SectionHeader title="Recent transactions" onSeeAll={() => router.push('/transactions')} />
        <View style={[styles.card, styles.list, cardStyle]}>
          {recent.map((txn, i) => (
            <Fragment key={txn.id}>
              {i > 0 && <View style={[styles.divider, { backgroundColor: t.border }]} />}
              <TransactionRow txn={txn} account={accountById.get(txn.accountId)} onPress={setEditing} />
            </Fragment>
          ))}
          {!recent.length && !loading && <Text style={[styles.empty, { color: t.muted }]}>No transactions yet.</Text>}
        </View>

        <SectionHeader title="Recurring payments" onSeeAll={() => router.push('/recurring')} />
        <View style={[styles.card, styles.list, cardStyle]}>
          {recurring.map((item, i) => (
            <Fragment key={item.key}>
              {i > 0 && <View style={[styles.divider, { backgroundColor: t.border }]} />}
              <RecurringRow
                item={item}
                account={accountById.get(item.accountId)}
                style={styles.recurringRow}
                onPress={(r) => router.push({ pathname: '/recurring/[key]', params: { key: r.key } })}
              />
            </Fragment>
          ))}
          {!recurring.length && !loading && (
            <Text style={[styles.empty, { color: t.muted }]}>No recurring payments found yet.</Text>
          )}
        </View>
      </ScrollView>

      <TransactionEditModal txn={editing} onSave={setOverride} onClose={() => setEditing(null)} />
    </SafeAreaView>
  );
}

/** A tappable dashboard card in the two-column grid. */
function ChartColumn({
  title,
  subtitle,
  width,
  onPress,
  hint = 'Opens this chart in Analytics',
  children,
}: {
  title: string;
  subtitle: string;
  width: number;
  onPress?: () => void;
  /** Screen reader hint for onPress; defaults to opening the chart in Analytics. */
  hint?: string;
  children: ReactNode;
}) {
  const t = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityHint={onPress ? hint : undefined}
      style={({ pressed }) => [
        styles.card,
        styles.column,
        { width, backgroundColor: t.card, borderColor: t.border, opacity: pressed ? 0.7 : 1 },
      ]}
    >
      <Text style={[styles.columnTitle, { color: t.text }]}>{title}</Text>
      <Text style={[styles.columnSub, { color: t.muted }]}>{subtitle}</Text>
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: SCREEN_PADDING, paddingBottom: 32 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  h1: { fontSize: 30, fontWeight: '800', marginBottom: 12 },
  card: { borderRadius: 16, borderWidth: 1 },
  hero: { flexDirection: 'row', alignItems: 'center', padding: 20 },
  netWorth: { fontSize: 40, fontWeight: '800', marginVertical: 4 },
  columns: { flexDirection: 'row', justifyContent: 'space-between' },
  column: { padding: COLUMN_PADDING },
  columnTitle: { fontSize: 14, fontWeight: '700' },
  columnSub: { fontSize: 12, marginTop: 2, marginBottom: 10 },
  net: { fontSize: 18, fontWeight: '800', textAlign: 'center', marginBottom: 8 },
  donut: { flex: 1, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  list: { overflow: 'hidden' },
  divider: { height: StyleSheet.hairlineWidth, marginLeft: 68 },
  recurringRow: { paddingHorizontal: 16, paddingVertical: 12 },
  empty: { textAlign: 'center', padding: 20 },
});
