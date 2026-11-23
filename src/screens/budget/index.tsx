import { Ionicons } from "@expo/vector-icons";
import { format } from "date-fns";
import { router } from "expo-router";
import { useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { DonutRing } from "@/components/DonutRing";
import { EyeButton } from "@/components/EyeButton";
import { InfoTip } from "@/components/InfoTip";
import { LegendKey } from "@/components/LegendKey";
import { RecurringRow } from "@/components/RecurringRow";
import { RADIUS, SPACING, WHITE } from "@/constants";
import { useBankData } from "@/hooks/useBankData";
import { useBudgetStatus } from "@/hooks/useBudgetStatus";
import { useMoney } from "@/hooks/useMoney";
import { useTheme } from "@/hooks/useTheme";
import { CategoryBudgetRow } from "@/screens/budget/components/CategoryBudgetRow";

export function BudgetScreen() {
  const t = useTheme();
  const { formatMoney } = useMoney();
  const { accounts } = useBankData();
  const accountById = useMemo(
    () => new Map(accounts.map((a) => [a.id, a])),
    [accounts]
  );
  const status = useBudgetStatus();
  const editBudget = () => router.push("/spending-limit");
  const cardColors = { backgroundColor: t.card, borderColor: t.border };

  return (
    <SafeAreaView
      style={[styles.screen, { backgroundColor: t.bg }]}
      edges={["top"]}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.titleRow}>
          <Text style={[styles.h1, { color: t.text }]}>Budget</Text>
          <EyeButton />
        </View>

        {!status ? (
          <View style={[styles.card, styles.empty, cardColors]}>
            <Ionicons name="wallet-outline" size={40} color={t.muted} />
            <Text style={[styles.emptyTitle, { color: t.text }]}>
              No budget set
            </Text>
            <Text style={[styles.emptyText, { color: t.muted }]}>
              Set a monthly spending limit to see what&apos;s left and how much
              you can spend each day.
            </Text>
            <Pressable
              onPress={editBudget}
              accessibilityRole="button"
              style={[styles.button, { backgroundColor: t.primary }]}
            >
              <Text style={styles.buttonText}>Set a budget</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <View style={[styles.card, cardColors]}>
              <View style={styles.cardHeader}>
                <Text style={[styles.dates, { color: t.muted }]}>
                  {format(status.start, "d MMM")} –{" "}
                  {format(status.end, "d MMM yyyy")}
                </Text>
                <Pressable
                  onPress={editBudget}
                  hitSlop={10}
                  accessibilityRole="button"
                >
                  <Text style={[styles.edit, { color: t.primary }]}>Edit</Text>
                </Pressable>
              </View>
              <View style={styles.ring}>
                <DonutRing
                  segments={[
                    { key: "spent", value: status.spent, color: t.spend },
                    {
                      key: "committed",
                      value: status.committed,
                      color: t.committed,
                    },
                  ]}
                  total={Math.max(
                    status.limit,
                    status.spent + status.committed
                  )}
                  size={200}
                  stroke={22}
                >
                  <Text style={[styles.ringLabel, { color: t.muted }]}>
                    {status.remaining < 0 ? "Over by" : "Left"}
                  </Text>
                  <Text
                    style={[
                      styles.left,
                      { color: status.remaining < 0 ? t.spend : t.text },
                    ]}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                  >
                    {formatMoney(Math.abs(status.remaining))}
                  </Text>
                  <Text style={[styles.ringOf, { color: t.muted }]}>
                    of {formatMoney(status.limit)}
                  </Text>
                </DonutRing>
              </View>
              <View style={styles.legend}>
                <LegendKey
                  color={t.spend}
                  label="Spent"
                  value={formatMoney(status.spent)}
                />
                <LegendKey
                  color={t.committed}
                  label="Committed"
                  value={formatMoney(status.committed)}
                />
                <LegendKey
                  color={t.border}
                  label="Left"
                  value={formatMoney(Math.max(0, status.remaining))}
                />
              </View>
            </View>

            <View style={[styles.card, styles.allowance, cardColors]}>
              <View
                style={[
                  styles.allowanceIcon,
                  { backgroundColor: t.primary + "1f" },
                ]}
              >
                <Ionicons name="today-outline" size={22} color={t.primary} />
              </View>
              <View style={styles.allowanceText}>
                <View style={styles.tipRow}>
                  <Text style={[styles.allowanceTitle, { color: t.text }]}>
                    Daily allowance
                  </Text>
                  <InfoTip
                    label="Daily allowance"
                    text={`${formatMoney(status.limit)} budget − ${formatMoney(status.spent)} spent − ${formatMoney(status.committed)} committed, shared across ${status.daysLeft} ${status.daysLeft === 1 ? "day" : "days"} left.`}
                  />
                </View>
                <Text style={[styles.allowanceSub, { color: t.muted }]}>
                  {status.remaining < 0
                    ? "Spending and commitments are over your limit"
                    : `For ${status.daysLeft === 1 ? "today" : `the next ${status.daysLeft} days`}, until ${format(status.end, "d MMM")}`}
                </Text>
              </View>
              <Text
                style={[
                  styles.allowanceValue,
                  { color: status.remaining < 0 ? t.spend : t.text },
                ]}
              >
                {formatMoney(status.dailyAllowance)}
                <Text style={[styles.perDay, { color: t.muted }]}>/day</Text>
              </Text>
            </View>

            {status.categories.length > 0 && (
              <>
                <Text style={[styles.section, { color: t.muted }]}>
                  CATEGORIES
                </Text>
                <View style={[styles.card, cardColors]}>
                  {status.categories.map((c, i) => (
                    <CategoryBudgetRow
                      key={c.category}
                      item={c}
                      first={i === 0}
                    />
                  ))}
                </View>
              </>
            )}

            <Text style={[styles.section, { color: t.muted }]}>
              COMMITTED THIS MONTH
            </Text>
            <View style={[styles.card, styles.list, cardColors]}>
              {status.upcoming.length === 0 ? (
                <Text style={[styles.noUpcoming, { color: t.muted }]}>
                  No more recurring payments due this month.
                </Text>
              ) : (
                status.upcoming.map((u, i) => (
                  <View key={`${u.payment.key}-${u.date.getTime()}`}>
                    {i > 0 && (
                      <View
                        style={[styles.divider, { backgroundColor: t.border }]}
                      />
                    )}
                    <RecurringRow
                      // A weekly payment can fall more than once, so show each charge's own date.
                      item={{ ...u.payment, nextDate: u.date }}
                      account={accountById.get(u.payment.accountId)}
                      style={styles.row}
                      onPress={(p) =>
                        router.push({
                          pathname: "/recurring/[key]",
                          params: { key: p.key },
                        })
                      }
                    />
                  </View>
                ))
              )}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: SPACING.four, paddingBottom: SPACING.six },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  h1: { fontSize: 30, fontWeight: "800", marginBottom: SPACING.three },
  card: {
    padding: SPACING.four,
    borderRadius: RADIUS.large,
    borderWidth: 1,
    marginBottom: SPACING.three,
  },
  empty: {
    alignItems: "center",
    paddingVertical: SPACING.six,
    gap: SPACING.two,
  },
  emptyTitle: { fontSize: 18, fontWeight: "700" },
  emptyText: { fontSize: 14, textAlign: "center" },
  button: {
    marginTop: SPACING.two,
    paddingVertical: SPACING.three,
    paddingHorizontal: SPACING.five,
    borderRadius: 14,
  },
  buttonText: { color: WHITE, fontSize: 16, fontWeight: "700" },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dates: { fontSize: 13 },
  edit: { fontSize: 14, fontWeight: "600" },
  ring: { alignItems: "center", marginVertical: SPACING.four },
  ringLabel: { fontSize: 13 },
  left: { fontSize: 26, fontWeight: "800", maxWidth: 140 },
  ringOf: { fontSize: 12 },
  legend: { flexDirection: "row", justifyContent: "space-between" },
  allowance: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: SPACING.four,
  },
  allowanceIcon: {
    width: 42,
    height: 42,
    borderRadius: RADIUS.medium,
    alignItems: "center",
    justifyContent: "center",
  },
  allowanceText: { flex: 1, marginHorizontal: SPACING.three },
  tipRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  allowanceTitle: { fontSize: 16, fontWeight: "700" },
  allowanceSub: { fontSize: 13, marginTop: SPACING.half },
  allowanceValue: { fontSize: 20, fontWeight: "800" },
  perDay: { fontSize: 13, fontWeight: "600" },
  section: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.8,
    marginTop: SPACING.one,
    marginBottom: SPACING.two,
  },
  list: { padding: 0, overflow: "hidden" },
  noUpcoming: { fontSize: 14, textAlign: "center", padding: SPACING.four },
  row: { paddingHorizontal: SPACING.four, paddingVertical: SPACING.three },
  divider: { height: StyleSheet.hairlineWidth, marginLeft: 68 },
});
