import { Ionicons } from "@expo/vector-icons";
import { format, parseISO } from "date-fns";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";

import { BANK_COLORS, useTheme } from "@/constants/theme";
import { Account } from "@/constants/types";
import { useMoney } from "@/hooks/useMoney";
import { useStore } from "@/store/useStore";
import { CATEGORY_COLORS } from "@/utils/categories";
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
  const removeZakatPayment = useStore((s) => s.removeZakatPayment);
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
        onPress: () => removeZakatPayment(payment.id),
      },
    ]);

  return (
    <Pressable
      onPress={manual ? confirmDelete : undefined}
      disabled={!manual}
      accessibilityRole={manual ? "button" : undefined}
      accessibilityHint={manual ? "Offers to delete this payment" : undefined}
      style={({ pressed }) => [styles.row, { opacity: pressed ? 0.6 : 1 }]}
    >
      <View style={[styles.icon, { backgroundColor: color + "22" }]}>
        <Ionicons
          name={manual ? "cash-outline" : "card-outline"}
          size={18}
          color={color}
        />
      </View>
      <View style={{ flex: 1, marginHorizontal: 12 }}>
        <Text style={{ color: t.text, fontSize: 15 }} numberOfLines={1}>
          {title}
        </Text>
        <Text
          style={{ color: t.muted, fontSize: 13, marginTop: 2 }}
          numberOfLines={1}
        >
          {format(parseISO(payment.date), "d MMM yyyy")} · {where}
        </Text>
      </View>
      <View style={{ alignItems: "flex-end" }}>
        <Text style={{ color: t.text, fontSize: 15, fontWeight: "600" }}>
          {formatMoney(amount)}
        </Text>
        {amount !== payment.amount && (
          <Text style={{ color: t.muted, fontSize: 12, marginTop: 2 }}>
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
  icon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
});
