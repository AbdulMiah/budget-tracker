import { Ionicons } from "@expo/vector-icons";
import { format } from "date-fns";
import { router } from "expo-router";
import { useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { DonutRing } from "../../components/DonutRing";
import { EyeButton } from "../../components/EyeButton";
import { InfoTip } from "../../components/InfoTip";
import { RecurringRow } from "../../components/RecurringRow";
import { useTheme } from "../../components/theme";
import { CategoryBudget } from "../../lib/budget";
import { CATEGORY_COLORS } from "../../lib/categories";
import { useBudgetStatus } from "../../lib/useBudget";
import { useMoney } from "../../lib/useMoney";
import { useStore } from "../../store/useStore";

export default function BudgetScreen() {
  const t = useTheme();
  const { formatMoney } = useMoney();
  const accounts = useStore((s) => s.accounts);
  const accountById = useMemo(
    () => new Map(accounts.map((a) => [a.id, a])),
    [accounts]
  );
  const status = useBudgetStatus();
  const editBudget = () => router.push("/spending-limit");

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
          <View
            style={[
              styles.card,
              styles.empty,
              { backgroundColor: t.card, borderColor: t.border },
            ]}
          >
            <Ionicons name="wallet-outline" size={40} color={t.muted} />
            <Text style={[styles.emptyTitle, { color: t.text }]}>
              No budget set
            </Text>
            <Text style={{ color: t.muted, fontSize: 14, textAlign: "center" }}>
              Set a monthly spending limit to see what&apos;s left and how much
              you can spend each day.
            </Text>
            <Pressable
              onPress={editBudget}
              accessibilityRole="button"
              style={[styles.button, { backgroundColor: t.primary }]}
            >
              <Text style={{ color: "#fff", fontSize: 16, fontWeight: "700" }}>
                Set a budget
              </Text>
            </Pressable>
          </View>
        ) : (
          <>
            <View
              style={[
                styles.card,
                { backgroundColor: t.card, borderColor: t.border },
              ]}
            >
              <View style={styles.cardHeader}>
                <Text style={{ color: t.muted, fontSize: 13 }}>
                  {format(status.start, "d MMM")} –{" "}
                  {format(status.end, "d MMM yyyy")}
                </Text>
                <Pressable
                  onPress={editBudget}
                  hitSlop={10}
                  accessibilityRole="button"
                >
                  <Text
                    style={{
                      color: t.primary,
                      fontSize: 14,
                      fontWeight: "600",
                    }}
                  >
                    Edit
                  </Text>
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
                  <Text style={{ color: t.muted, fontSize: 13 }}>
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
                  <Text style={{ color: t.muted, fontSize: 12 }}>
                    of {formatMoney(status.limit)}
                  </Text>
                </DonutRing>
              </View>
              <View style={styles.legend}>
                <Key
                  color={t.spend}
                  label="Spent"
                  value={formatMoney(status.spent)}
                />
                <Key
                  color={t.committed}
                  label="Committed"
                  value={formatMoney(status.committed)}
                />
                <Key
                  color={t.border}
                  label="Left"
                  value={formatMoney(Math.max(0, status.remaining))}
                />
              </View>
            </View>

            <View
              style={[
                styles.card,
                styles.allowance,
                { backgroundColor: t.card, borderColor: t.border },
              ]}
            >
              <View
                style={[
                  styles.allowanceIcon,
                  { backgroundColor: t.primary + "1f" },
                ]}
              >
                <Ionicons name="today-outline" size={22} color={t.primary} />
              </View>
              <View style={{ flex: 1, marginHorizontal: 12 }}>
                <View style={styles.tipRow}>
                  <Text
                    style={{ color: t.text, fontSize: 16, fontWeight: "700" }}
                  >
                    Daily allowance
                  </Text>
                  <InfoTip
                    label="Daily allowance"
                    text={`${formatMoney(status.limit)} budget − ${formatMoney(status.spent)} spent − ${formatMoney(status.committed)} committed, shared across ${status.daysLeft} ${status.daysLeft === 1 ? "day" : "days"} left.`}
                  />
                </View>
                <Text style={{ color: t.muted, fontSize: 13, marginTop: 2 }}>
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
                <Text
                  style={{ fontSize: 13, fontWeight: "600", color: t.muted }}
                >
                  /day
                </Text>
              </Text>
            </View>

            {status.categories.length > 0 && (
              <>
                <Text style={[styles.section, { color: t.muted }]}>
                  CATEGORIES
                </Text>
                <View
                  style={[
                    styles.card,
                    { backgroundColor: t.card, borderColor: t.border },
                  ]}
                >
                  {status.categories.map((c, i) => (
                    <CategoryRow key={c.category} item={c} first={i === 0} />
                  ))}
                </View>
              </>
            )}

            <Text style={[styles.section, { color: t.muted }]}>
              COMMITTED THIS MONTH
            </Text>
            <View
              style={[
                styles.card,
                styles.list,
                { backgroundColor: t.card, borderColor: t.border },
              ]}
            >
              {status.upcoming.length === 0 ? (
                <Text
                  style={{
                    color: t.muted,
                    fontSize: 14,
                    textAlign: "center",
                    padding: 16,
                  }}
                >
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

function Key({
  color,
  label,
  value,
}: {
  color: string;
  label: string;
  value: string;
}) {
  const t = useTheme();
  return (
    <View
      style={styles.key}
      accessible
      accessibilityLabel={`${label} ${value}`}
    >
      <View style={styles.keyRow}>
        <View style={[styles.swatch, { backgroundColor: color }]} />
        <Text style={{ color: t.muted, fontSize: 13 }}>{label}</Text>
      </View>
      <Text
        style={{ color: t.text, fontSize: 16, fontWeight: "700", marginTop: 2 }}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {value}
      </Text>
    </View>
  );
}

function CategoryRow({
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
  return (
    <View
      style={[
        styles.categoryRow,
        !first && {
          borderTopColor: t.border,
          borderTopWidth: StyleSheet.hairlineWidth,
        },
      ]}
    >
      <View style={styles.categoryTop}>
        <View
          style={[
            styles.swatch,
            { backgroundColor: CATEGORY_COLORS[item.category] },
          ]}
        />
        <Text style={{ color: t.text, fontSize: 15, flex: 1 }}>
          {item.category}
        </Text>
        <Text
          style={{
            color: over ? t.spend : t.muted,
            fontSize: 13,
            fontWeight: "600",
          }}
        >
          {formatMoney(used)} of {formatMoney(item.limit)}
        </Text>
      </View>
      <View style={[styles.track, { backgroundColor: t.border }]}>
        <View
          style={{
            width: `${(item.spent / scale) * 100}%`,
            backgroundColor: over ? t.spend : CATEGORY_COLORS[item.category],
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
  screen: { flex: 1 },
  content: { padding: 16, paddingBottom: 32 },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  h1: { fontSize: 30, fontWeight: "800", marginBottom: 12 },
  card: { padding: 16, borderRadius: 16, borderWidth: 1, marginBottom: 12 },
  empty: { alignItems: "center", paddingVertical: 32, gap: 8 },
  emptyTitle: { fontSize: 18, fontWeight: "700" },
  button: {
    marginTop: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 14,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  ring: { alignItems: "center", marginVertical: 16 },
  left: { fontSize: 26, fontWeight: "800", maxWidth: 140 },
  legend: { flexDirection: "row", justifyContent: "space-between" },
  key: { flex: 1, alignItems: "center" },
  keyRow: { flexDirection: "row", alignItems: "center" },
  swatch: { width: 10, height: 10, borderRadius: 5, marginRight: 6 },
  allowance: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
  tipRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  allowanceIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  allowanceValue: { fontSize: 20, fontWeight: "800" },
  section: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.8,
    marginTop: 4,
    marginBottom: 8,
  },
  categoryRow: { paddingVertical: 10 },
  categoryTop: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  track: {
    flexDirection: "row",
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
  },
  list: { padding: 0, overflow: "hidden" },
  row: { paddingHorizontal: 16, paddingVertical: 12 },
  divider: { height: StyleSheet.hairlineWidth, marginLeft: 68 },
});
