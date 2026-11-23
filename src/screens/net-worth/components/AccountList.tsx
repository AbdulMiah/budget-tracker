import { Ionicons } from "@expo/vector-icons";
import { Fragment } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { BANK_COLORS, BANK_NAMES } from "@/constants";
import { Account } from "@/constants/types";
import { useMoney } from "@/hooks/useMoney";
import { useTheme } from "@/hooks/useTheme";

type Props = {
  title: string;
  accounts: Account[];
  emptyText: string;
  onPressAccount?: (account: Account) => void;
};

/** A card listing each account's balance, with the total beside the section title. */
export function AccountList({
  title,
  accounts,
  emptyText,
  onPressAccount,
}: Props) {
  const t = useTheme();
  const { formatMoney } = useMoney();
  const total = accounts.reduce((sum, a) => sum + a.balance, 0);
  const balanceColor = (pence: number) => (pence < 0 ? t.spend : t.text);

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: t.text }]}>{title}</Text>
        {accounts.length > 0 && (
          <Text style={[styles.title, { color: balanceColor(total) }]}>
            {formatMoney(total)}
          </Text>
        )}
      </View>
      <View
        style={[
          styles.card,
          { backgroundColor: t.card, borderColor: t.border },
        ]}
      >
        {accounts.map((a, i) => (
          <Fragment key={a.id}>
            {i > 0 && (
              <View style={[styles.divider, { backgroundColor: t.border }]} />
            )}
            <Pressable
              onPress={onPressAccount && (() => onPressAccount(a))}
              disabled={!onPressAccount}
              accessibilityRole={onPressAccount ? "button" : undefined}
              accessibilityHint={
                onPressAccount ? `Shows ${a.name} transactions` : undefined
              }
              style={({ pressed }) => [styles.row, pressed && styles.pressed]}
            >
              <View
                style={[styles.dot, { backgroundColor: BANK_COLORS[a.bank] }]}
              />
              <View style={styles.text}>
                <Text
                  style={[styles.name, { color: t.text }]}
                  numberOfLines={1}
                >
                  {a.name}
                </Text>
                <Text style={[styles.bank, { color: t.muted }]}>
                  {BANK_NAMES[a.bank]}
                </Text>
              </View>
              <Text style={[styles.name, { color: balanceColor(a.balance) }]}>
                {formatMoney(a.balance)}
              </Text>
              {onPressAccount && (
                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color={t.muted}
                  style={styles.chevron}
                />
              )}
            </Pressable>
          </Fragment>
        ))}
        {accounts.length === 0 && (
          <Text style={[styles.empty, { color: t.muted }]}>{emptyText}</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginBottom: 16 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    marginTop: 8,
    marginBottom: 10,
  },
  title: { fontSize: 18, fontWeight: "700" },
  card: { borderRadius: 16, borderWidth: 1, overflow: "hidden" },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  pressed: { opacity: 0.6 },
  text: { flex: 1, marginRight: 12 },
  name: { fontSize: 16, fontWeight: "600" },
  bank: { fontSize: 13 },
  chevron: { marginLeft: 8 },
  dot: { width: 12, height: 12, borderRadius: 6, marginRight: 12 },
  divider: { height: StyleSheet.hairlineWidth, marginLeft: 40 },
  empty: { padding: 16, textAlign: "center" },
});
