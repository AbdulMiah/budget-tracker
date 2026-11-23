import { Ionicons } from "@expo/vector-icons";
import { memo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { CATEGORY_COLORS } from "../lib/categories";
import { Account, Transaction } from "../lib/types";
import { useMoney } from "../lib/useMoney";
import { BANK_COLORS, useTheme } from "./theme";

export type IconName = React.ComponentProps<typeof Ionicons>["name"];

type AvatarProps = {
  merchant: string;
  icon?: string | null;
  color: string;
  size?: number;
};

/** Round badge showing the chosen icon, or the merchant's initial when none is set. */
export function TransactionAvatar({
  merchant,
  icon,
  color,
  size = 40,
}: AvatarProps) {
  return (
    <View
      style={[
        styles.dot,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color + "26",
        },
      ]}
    >
      {icon ? (
        <Ionicons name={icon as IconName} size={size / 2} color={color} />
      ) : (
        <Text style={[styles.initial, { color, fontSize: size * 0.4 }]}>
          {merchant.charAt(0).toUpperCase()}
        </Text>
      )}
    </View>
  );
}

type Props = {
  txn: Transaction;
  account?: Account;
  onPress?: (txn: Transaction) => void;
};

export const TransactionRow = memo(function TransactionRow({
  txn,
  account,
  onPress,
}: Props) {
  const t = useTheme();
  const { formatSigned } = useMoney();
  const isIncome = txn.amount > 0 && txn.category !== "Transfer";
  return (
    <Pressable
      onPress={onPress && (() => onPress(txn))}
      accessibilityRole="button"
      accessibilityHint="Edit category or icon"
      style={({ pressed }) => [
        styles.row,
        { backgroundColor: t.card, opacity: pressed ? 0.6 : 1 },
      ]}
    >
      <TransactionAvatar
        merchant={txn.merchant}
        icon={txn.icon}
        color={CATEGORY_COLORS[txn.category]}
      />
      <View style={styles.middle}>
        <Text style={[styles.merchant, { color: t.text }]} numberOfLines={1}>
          {txn.merchant}
        </Text>
        <View style={styles.meta}>
          <Text style={[styles.sub, { color: t.muted }]}>{txn.category}</Text>
          {account && (
            <>
              <Text style={[styles.sub, { color: t.muted }]}> · </Text>
              <View
                style={[
                  styles.bankDot,
                  { backgroundColor: BANK_COLORS[account.bank] },
                ]}
              />
              <Text style={[styles.sub, { color: t.muted }]} numberOfLines={1}>
                {account.name}
              </Text>
            </>
          )}
        </View>
      </View>
      <Text style={[styles.amount, { color: isIncome ? t.income : t.text }]}>
        {formatSigned(txn.amount)}
      </Text>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  dot: { alignItems: "center", justifyContent: "center" },
  initial: { fontWeight: "700" },
  middle: { flex: 1, marginHorizontal: 12 },
  merchant: { fontSize: 16, fontWeight: "600" },
  meta: { flexDirection: "row", alignItems: "center", marginTop: 2 },
  bankDot: { width: 7, height: 7, borderRadius: 4, marginRight: 4 },
  sub: { fontSize: 13 },
  amount: { fontSize: 16, fontWeight: "600" },
});
