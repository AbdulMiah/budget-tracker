import { Ionicons } from "@expo/vector-icons";
import { format } from "date-fns";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { SPACING } from "@/constants";
import { useMoney } from "@/hooks/useMoney";
import { useTheme } from "@/hooks/useTheme";
import { ZakatYear } from "@/utils/zakat";

/** A completed zakat year in the Previous years list, with whether it's been paid. */
export function YearRow({
  year,
  onPress,
}: {
  year: ZakatYear;
  onPress: () => void;
}) {
  const t = useTheme();
  const { formatMoney } = useMoney();
  const settled = year.remaining <= 0;
  const status =
    year.zakat === 0
      ? "Not due"
      : settled
        ? "Paid"
        : `${formatMoney(year.remaining)} left`;
  const color = year.zakat === 0 ? t.muted : settled ? t.income : t.spend;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <View style={styles.text}>
        <Text style={[styles.title, { color: t.text }]}>{year.key} AH</Text>
        <Text style={[styles.due, { color: t.muted }]}>
          Due {format(year.due, "d MMM yyyy")}
        </Text>
      </View>
      <Text style={[styles.status, { color }]}>{status}</Text>
      <Ionicons name="chevron-forward" size={18} color={t.muted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SPACING.four,
    paddingVertical: SPACING.three,
  },
  pressed: { opacity: 0.6 },
  text: { flex: 1 },
  title: { fontSize: 15, fontWeight: "600" },
  due: { fontSize: 13, marginTop: SPACING.half },
  status: { fontSize: 13, fontWeight: "700", marginRight: 6 },
});
