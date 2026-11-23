import { format, parseISO } from "date-fns";
import { useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  SectionList,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AccountFilterButton } from "@/components/AccountFilterButton";
import { AccountFilterSheet } from "@/components/AccountFilterSheet";
import { Chip } from "@/components/Chip";
import { TransactionEditModal } from "@/components/TransactionEditModal";
import { TransactionRow } from "@/components/TransactionRow";
import { Category, CATEGORIES, Transaction } from "@/constants/types";
import { useMoney } from "@/hooks/useMoney";
import { useTheme } from "@/hooks/useTheme";
import { PickerModal } from "@/screens/transactions/components/PickerModal";
import { useStore } from "@/store/useStore";

export function TransactionsScreen() {
  const t = useTheme();
  const { formatMoney } = useMoney();
  const { accounts, transactions, loading, error, load, setOverride } =
    useStore();

  // Opened from an account on the Net worth page, the list starts filtered to that account.
  const { account } = useLocalSearchParams<{ account?: string }>();
  // Empty means every account.
  const [accountIds, setAccountIds] = useState<string[]>(
    account ? [account] : []
  );
  const [accountSheet, setAccountSheet] = useState(false);
  // Empty means no filter.
  const [categories, setCategories] = useState<Category[]>([]);
  const [merchantFilter, setMerchantFilter] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [picker, setPicker] = useState<"category" | "merchant" | null>(null);
  const [editing, setEditing] = useState<Transaction | null>(null);

  const accountById = useMemo(
    () => new Map(accounts.map((a) => [a.id, a])),
    [accounts]
  );
  const merchants = useMemo(
    () =>
      [...new Set(transactions.map((x) => x.merchant))].sort((a, b) =>
        a.localeCompare(b)
      ),
    [transactions]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const onlyAccounts = accountIds.length ? new Set(accountIds) : null;
    const onlyCategories = categories.length
      ? new Set<string>(categories)
      : null;
    const onlyMerchants = merchantFilter.length
      ? new Set(merchantFilter)
      : null;
    return transactions.filter(
      (x) =>
        (!onlyAccounts || onlyAccounts.has(x.accountId)) &&
        (!onlyCategories || onlyCategories.has(x.category)) &&
        (!onlyMerchants || onlyMerchants.has(x.merchant)) &&
        (!q || x.merchant.toLowerCase().includes(q))
    );
  }, [transactions, accountIds, categories, merchantFilter, search]);

  const sections = useMemo(() => {
    const byDay = new Map<string, typeof filtered>();
    for (const x of filtered)
      byDay.set(x.date, [...(byDay.get(x.date) ?? []), x]);
    return [...byDay].map(([date, data]) => ({ date, data }));
  }, [filtered]);

  const filtersActive = !!(
    accountIds.length ||
    categories.length ||
    merchantFilter.length ||
    search
  );

  return (
    <SafeAreaView
      style={[styles.screen, { backgroundColor: t.bg }]}
      edges={["bottom"]}
    >
      <SectionList
        sections={sections}
        keyExtractor={(x) => x.id}
        stickySectionHeadersEnabled
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={load}
            tintColor={t.muted}
          />
        }
        ListHeaderComponent={
          <View>
            <View style={styles.searchRow}>
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
              <AccountFilterButton
                count={accountIds.length}
                onPress={() => setAccountSheet(true)}
              />
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chips}
            >
              <Chip
                label={filterLabel("Category", "Categories", categories)}
                selected={categories.length > 0}
                onPress={() => setPicker("category")}
              />
              <Chip
                label={filterLabel("Merchant", "Merchants", merchantFilter)}
                selected={merchantFilter.length > 0}
                onPress={() => setPicker("merchant")}
              />
              {filtersActive && (
                <Pressable
                  onPress={() => {
                    setAccountIds([]);
                    setCategories([]);
                    setMerchantFilter([]);
                    setSearch("");
                  }}
                  style={styles.clear}
                >
                  <Text style={{ color: t.primary, fontWeight: "600" }}>
                    Clear
                  </Text>
                </Pressable>
              )}
            </ScrollView>
            {error && (
              <Text style={[styles.error, { color: t.spend }]}>{error}</Text>
            )}
            {loading && transactions.length === 0 && (
              <ActivityIndicator style={{ marginTop: 24 }} />
            )}
          </View>
        }
        renderSectionHeader={({ section }) => (
          <View style={[styles.sectionHeader, { backgroundColor: t.bg }]}>
            <Text style={[styles.sectionTitle, { color: t.muted }]}>
              {format(parseISO(section.date), "EEEE d MMMM")}
            </Text>
            <Text style={[styles.sectionTitle, { color: t.muted }]}>
              {formatMoney(
                section.data.reduce(
                  (s, x) => (x.category === "Transfer" ? s : s + x.amount),
                  0
                )
              )}
            </Text>
          </View>
        )}
        renderItem={({ item }) => (
          <TransactionRow
            txn={item}
            account={accountById.get(item.accountId)}
            onPress={setEditing}
          />
        )}
        ListEmptyComponent={
          !loading ? (
            <Text style={[styles.empty, { color: t.muted }]}>
              No transactions match these filters.
            </Text>
          ) : undefined
        }
        contentContainerStyle={{ paddingBottom: 24 }}
      />

      <PickerModal
        visible={picker === "category"}
        title="Category"
        options={[...CATEGORIES]}
        selected={categories}
        onApply={(v) => setCategories(v as Category[])}
        onClose={() => setPicker(null)}
      />
      <PickerModal
        visible={picker === "merchant"}
        title="Merchant"
        options={merchants}
        selected={merchantFilter}
        searchable
        onApply={setMerchantFilter}
        onClose={() => setPicker(null)}
      />
      <AccountFilterSheet
        visible={accountSheet}
        accounts={accounts}
        selected={accountIds}
        onApply={setAccountIds}
        onClose={() => setAccountSheet(false)}
      />
      <TransactionEditModal
        txn={editing}
        onSave={(txn, override, all) => setOverride(txn.id, override, all)}
        onClose={() => setEditing(null)}
      />
    </SafeAreaView>
  );
}

/** "Category", "Category: Groceries", or "Categories: 3". */
function filterLabel(singular: string, plural: string, values: string[]) {
  if (values.length === 0) return singular;
  if (values.length === 1) return `${singular}: ${values[0]}`;
  return `${plural}: ${values.length}`;
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  searchRow: { flexDirection: "row", marginHorizontal: 16, marginTop: 12 },
  search: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    fontSize: 16,
  },
  chips: { paddingHorizontal: 16, paddingTop: 12, alignItems: "center" },
  clear: { paddingHorizontal: 8, paddingVertical: 8 },
  error: { margin: 16 },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginTop: 8,
  },
  sectionTitle: { fontSize: 13, fontWeight: "600" },
  empty: { textAlign: "center", marginTop: 40 },
});
