import { Ionicons } from "@expo/vector-icons";
import { format, parseISO } from "date-fns";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";

import { BANK_COLORS, CATEGORY_COLORS } from "@/constants";
import { Account } from "@/constants/types";
import { useMoney } from "@/hooks/useMoney";
import { useSettings } from "@/hooks/useSettings";
import { useTheme } from "@/hooks/useTheme";
import { PaymentEntry } from "@/utils/zakat";

type Props = {
  payment: PaymentEntry;
  account?: Account;
  /** Shown instead of the full amount, e.g. the part of a payment counted towards one year. */
  amount?: number;
};

/** One zakat payment. Tapping a manual one offers to delete it; bank ones are edited from Transactions. */
export function ZakatPaymentRow({
  payment,
  account,
  amount = payment.amount,
}: Props) {
  const t = useTheme();
  const { formatMoney } = useMoney();
  const { update } = useSettings();
  const manual = payment.source === "manual";
  const color = manual
    ? CATEGORY_COLORS.Zakat
    : account
      ? BANK_COLORS[account.bank]
      : t.muted;
  const title = payment.note ?? "Zakat payment";
  const where = manual ? "Added by you" : (account?.name ?? "Bank");

  const confirmDelete = () =>
    Alert.alert("Delete payment?", `${title}, ${formatMoney(payment.amount)}`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () =>
          update((s) => ({
            zakatPayments: s.zakatPayments.filter((p) => p.id !== payment.id),
          })),
      },
    ]);

  return (
    <Pressable
      onPress={manual ? confirmDelete : undefined}
      disabled={!manual}
      accessibilityRole={manual ? "button" : undefined}
      accessibilityHint={manual ? "Offers to delete this payment" : undefined}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <View style={[styles.icon, { backgroundColor: color + "22" }]}>
        <Ionicons
          name={manual ? "cash-outline" : "card-outline"}
          size={18}
          color={color}
        />
      </View>
      <View style={styles.middle}>
        <Text style={[styles.title, { color: t.text }]} numberOfLines={1}>
          {title}
        </Text>
        <Text style={[styles.sub, { color: t.muted }]} numberOfLines={1}>
          {format(parseISO(payment.date), "d MMM yyyy")} · {where}
        </Text>
      </View>
      <View style={styles.right}>
        <Text style={[styles.amount, { color: t.text }]}>
          {formatMoney(amount)}
        </Text>
        {amount !== payment.amount && (
          <Text style={[styles.of, { color: t.muted }]}>
            of {formatMoney(payment.amount)}
          </Text>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  pressed: { opacity: 0.6 },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  middle: { flex: 1, marginHorizontal: 12 },
  title: { fontSize: 15 },
  sub: { fontSize: 13, marginTop: 2 },
  right: { alignItems: "flex-end" },
  amount: { fontSize: 15, fontWeight: "600" },
  of: { fontSize: 12, marginTop: 2 },
});
