import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { BottomSheet } from "@/components/BottomSheet";
import { BANK_COLORS, BANK_NAMES } from "@/constants";
import { Account } from "@/constants/types";
import { useMoney } from "@/hooks/useMoney";
import { useTheme } from "@/hooks/useTheme";

type Props = {
  visible: boolean;
  accounts: Account[];
  /** Selected account ids; empty means every account. */
  selected: string[];
  onApply: (ids: string[]) => void;
  onClose: () => void;
};

/** Bottom sheet for choosing which accounts the transaction list shows. Several can be ticked at once. */
export function AccountFilterSheet({ visible, onClose, ...rest }: Props) {
  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <Body onClose={onClose} {...rest} />
    </BottomSheet>
  );
}

function Body({
  accounts,
  selected,
  onApply,
  onClose,
}: Omit<Props, "visible">) {
  const t = useTheme();
  const { formatMoney } = useMoney();
  // Work on a draft so closing the sheet without applying leaves the filter as it was.
  const [draft, setDraft] = useState<Set<string>>(
    () => new Set(selected.length ? selected : accounts.map((a) => a.id))
  );

  const allSelected = draft.size === accounts.length;
  const toggle = (id: string) =>
    setDraft((d) => {
      const next = new Set(d);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const apply = () => {
    // Every account ticked is the same as no filter.
    onApply(allSelected ? [] : [...draft]);
    onClose();
  };

  const groups = [
    {
      title: "Current accounts",
      items: accounts.filter((a) => a.type === "current"),
    },
    {
      title: "Credit cards",
      items: accounts.filter((a) => a.type === "credit"),
    },
  ].filter((g) => g.items.length);

  return (
    <View>
      <View style={styles.header}>
        <Text style={{ color: t.text, fontSize: 18, fontWeight: "700" }}>
          Accounts
        </Text>
        <Pressable
          onPress={() =>
            setDraft(
              allSelected ? new Set() : new Set(accounts.map((a) => a.id))
            )
          }
          hitSlop={10}
        >
          <Text style={{ color: t.primary, fontSize: 15, fontWeight: "600" }}>
            {allSelected ? "Deselect all" : "Select all"}
          </Text>
        </Pressable>
      </View>

      <ScrollView style={styles.list}>
        {groups.map((g) => (
          <View key={g.title}>
            <Text style={[styles.groupTitle, { color: t.muted }]}>
              {g.title.toUpperCase()}
            </Text>
            {g.items.map((a) => {
              const on = draft.has(a.id);
              return (
                <Pressable
                  key={a.id}
                  onPress={() => toggle(a.id)}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: on }}
                  style={[styles.row, { borderBottomColor: t.border }]}
                >
                  <View
                    style={[
                      styles.dot,
                      { backgroundColor: BANK_COLORS[a.bank] },
                    ]}
                  />
                  <View style={{ flex: 1, marginRight: 12 }}>
                    <Text
                      style={{ color: t.text, fontSize: 16, fontWeight: "600" }}
                      numberOfLines={1}
                    >
                      {a.name}
                    </Text>
                    <Text style={{ color: t.muted, fontSize: 13 }}>
                      {BANK_NAMES[a.bank]}
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.balance,
                      { color: a.balance < 0 ? t.spend : t.text },
                    ]}
                  >
                    {formatMoney(a.balance)}
                  </Text>
                  <Ionicons
                    name={on ? "checkbox" : "square-outline"}
                    size={24}
                    color={on ? t.primary : t.muted}
                  />
                </Pressable>
              );
            })}
          </View>
        ))}
      </ScrollView>

      <Pressable
        onPress={apply}
        disabled={draft.size === 0}
        accessibilityRole="button"
        style={[
          styles.apply,
          { backgroundColor: draft.size ? t.primary : t.border },
        ]}
      >
        <Text style={{ color: "#fff", fontSize: 16, fontWeight: "700" }}>
          {draft.size === 0 ? "Select at least one account" : "Apply"}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
  },
  list: { flexGrow: 0 },
  groupTitle: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.8,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  dot: { width: 12, height: 12, borderRadius: 6, marginRight: 12 },
  balance: { fontSize: 15, fontWeight: "600", marginRight: 12 },
  apply: {
    marginHorizontal: 16,
    marginTop: 16,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
  },
});
