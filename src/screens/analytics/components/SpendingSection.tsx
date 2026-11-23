import { Ionicons } from "@expo/vector-icons";
import { startOfDay, subDays } from "date-fns";
import { useCallback, useMemo, useState } from "react";
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";

import { AccountFilterButton } from "@/components/AccountFilterButton";
import { AccountFilterSheet } from "@/components/AccountFilterSheet";
import { CategoryPieChart } from "@/components/CategoryPieChart";
import { Chip } from "@/components/Chip";
import { IconButton } from "@/components/IconButton";
import { SpendingTrendChart } from "@/components/SpendingTrendChart";
import { TotalsChart } from "@/components/TotalsChart";
import { TransactionAvatar } from "@/components/TransactionRow";
import { CATEGORY_COLORS } from "@/constants";
import { useMoney } from "@/hooks/useMoney";
import { useTheme } from "@/hooks/useTheme";
import {
  CHART_TYPES,
  ChartTypeSheet,
} from "@/screens/analytics/components/ChartTypeSheet";
import { PeriodDots } from "@/screens/analytics/components/PeriodDots";
import { PeriodSheet } from "@/screens/analytics/components/PeriodSheet";
import { SwipeablePeriod } from "@/screens/analytics/components/SwipeablePeriod";
import { useStore } from "@/store/useStore";
import {
  dailySpending,
  GroupBy,
  groupTotals,
  PeriodSelection,
  rangeTotals,
  resolvePeriod,
  stepSelection,
} from "@/utils/spending-periods";

const COLLAPSED_ROWS = 6;
// Screen and card padding plus the card border, either side.
const CARD_INSET = 2 * (16 + 16 + 1);
const PERIOD_NOUN: Record<PeriodSelection["kind"], string> = {
  week: "week",
  month: "month",
  quarter: "quarter",
  year: "year",
  custom: "range",
};

/** A chart of the chosen period and accounts (type picked by the user), with a category/merchant breakdown. */
export function SpendingSection() {
  const t = useTheme();
  const { formatSigned } = useMoney();
  const { width } = useWindowDimensions();
  const {
    transactions,
    accounts,
    budgetStartDay,
    analyticsChart: chartType,
    setAnalyticsChart: setChartType,
  } = useStore();

  const today = useMemo(() => startOfDay(new Date()), []);
  const [selection, setSelection] = useState<PeriodSelection>(() => ({
    kind: "month",
    anchor: today,
    custom: { start: subDays(today, 29), end: today },
  }));
  const [accountIds, setAccountIds] = useState<string[]>([]);
  const [groupBy, setGroupBy] = useState<GroupBy>("category");
  const [sheet, setSheet] = useState<"period" | "accounts" | "chart" | null>(
    null
  );
  // Shared by the swiping card and the dots, so the dots lean towards where the swipe is heading.
  const [drag] = useState(() => new Animated.Value(0));
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const { fullRange, range, title, subtitle } = resolvePeriod(
    selection,
    budgetStartDay,
    today
  );
  const filtered = useMemo(() => {
    if (!accountIds.length) return transactions;
    const only = new Set(accountIds);
    return transactions.filter((x) => only.has(x.accountId));
  }, [transactions, accountIds]);
  const { income, spending } = useMemo(
    () => rangeTotals(filtered, range),
    [filtered, range]
  );
  const rows = useMemo(
    () => groupTotals(filtered, range, groupBy),
    [filtered, range, groupBy]
  );
  const spendingRows = rows
    .filter((r) => r.spending > 0)
    .sort((a, b) => b.spending - a.spending);
  const incomeRows = rows
    .filter((r) => r.income > 0)
    .sort((a, b) => b.income - a.income);
  const net = income - spending;

  // Only worked out for the chart that's showing.
  const trend = useMemo(() => {
    if (chartType !== "spending-trend") return null;
    const previous = stepSelection(selection, -1, budgetStartDay, today);
    const previousRange = previous
      ? resolvePeriod(previous, budgetStartDay, today).range
      : null;
    return {
      current: dailySpending(filtered, range),
      previous: previousRange ? dailySpending(filtered, previousRange) : [],
    };
  }, [chartType, selection, budgetStartDay, today, filtered, range]);
  const slices = useMemo(() => {
    if (chartType !== "categories") return [];
    return groupTotals(filtered, range, "category")
      .filter((r) => r.spending > 0)
      .sort((a, b) => b.spending - a.spending)
      .map((r) => ({ category: r.category, amount: r.spending }));
  }, [chartType, filtered, range]);
  const chartIcon = CHART_TYPES.find((c) => c.type === chartType)!.icon;
  const canStep = useCallback(
    (dir: 1 | -1) =>
      stepSelection(selection, dir, budgetStartDay, today) !== null,
    [selection, budgetStartDay, today]
  );
  const step = useCallback(
    (dir: 1 | -1) =>
      setSelection((s) => stepSelection(s, dir, budgetStartDay, today) ?? s),
    [budgetStartDay, today]
  );

  return (
    <View>
      <View style={styles.filters}>
        <Pressable
          onPress={() => setSheet("period")}
          accessibilityRole="button"
          accessibilityLabel={`Period: ${title}`}
          accessibilityHint="Opens period options"
          style={[
            styles.periodButton,
            { backgroundColor: t.card, borderColor: t.border },
          ]}
        >
          <Ionicons name="calendar-outline" size={18} color={t.primary} />
          <View style={{ flex: 1, marginHorizontal: 10 }}>
            <Text
              style={{ color: t.text, fontSize: 15, fontWeight: "700" }}
              numberOfLines={1}
            >
              {title}
            </Text>
            {subtitle && (
              <Text style={{ color: t.muted, fontSize: 12 }} numberOfLines={1}>
                {subtitle}
              </Text>
            )}
          </View>
          <Ionicons name="chevron-down" size={18} color={t.muted} />
        </Pressable>
        <AccountFilterButton
          count={accountIds.length}
          onPress={() => setSheet("accounts")}
        />
        <IconButton
          icon={chartIcon}
          accessibilityLabel="Change chart type"
          onPress={() => setSheet("chart")}
        />
      </View>

      <SwipeablePeriod
        onStep={step}
        canStep={canStep}
        drag={drag}
        style={[
          styles.card,
          { backgroundColor: t.card, borderColor: t.border, marginBottom: 12 },
        ]}
      >
        {chartType === "income-spending" && (
          <>
            <Text style={{ color: t.muted, fontSize: 13, textAlign: "center" }}>
              Net
            </Text>
            <Text
              style={[styles.net, { color: net >= 0 ? t.income : t.spend }]}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {formatSigned(net)}
            </Text>
            <TotalsChart income={income} spending={spending} />
          </>
        )}
        {trend && (
          <SpendingTrendChart
            current={trend.current}
            previous={trend.previous}
            fullRange={fullRange}
            periodNoun={PERIOD_NOUN[selection.kind]}
            width={width - CARD_INSET}
          />
        )}
        {chartType === "categories" && <CategoryPieChart slices={slices} />}
      </SwipeablePeriod>
      {/* Outside the swiping card so the dots stay still while the card moves. */}
      <PeriodDots drag={drag} hasNext={canStep(1)} />

      <View
        style={[
          styles.card,
          { backgroundColor: t.card, borderColor: t.border },
        ]}
      >
        <View style={styles.groupToggle}>
          <Chip
            label="By category"
            selected={groupBy === "category"}
            onPress={() => setGroupBy("category")}
          />
          <Chip
            label="By merchant"
            selected={groupBy === "merchant"}
            onPress={() => setGroupBy("merchant")}
          />
        </View>
        <GroupList
          title="Spending"
          rows={spendingRows.map((r) => ({ ...r, amount: r.spending }))}
          groupBy={groupBy}
          color={t.spend}
          expanded={!!expanded.spending}
          onToggle={() => setExpanded((e) => ({ ...e, spending: !e.spending }))}
        />
        <GroupList
          title="Income"
          rows={incomeRows.map((r) => ({ ...r, amount: r.income }))}
          groupBy={groupBy}
          color={t.income}
          expanded={!!expanded.income}
          onToggle={() => setExpanded((e) => ({ ...e, income: !e.income }))}
        />
      </View>

      <PeriodSheet
        visible={sheet === "period"}
        selection={selection}
        budgetStartDay={budgetStartDay}
        today={today}
        onApply={setSelection}
        onClose={() => setSheet(null)}
      />
      <ChartTypeSheet
        visible={sheet === "chart"}
        value={chartType}
        onChange={setChartType}
        onClose={() => setSheet(null)}
      />
      <AccountFilterSheet
        visible={sheet === "accounts"}
        accounts={accounts}
        selected={accountIds}
        onApply={setAccountIds}
        onClose={() => setSheet(null)}
      />
    </View>
  );
}

type ListRow = {
  key: string;
  category: keyof typeof CATEGORY_COLORS;
  icon?: string | null;
  amount: number;
};

function GroupList({
  title,
  rows,
  groupBy,
  color,
  expanded,
  onToggle,
}: {
  title: string;
  rows: ListRow[];
  groupBy: GroupBy;
  color: string;
  expanded: boolean;
  onToggle: () => void;
}) {
  const t = useTheme();
  const { formatMoney } = useMoney();
  const total = rows.reduce((s, r) => s + r.amount, 0);
  const shown = expanded ? rows : rows.slice(0, COLLAPSED_ROWS);

  return (
    <View style={styles.list}>
      <View style={styles.listHeader}>
        <Text style={{ color: t.text, fontSize: 15, fontWeight: "700" }}>
          {title}
        </Text>
        <Text style={{ color, fontSize: 15, fontWeight: "700" }}>
          {formatMoney(total)}
        </Text>
      </View>
      {rows.length === 0 && (
        <Text style={{ color: t.muted, fontSize: 13, paddingVertical: 8 }}>
          Nothing in this period.
        </Text>
      )}
      {shown.map((r) => {
        const catColor = CATEGORY_COLORS[r.category];
        return (
          <View key={r.key} style={[styles.row, { borderTopColor: t.border }]}>
            {groupBy === "merchant" ? (
              <TransactionAvatar
                merchant={r.key}
                icon={r.icon}
                color={catColor}
                size={34}
              />
            ) : (
              <View style={[styles.catDot, { backgroundColor: catColor }]} />
            )}
            <View style={{ flex: 1, marginLeft: 10 }}>
              <View style={styles.rowTop}>
                <Text
                  style={{
                    color: t.text,
                    fontSize: 15,
                    flex: 1,
                    marginRight: 8,
                  }}
                  numberOfLines={1}
                >
                  {r.key}
                </Text>
                <Text
                  style={{ color: t.text, fontSize: 15, fontWeight: "600" }}
                >
                  {formatMoney(r.amount)}
                </Text>
              </View>
              <View style={styles.rowBottom}>
                <View style={[styles.track, { backgroundColor: t.border }]}>
                  <View
                    style={{
                      width: `${(r.amount / total) * 100}%`,
                      height: 4,
                      borderRadius: 2,
                      backgroundColor: color,
                    }}
                  />
                </View>
                <Text
                  style={{
                    color: t.muted,
                    fontSize: 12,
                    width: 38,
                    textAlign: "right",
                  }}
                >
                  {Math.round((r.amount / total) * 100)}%
                </Text>
              </View>
            </View>
          </View>
        );
      })}
      {rows.length > COLLAPSED_ROWS && (
        <Pressable onPress={onToggle} style={styles.more}>
          <Text style={{ color: t.primary, fontWeight: "600" }}>
            {expanded ? "Show less" : `Show all ${rows.length}`}
          </Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  filters: { flexDirection: "row", marginBottom: 12 },
  periodButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    minHeight: 50,
    borderRadius: 12,
    borderWidth: 1,
  },
  card: { padding: 16, borderRadius: 16, borderWidth: 1, marginBottom: 16 },
  net: {
    fontSize: 30,
    fontWeight: "800",
    textAlign: "center",
    marginTop: 2,
    marginBottom: 16,
  },
  groupToggle: { flexDirection: "row", marginBottom: 4 },
  list: { marginTop: 12 },
  listHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  catDot: { width: 12, height: 12, borderRadius: 6, marginHorizontal: 11 },
  rowTop: { flexDirection: "row", justifyContent: "space-between" },
  rowBottom: { flexDirection: "row", alignItems: "center", marginTop: 6 },
  track: { flex: 1, height: 4, borderRadius: 2, overflow: "hidden" },
  more: { alignItems: "center", paddingVertical: 10 },
});
