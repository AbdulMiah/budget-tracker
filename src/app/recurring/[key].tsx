import {
  differenceInCalendarDays,
  format,
  parseISO,
  startOfDay,
} from "date-fns";
import { Stack, useLocalSearchParams } from "expo-router";
import { ReactNode, useMemo } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { BANK_COLORS, useTheme } from "../../components/theme";
import { CATEGORY_COLORS } from "../../lib/categories";
import { detectRecurring, Frequency } from "../../lib/recurring";
import { Account } from "../../lib/types";
import { useMoney } from "../../lib/useMoney";
import { useStore } from "../../store/useStore";

const EVERY: Record<Frequency, string> = {
  Weekly: "Every week",
  Fortnightly: "Every 2 weeks",
  Monthly: "Every month",
  Yearly: "Every year",
};

function dueIn(date: Date) {
  const days = differenceInCalendarDays(date, startOfDay(new Date()));
  if (days <= 0) return "Due today";
  if (days === 1) return "Due tomorrow";
  return `Due in ${days} days`;
}

export default function RecurringDetailScreen() {
  const t = useTheme();
  const { formatMoney, formatSigned } = useMoney();
  const { key } = useLocalSearchParams<{ key: string }>();
  const { accounts, transactions } = useStore();
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
            <View
              style={[
                styles.card,
                styles.hero,
                { backgroundColor: t.card, borderColor: t.border },
              ]}
            >
              <View style={[styles.badge, { backgroundColor: color + "26" }]}>
                <Text style={{ color, fontWeight: "800", fontSize: 24 }}>
                  {item.merchant.charAt(0)}
                </Text>
              </View>
              <Text
                style={[styles.merchant, { color: t.text }]}
                numberOfLines={1}
              >
                {item.merchant}
              </Text>
              <Text style={{ color: t.muted, fontSize: 14 }}>
                {item.category}
              </Text>
              <Text
                style={[styles.amount, { color: isIncome ? t.income : t.text }]}
              >
                {isIncome
                  ? formatSigned(item.amount)
                  : formatMoney(item.amount)}
              </Text>
              <Text style={{ color: t.muted, fontSize: 14 }}>
                {EVERY[item.frequency]}
              </Text>
            </View>

            <View
              style={[
                styles.card,
                styles.next,
                { backgroundColor: t.card, borderColor: t.border },
              ]}
            >
              <View style={{ flex: 1 }}>
                <Text style={{ color: t.muted, fontSize: 13 }}>
                  Next payment
                </Text>
                <Text
                  style={{
                    color: t.text,
                    fontSize: 18,
                    fontWeight: "700",
                    marginTop: 2,
                  }}
                >
                  {format(item.nextDate, "EEEE d MMMM")}
                </Text>
              </View>
              <View
                style={[styles.pill, { backgroundColor: t.primary + "1f" }]}
              >
                <Text
                  style={{ color: t.primary, fontSize: 13, fontWeight: "700" }}
                >
                  {dueIn(item.nextDate)}
                </Text>
              </View>
            </View>

            <View
              style={[
                styles.card,
                { backgroundColor: t.card, borderColor: t.border },
              ]}
            >
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
              <Text style={{ color: t.muted, fontSize: 12, marginTop: 8 }}>
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
              index > 0 && { borderTopWidth: StyleSheet.hairlineWidth },
            ]}
          >
            <View style={{ flex: 1, marginRight: 12 }}>
              <Text style={{ color: t.text, fontSize: 15, fontWeight: "600" }}>
                {format(parseISO(txn.date), "EEE d MMM yyyy")}
              </Text>
              <View style={{ marginTop: 2 }}>
                <AccountLabel account={accountById.get(txn.accountId)} />
              </View>
            </View>
            <Text
              style={{
                color: isIncome ? t.income : t.text,
                fontSize: 15,
                fontWeight: "600",
              }}
            >
              {formatSigned(txn.amount)}
            </Text>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

function Detail({
  label,
  last,
  children,
}: {
  label: string;
  last?: boolean;
  children: ReactNode;
}) {
  const t = useTheme();
  return (
    <View
      style={[
        styles.detail,
        !last && {
          borderBottomColor: t.border,
          borderBottomWidth: StyleSheet.hairlineWidth,
        },
      ]}
    >
      <Text style={{ color: t.muted, fontSize: 15 }}>{label}</Text>
      {typeof children === "string" ? (
        <Text style={{ color: t.text, fontSize: 15, fontWeight: "600" }}>
          {children}
        </Text>
      ) : (
        children
      )}
    </View>
  );
}

function AccountLabel({ account }: { account?: Account }) {
  const t = useTheme();
  if (!account)
    return (
      <Text style={{ color: t.muted, fontSize: 13 }}>Unknown account</Text>
    );
  return (
    <View style={styles.account}>
      <View
        style={[styles.bankDot, { backgroundColor: BANK_COLORS[account.bank] }]}
      />
      <Text style={{ color: t.muted, fontSize: 13 }} numberOfLines={1}>
        {account.name}
      </Text>
    </View>
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
  merchant: { fontSize: 20, fontWeight: "700" },
  amount: { fontSize: 32, fontWeight: "800", marginTop: 10 },
  next: { flexDirection: "row", alignItems: "center" },
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    marginLeft: 12,
  },
  detail: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
  },
  account: { flexDirection: "row", alignItems: "center" },
  bankDot: { width: 7, height: 7, borderRadius: 4, marginRight: 4 },
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
