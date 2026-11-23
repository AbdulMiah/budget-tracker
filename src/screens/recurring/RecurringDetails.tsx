import { format, parseISO } from "date-fns";
import { Stack, useLocalSearchParams } from "expo-router";
import { useMemo } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { CATEGORY_COLORS, FREQUENCY_LABELS } from "@/constants";
import { useBankData } from "@/hooks/useBankData";
import { useMoney } from "@/hooks/useMoney";
import { useTheme } from "@/hooks/useTheme";
import { AccountLabel } from "@/screens/recurring/components/AccountLabel";
import { Detail } from "@/screens/recurring/components/Detail";
import { dueIn } from "@/utils/helpers";
import { detectRecurring } from "@/utils/recurring";

export function RecurringDetailsScreen() {
  const t = useTheme();
  const { formatMoney, formatSigned } = useMoney();
  const { key } = useLocalSearchParams<{ key: string }>();
  const { accounts, transactions } = useBankData();
  const accountById = useMemo(
    () => new Map(accounts.map((a) => [a.id, a])),
    [accounts]
  );
  const item = useMemo(
    () => detectRecurring(transactions, new Date()).find((r) => r.key === key),
    [transactions, key]
  );

  if (!item) {
    return (
      <SafeAreaView
        style={[styles.screen, { backgroundColor: t.bg }]}
        edges={["bottom"]}
      >
        <Stack.Screen options={{ title: "Recurring payment" }} />
        <Text style={[styles.empty, { color: t.muted }]}>
          This payment is no longer detected as recurring.
        </Text>
      </SafeAreaView>
    );
  }

  const color = CATEGORY_COLORS[item.category];
  const account = accountById.get(item.accountId);
  const isIncome = item.direction === "in";
  const paid = item.history.reduce((sum, x) => sum + Math.abs(x.amount), 0);
  const first = item.history[item.history.length - 1];
  const cardColors = { backgroundColor: t.card, borderColor: t.border };

  return (
    <SafeAreaView
      style={[styles.screen, { backgroundColor: t.bg }]}
      edges={["bottom"]}
    >
      <Stack.Screen options={{ title: item.merchant }} />
      <FlatList
        data={item.history}
        keyExtractor={(x) => x.id}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <View>
            <View style={[styles.card, styles.hero, cardColors]}>
              <View style={[styles.badge, { backgroundColor: color + "26" }]}>
                <Text style={[styles.initial, { color }]}>
                  {item.merchant.charAt(0)}
                </Text>
              </View>
              <Text
                style={[styles.merchant, { color: t.text }]}
                numberOfLines={1}
              >
                {item.merchant}
              </Text>
              <Text style={[styles.meta, { color: t.muted }]}>
                {item.category}
              </Text>
              <Text
                style={[styles.amount, { color: isIncome ? t.income : t.text }]}
              >
                {isIncome
                  ? formatSigned(item.amount)
                  : formatMoney(item.amount)}
              </Text>
              <Text style={[styles.meta, { color: t.muted }]}>
                {FREQUENCY_LABELS[item.frequency]}
              </Text>
            </View>

            <View style={[styles.card, styles.next, cardColors]}>
              <View style={styles.fill}>
                <Text style={[styles.label, { color: t.muted }]}>
                  Next payment
                </Text>
                <Text style={[styles.nextDate, { color: t.text }]}>
                  {format(item.nextDate, "EEEE d MMMM")}
                </Text>
              </View>
              <View
                style={[styles.pill, { backgroundColor: t.primary + "1f" }]}
              >
                <Text style={[styles.pillText, { color: t.primary }]}>
                  {dueIn(item.nextDate)}
                </Text>
              </View>
            </View>

            <View style={[styles.card, cardColors]}>
              <Detail label="Frequency">{item.frequency}</Detail>
              <Detail label="Account">
                <AccountLabel account={account} />
              </Detail>
              {item.frequency !== "Monthly" && (
                <Detail label={isIncome ? "Monthly income" : "Monthly cost"}>
                  {formatMoney(item.monthlyCost)}
                </Detail>
              )}
              <Detail label={isIncome ? "Last received" : "Last paid"}>
                {format(item.lastDate, "d MMM yyyy")}
              </Detail>
              <Detail label={isIncome ? "Received so far" : "Paid so far"} last>
                {formatMoney(paid)}
              </Detail>
              <Text style={[styles.count, { color: t.muted }]}>
                {item.history.length} payments since{" "}
                {format(parseISO(first.date), "d MMM yyyy")}
              </Text>
            </View>

            <Text style={[styles.section, { color: t.muted }]}>
              {isIncome ? "PAST INCOME" : "PAST PAYMENTS"}
            </Text>
          </View>
        }
        renderItem={({ item: txn, index }) => (
          <View
            style={[
              styles.historyRow,
              { backgroundColor: t.card, borderColor: t.border },
              index === 0 && styles.firstRow,
              index === item.history.length - 1 && styles.lastRow,
              index > 0 && styles.dividedRow,
            ]}
          >
            <View style={styles.historyText}>
              <Text style={[styles.historyValue, { color: t.text }]}>
                {format(parseISO(txn.date), "EEE d MMM yyyy")}
              </Text>
              <View style={styles.historyAccount}>
                <AccountLabel account={accountById.get(txn.accountId)} />
              </View>
            </View>
            <Text
              style={[
                styles.historyValue,
                { color: isIncome ? t.income : t.text },
              ]}
            >
              {formatSigned(txn.amount)}
            </Text>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: 16, paddingBottom: 32 },
  card: { borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 12 },
  hero: { alignItems: "center", paddingVertical: 20 },
  badge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  initial: { fontWeight: "800", fontSize: 24 },
  merchant: { fontSize: 20, fontWeight: "700" },
  meta: { fontSize: 14 },
  amount: { fontSize: 32, fontWeight: "800", marginTop: 10 },
  next: { flexDirection: "row", alignItems: "center" },
  fill: { flex: 1 },
  label: { fontSize: 13 },
  nextDate: { fontSize: 18, fontWeight: "700", marginTop: 2 },
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    marginLeft: 12,
  },
  pillText: { fontSize: 13, fontWeight: "700" },
  count: { fontSize: 12, marginTop: 8 },
  section: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.8,
    marginTop: 8,
    marginBottom: 8,
  },
  historyRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderLeftWidth: 1,
    borderRightWidth: 1,
  },
  dividedRow: { borderTopWidth: StyleSheet.hairlineWidth },
  historyText: { flex: 1, marginRight: 12 },
  historyValue: { fontSize: 15, fontWeight: "600" },
  historyAccount: { marginTop: 2 },
  firstRow: {
    borderTopWidth: 1,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  lastRow: {
    borderBottomWidth: 1,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  empty: { textAlign: "center", marginTop: 40, paddingHorizontal: 24 },
});
