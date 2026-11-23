import { format } from "date-fns";
import {
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from "react-native";

import { CATEGORY_COLORS } from "../lib/categories";
import { RecurringPayment } from "../lib/recurring";
import { Account } from "../lib/types";
import { useMoney } from "../lib/useMoney";
import { BANK_COLORS, useTheme } from "./theme";

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
        <Text style={{ color, fontWeight: "700", fontSize: 16 }}>
          {item.merchant.charAt(0)}
        </Text>
      </View>
      <View style={{ flex: 1, marginHorizontal: 12 }}>
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
                style={[styles.sub, { color: t.muted, flexShrink: 1 }]}
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
      <View style={{ alignItems: "flex-end" }}>
        <Text
          style={[styles.merchant, { color: isIncome ? t.income : t.text }]}
        >
          {isIncome ? formatSigned(item.amount) : formatMoney(item.amount)}
        </Text>
        <Text style={[styles.sub, { color: t.muted, marginTop: 2 }]}>
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
  merchant: { fontSize: 16, fontWeight: "600" },
  meta: { flexDirection: "row", alignItems: "center", marginTop: 2 },
  sub: { fontSize: 13 },
  bankDot: { width: 7, height: 7, borderRadius: 4, marginRight: 4 },
});
