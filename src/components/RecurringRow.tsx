import { format } from "date-fns";
import {
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from "react-native";

import { BANK_COLORS, CATEGORY_COLORS } from "@/constants";
import { Account } from "@/constants/types";
import { useMoney } from "@/hooks/useMoney";
import { useTheme } from "@/hooks/useTheme";
import { RecurringPayment } from "@/utils/recurring";

type Props = {
  item: RecurringPayment;
  account?: Account;
  style?: StyleProp<ViewStyle>;
  /** Makes the row tappable, e.g. to open the payment's details. */
  onPress?: (item: RecurringPayment) => void;
};

export function RecurringRow({ item, account, style, onPress }: Props) {
  const t = useTheme();
  const { formatMoney, formatSigned } = useMoney();
  const isIncome = item.direction === "in";
  const color = CATEGORY_COLORS[item.category];
  return (
    <Pressable
      onPress={onPress && (() => onPress(item))}
      disabled={!onPress}
      accessibilityRole={onPress ? "button" : undefined}
      accessibilityHint={
        onPress ? "Shows payment details and history" : undefined
      }
      style={({ pressed }) => [
        styles.row,
        style,
        { opacity: pressed ? 0.6 : 1 },
      ]}
    >
      <View style={[styles.badge, { backgroundColor: color + "26" }]}>
        <Text style={[styles.initial, { color }]}>
          {item.merchant.charAt(0)}
        </Text>
      </View>
      <View style={styles.middle}>
        <Text style={[styles.merchant, { color: t.text }]} numberOfLines={1}>
          {item.merchant}
        </Text>
        <View style={styles.meta}>
          {account ? (
            <>
              <View
                style={[
                  styles.bankDot,
                  { backgroundColor: BANK_COLORS[account.bank] },
                ]}
              />
              <Text
                style={[styles.sub, styles.shrink, { color: t.muted }]}
                numberOfLines={1}
              >
                {account.name}
              </Text>
            </>
          ) : (
            <Text style={[styles.sub, { color: t.muted }]}>
              {item.category}
            </Text>
          )}
        </View>
      </View>
      <View style={styles.right}>
        <Text
          style={[styles.merchant, { color: isIncome ? t.income : t.text }]}
        >
          {isIncome ? formatSigned(item.amount) : formatMoney(item.amount)}
        </Text>
        <Text style={[styles.sub, styles.date, { color: t.muted }]}>
          {format(item.nextDate, "d MMM")}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center" },
  badge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  initial: { fontWeight: "700", fontSize: 16 },
  middle: { flex: 1, marginHorizontal: 12 },
  right: { alignItems: "flex-end" },
  merchant: { fontSize: 16, fontWeight: "600" },
  meta: { flexDirection: "row", alignItems: "center", marginTop: 2 },
  sub: { fontSize: 13 },
  shrink: { flexShrink: 1 },
  date: { marginTop: 2 },
  bankDot: { width: 7, height: 7, borderRadius: 4, marginRight: 4 },
});
