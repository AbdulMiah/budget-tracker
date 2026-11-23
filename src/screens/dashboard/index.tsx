import { Ionicons } from "@expo/vector-icons";
import { format, startOfDay, subMonths } from "date-fns";
import { router } from "expo-router";
import { Fragment, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { CategoryPieChart } from "@/components/CategoryPieChart";
import { DonutRing } from "@/components/DonutRing";
import { EyeButton } from "@/components/EyeButton";
import { RecurringRow } from "@/components/RecurringRow";
import { SpendingTrendChart } from "@/components/SpendingTrendChart";
import { TotalsChart } from "@/components/TotalsChart";
import { TransactionEditModal } from "@/components/TransactionEditModal";
import { TransactionRow } from "@/components/TransactionRow";
import { RADIUS, SPACING } from "@/constants";
import { ChartType, Transaction } from "@/constants/types";
import { useBankData } from "@/hooks/useBankData";
import { useBudgetStatus } from "@/hooks/useBudgetStatus";
import { useEditTransaction } from "@/hooks/useEditTransaction";
import { useMoney } from "@/hooks/useMoney";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { useSettings } from "@/hooks/useSettings";
import { useTheme } from "@/hooks/useTheme";
import {
  ChartColumn,
  COLUMN_PADDING,
} from "@/screens/dashboard/components/ChartColumn";
import { SectionHeader } from "@/screens/dashboard/components/SectionHeader";
import { ZakatSummaryCard } from "@/screens/dashboard/components/ZakatSummaryCard";
import { netWorthSeries } from "@/utils/analytics";
import { periodEnd, periodStart } from "@/utils/budget-period";
import { detectRecurring } from "@/utils/recurring";
import {
  dailySpending,
  groupTotals,
  PeriodSelection,
  rangeTotals,
  resolvePeriod,
  stepSelection,
} from "@/utils/spending-periods";

const SCREEN_PADDING = SPACING.four;
const COLUMN_GAP = SPACING.three;
const PREVIEW_COUNT = 5;

export function DashboardScreen() {
  const t = useTheme();
  const { formatMoney, formatMoneyShort, formatSigned } = useMoney();
  const budget = useBudgetStatus();
  const { width } = useWindowDimensions();
  const { accounts, transactions, isPending, error, refetch } = useBankData();
  const { settings, update } = useSettings();
  const { budgetStartDay } = settings;
  const editTransaction = useEditTransaction();
  const { isRefreshing, onRefresh } = usePullToRefresh(refetch);
  const [editing, setEditing] = useState<Transaction | null>(null);

  const today = useMemo(() => new Date(), []);
  const netWorth = accounts.reduce((sum, a) => sum + a.balance, 0);
  const monthChange = useMemo(() => {
    const series = netWorthSeries(
      accounts,
      transactions,
      subMonths(today, 1),
      today
    );
    return series.length
      ? series[series.length - 1].value - series[0].value
      : 0;
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
    const sel: PeriodSelection = {
      kind: "month",
      anchor: day,
      custom: { start: day, end: day },
    };
    const current = resolvePeriod(sel, budgetStartDay, day);
    const previous = stepSelection(sel, -1, budgetStartDay, day);
    return {
      fullRange: current.fullRange,
      daily: dailySpending(transactions, current.range),
      previousDaily: previous
        ? dailySpending(
            transactions,
            resolvePeriod(previous, budgetStartDay, day).range
          )
        : [],
      slices: groupTotals(transactions, current.range, "category")
        .filter((r) => r.spending > 0)
        .sort((a, b) => b.spending - a.spending)
        .map((r) => ({ category: r.category, amount: r.spending })),
    };
  }, [transactions, budgetStartDay, today]);

  // Analytics opens on whichever chart was tapped.
  const openAnalytics = (chart: ChartType) => {
    update({ analyticsChart: chart });
    router.navigate("/analytics");
  };

  const accountById = useMemo(
    () => new Map(accounts.map((a) => [a.id, a])),
    [accounts]
  );
  const recent = transactions.slice(0, PREVIEW_COUNT);
  const recurring = useMemo(
    () =>
      detectRecurring(transactions, today)
        .filter((r) => r.direction === "out")
        .slice(0, PREVIEW_COUNT),
    [transactions, today]
  );

  const columnWidth = (width - 2 * SCREEN_PADDING - COLUMN_GAP) / 2;
  const columnInner = columnWidth - 2 * COLUMN_PADDING;
  const cardStyle = { backgroundColor: t.card, borderColor: t.border };
  const overBudget = !!budget && budget.remaining < 0;

  return (
    <SafeAreaView
      style={[styles.screen, { backgroundColor: t.bg }]}
      edges={["top"]}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor={t.muted}
          />
        }
      >
        <View style={styles.titleRow}>
          <Text style={[styles.h1, { color: t.text }]}>Dashboard</Text>
          <EyeButton />
        </View>
        {error && (
          <Text style={[styles.error, { color: t.spend }]}>
            {error.message}
          </Text>
        )}

        <Pressable
          onPress={() => router.push("/net-worth")}
          accessibilityRole="button"
          accessibilityHint="Opens the net worth chart"
          style={({ pressed }) => [
            styles.card,
            styles.hero,
            cardStyle,
            pressed && styles.pressed,
          ]}
        >
          <View style={styles.heroText}>
            <Text style={[styles.heroLabel, { color: t.muted }]}>
              Net worth
            </Text>
            {isPending ? (
              <ActivityIndicator style={styles.heroSpinner} />
            ) : (
              <Text
                style={[styles.netWorth, { color: t.text }]}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                {formatMoney(netWorth)}
              </Text>
            )}
            <Text
              style={[
                styles.monthChange,
                { color: monthChange >= 0 ? t.income : t.spend },
              ]}
            >
              {formatSigned(monthChange)} in the last month
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={22} color={t.muted} />
        </Pressable>

        <SectionHeader
          title="Zakat"
          onSeeAll={() => router.navigate("/zakat")}
        />
        <ZakatSummaryCard />

        <SectionHeader title="This budget month" />
        <View style={styles.columns}>
          <ChartColumn
            title="Income & spending"
            subtitle={`${format(period.start, "d MMM")} – ${format(period.end, "d MMM")}`}
            width={columnWidth}
            onPress={() => openAnalytics("income-spending")}
          >
            <Text style={[styles.caption, { color: t.muted }]}>Net</Text>
            <Text
              style={[
                styles.net,
                {
                  color: period.income >= period.spending ? t.income : t.spend,
                },
              ]}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {formatSigned(period.income - period.spending)}
            </Text>
            <TotalsChart
              income={period.income}
              spending={period.spending}
              height={70}
              compact
            />
          </ChartColumn>

          <ChartColumn
            title="Budget"
            subtitle={
              budget
                ? `${formatMoneyShort(budget.limit)} this month`
                : "Not set up"
            }
            width={columnWidth}
            onPress={() => router.navigate("/budget")}
            hint="Opens your budget"
          >
            <View style={styles.donut}>
              <DonutRing
                segments={
                  budget
                    ? [
                        { key: "spent", value: budget.spent, color: t.spend },
                        {
                          key: "committed",
                          value: budget.committed,
                          color: t.committed,
                        },
                      ]
                    : []
                }
                total={
                  budget
                    ? Math.max(budget.limit, budget.spent + budget.committed)
                    : 1
                }
                size={Math.min(columnInner, 100)}
                stroke={12}
              >
                <Text style={[styles.donutLabel, { color: t.muted }]}>
                  {overBudget ? "Over by" : "Left"}
                </Text>
                <Text
                  style={[
                    styles.donutValue,
                    { color: overBudget ? t.spend : t.text },
                  ]}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                >
                  {budget ? formatMoneyShort(Math.abs(budget.remaining)) : "–"}
                </Text>
              </DonutRing>
            </View>
            <Text style={[styles.allowance, { color: t.muted }]}>
              {budget
                ? `${formatMoneyShort(budget.dailyAllowance)} a day to spend`
                : "Tap to set a limit"}
            </Text>
          </ChartColumn>
        </View>

        <View style={[styles.columns, styles.secondRow]}>
          <ChartColumn
            title="Spending trend"
            subtitle="vs last month"
            width={columnWidth}
            onPress={() => openAnalytics("spending-trend")}
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

          <ChartColumn
            title="By category"
            subtitle="Top 5"
            width={columnWidth}
            onPress={() => openAnalytics("categories")}
          >
            <CategoryPieChart
              slices={month.slices}
              size={Math.min(columnInner, 100)}
              legendLimit={5}
              compact
            />
          </ChartColumn>
        </View>

        <SectionHeader
          title="Recent transactions"
          onSeeAll={() => router.push("/transactions")}
        />
        <View style={[styles.card, styles.list, cardStyle]}>
          {recent.map((txn, i) => (
            <Fragment key={txn.id}>
              {i > 0 && (
                <View style={[styles.divider, { backgroundColor: t.border }]} />
              )}
              <TransactionRow
                txn={txn}
                account={accountById.get(txn.accountId)}
                onPress={setEditing}
              />
            </Fragment>
          ))}
          {!recent.length && !isPending && (
            <Text style={[styles.empty, { color: t.muted }]}>
              No transactions yet.
            </Text>
          )}
        </View>

        <SectionHeader
          title="Recurring payments"
          onSeeAll={() => router.push("/recurring")}
        />
        <View style={[styles.card, styles.list, cardStyle]}>
          {recurring.map((item, i) => (
            <Fragment key={item.key}>
              {i > 0 && (
                <View style={[styles.divider, { backgroundColor: t.border }]} />
              )}
              <RecurringRow
                item={item}
                account={accountById.get(item.accountId)}
                style={styles.recurringRow}
                onPress={(r) =>
                  router.push({
                    pathname: "/recurring/[key]",
                    params: { key: r.key },
                  })
                }
              />
            </Fragment>
          ))}
          {!recurring.length && !isPending && (
            <Text style={[styles.empty, { color: t.muted }]}>
              No recurring payments found yet.
            </Text>
          )}
        </View>
      </ScrollView>

      <TransactionEditModal
        txn={editing}
        onSave={editTransaction}
        onClose={() => setEditing(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: SCREEN_PADDING, paddingBottom: SPACING.six },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  h1: { fontSize: 30, fontWeight: "800", marginBottom: SPACING.three },
  error: { marginBottom: SPACING.three },
  card: { borderRadius: RADIUS.large, borderWidth: 1 },
  pressed: { opacity: 0.7 },
  hero: { flexDirection: "row", alignItems: "center", padding: 20 },
  heroText: { flex: 1 },
  heroLabel: { fontSize: 14 },
  heroSpinner: { alignSelf: "flex-start", marginVertical: SPACING.three },
  netWorth: { fontSize: 40, fontWeight: "800", marginVertical: SPACING.one },
  monthChange: { fontWeight: "600" },
  columns: { flexDirection: "row", justifyContent: "space-between" },
  secondRow: { marginTop: COLUMN_GAP },
  caption: { fontSize: 11, textAlign: "center" },
  net: {
    fontSize: 18,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: SPACING.two,
  },
  donut: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SPACING.two,
  },
  donutLabel: { fontSize: 10 },
  donutValue: { fontSize: 14, fontWeight: "800", maxWidth: 70 },
  allowance: { fontSize: 12, textAlign: "center" },
  list: { overflow: "hidden" },
  divider: { height: StyleSheet.hairlineWidth, marginLeft: 68 },
  recurringRow: {
    paddingHorizontal: SPACING.four,
    paddingVertical: SPACING.three,
  },
  empty: { textAlign: "center", padding: 20 },
});
