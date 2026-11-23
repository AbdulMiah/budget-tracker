import { format } from "date-fns";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import {
  RefreshControl,
  ScrollView,
  SectionList,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Chip } from "@/components/Chip";
import { RecurringRow } from "@/components/RecurringRow";
import { useBankData } from "@/hooks/useBankData";
import { useMoney } from "@/hooks/useMoney";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { useTheme } from "@/hooks/useTheme";
import {
  detectRecurring,
  Direction,
  RecurringPayment,
} from "@/utils/recurring";

type Show = "all" | Direction;

const SHOW: { value: Show; label: string }[] = [
  { value: "all", label: "All" },
  { value: "out", label: "Spending" },
  { value: "in", label: "Income" },
];

export function RecurringScreen() {
  const t = useTheme();
  const { formatMoney, formatSigned } = useMoney();
  const { accounts, transactions, isPending, refetch } = useBankData();
  const { isRefreshing, onRefresh } = usePullToRefresh(refetch);
  const accountById = useMemo(
    () => new Map(accounts.map((a) => [a.id, a])),
    [accounts]
  );
  const [search, setSearch] = useState("");
  const [show, setShow] = useState<Show>("all");
  const showDetails = (item: RecurringPayment) =>
    router.push({ pathname: "/recurring/[key]", params: { key: item.key } });

  const items = useMemo(
    () => detectRecurring(transactions, new Date()),
    [transactions]
  );
  const monthlyOut = items.reduce(
    (sum, i) => (i.direction === "out" ? sum + i.monthlyCost : sum),
    0
  );
  const monthlyIn = items.reduce(
    (sum, i) => (i.direction === "in" ? sum + i.monthlyCost : sum),
    0
  );
  const shown =
    show === "all" ? items : items.filter((i) => i.direction === show);

  // Grouped by the month each payment is next due, soonest first (detectRecurring sorts by next date).
  const sections = useMemo(() => {
    const q = search.trim().toLowerCase();
    const groups = new Map<
      string,
      { title: string; total: number; data: RecurringPayment[] }
    >();
    for (const item of shown) {
      if (q && !item.merchant.toLowerCase().includes(q)) continue;
      const key = format(item.nextDate, "yyyy-MM");
      let group = groups.get(key);
      if (!group) {
        group = {
          title: format(item.nextDate, "MMMM yyyy"),
          total: 0,
          data: [],
        };
        groups.set(key, group);
      }
      // Income counts up and spending down, so a mixed month shows its net.
      group.total += item.direction === "in" ? item.amount : -item.amount;
      group.data.push(item);
    }
    return [...groups.values()];
  }, [shown, search]);

  return (
    <SafeAreaView
      style={[styles.screen, { backgroundColor: t.bg }]}
      edges={["bottom"]}
    >
      <SectionList
        sections={sections}
        keyExtractor={(i) => i.key}
        stickySectionHeadersEnabled
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor={t.muted}
          />
        }
        ListHeaderComponent={
          <View>
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search merchants"
              placeholderTextColor={t.muted}
              autoCorrect={false}
              clearButtonMode="while-editing"
              style={[
                styles.search,
                {
                  backgroundColor: t.card,
                  color: t.text,
                  borderColor: t.border,
                },
              ]}
            />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chips}
            >
              {SHOW.map((o) => (
                <Chip
                  key={o.value}
                  label={o.label}
                  selected={show === o.value}
                  onPress={() => setShow(o.value)}
                />
              ))}
            </ScrollView>
            <View
              style={[
                styles.summary,
                { backgroundColor: t.card, borderColor: t.border },
              ]}
            >
              {show === "all" ? (
                <View style={styles.split}>
                  <View>
                    <Text style={[styles.label, { color: t.muted }]}>
                      Out each month
                    </Text>
                    <Text style={[styles.mid, { color: t.text }]}>
                      {formatMoney(monthlyOut)}
                    </Text>
                  </View>
                  <View style={styles.right}>
                    <Text style={[styles.label, { color: t.muted }]}>
                      In each month
                    </Text>
                    <Text style={[styles.mid, { color: t.income }]}>
                      {formatMoney(monthlyIn)}
                    </Text>
                  </View>
                </View>
              ) : (
                <>
                  <Text style={[styles.label, { color: t.muted }]}>
                    {show === "out"
                      ? "Committed each month"
                      : "Expected each month"}
                  </Text>
                  <Text
                    style={[
                      styles.big,
                      { color: show === "in" ? t.income : t.text },
                    ]}
                  >
                    {formatMoney(show === "out" ? monthlyOut : monthlyIn)}
                  </Text>
                </>
              )}
              <Text style={[styles.label, { color: t.muted }]}>
                {shown.length} recurring{" "}
                {show === "in" ? "income payments" : "payments"}, detected
                automatically across all accounts
              </Text>
            </View>
          </View>
        }
        renderSectionHeader={({ section }) => (
          <View style={[styles.sectionHeader, { backgroundColor: t.bg }]}>
            <Text style={[styles.sectionTitle, { color: t.muted }]}>
              Due {section.title}
            </Text>
            <Text style={[styles.sectionTitle, { color: t.muted }]}>
              {show === "all"
                ? formatSigned(section.total)
                : formatMoney(Math.abs(section.total))}
            </Text>
          </View>
        )}
        renderItem={({ item }) => (
          <RecurringRow
            item={item}
            account={accountById.get(item.accountId)}
            style={styles.row}
            onPress={showDetails}
          />
        )}
        ItemSeparatorComponent={() => (
          <View style={[styles.divider, { backgroundColor: t.border }]} />
        )}
        ListEmptyComponent={
          !isPending ? (
            <Text style={[styles.empty, { color: t.muted }]}>
              {search
                ? "No recurring payments match your search."
                : "No recurring payments found yet."}
            </Text>
          ) : undefined
        }
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  search: {
    marginHorizontal: 16,
    marginTop: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    fontSize: 16,
  },
  chips: { paddingHorizontal: 16, paddingTop: 12 },
  label: { fontSize: 13 },
  right: { alignItems: "flex-end" },
  split: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  mid: { fontSize: 24, fontWeight: "800", marginTop: 2 },
  summary: {
    marginHorizontal: 16,
    marginTop: 12,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  big: { fontSize: 32, fontWeight: "800", marginVertical: 2 },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginTop: 8,
  },
  sectionTitle: { fontSize: 13, fontWeight: "600" },
  row: { paddingHorizontal: 16, paddingVertical: 12 },
  divider: { height: StyleSheet.hairlineWidth, marginLeft: 68 },
  empty: { textAlign: "center", marginTop: 40 },
  list: { paddingBottom: 24 },
});
