import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { format } from "date-fns";
import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { CATEGORY_COLORS } from "@/constants";
import { useMoney } from "@/hooks/useMoney";
import { useTheme } from "@/hooks/useTheme";
import { useZakat } from "@/hooks/useZakat";
import { formatHijri } from "@/utils/hijri";

/** Dashboard preview of the Zakat tab: this year's progress and due date, or the nisab status before tracking. */
export function ZakatSummaryCard() {
  const t = useTheme();
  const { formatMoney } = useMoney();
  const zakat = useZakat();
  const { current } = zakat;
  const overdue = zakat.overdue.reduce((sum, y) => sum + y.remaining, 0);

  return (
    <Pressable
      onPress={() => router.navigate("/zakat")}
      accessibilityRole="button"
      accessibilityHint="Opens your zakat"
      style={({ pressed }) => [
        styles.card,
        pressed && styles.pressed,
        { backgroundColor: t.card, borderColor: t.border },
      ]}
    >
      {!current ? (
        <View style={styles.row}>
          <View
            style={[
              styles.icon,
              { backgroundColor: CATEGORY_COLORS.Zakat + "22" },
            ]}
          >
            <MaterialCommunityIcons
              name="hand-coin-outline"
              size={20}
              color={CATEGORY_COLORS.Zakat}
            />
          </View>
          <View style={styles.middle}>
            <Text style={[styles.title, { color: t.text }]}>
              {zakat.nisab.threshold === null
                ? "Check your nisab"
                : zakat.aboveNisab
                  ? "Zakat will be fardh on you"
                  : "Below nisab"}
            </Text>
            <Text style={[styles.sub, { color: t.muted }]}>
              {zakat.nisab.threshold === null
                ? "Add gold and silver prices to see whether zakat is due."
                : zakat.aboveNisab
                  ? `Start tracking: ${formatMoney(zakat.zakatToday)} on today's net worth.`
                  : "Zakat is not fardh on your current wealth."}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={t.muted} />
        </View>
      ) : (
        <>
          <View style={styles.row}>
            <View style={styles.fill}>
              <Text style={[styles.title, { color: t.text }]}>
                Due {formatHijri(current.dueHijri)}
              </Text>
              <Text style={[styles.sub, { color: t.muted }]}>
                {format(current.due, "EEE d MMM yyyy")}
              </Text>
            </View>
            <View style={styles.right}>
              <Text style={[styles.days, { color: t.text }]}>
                {zakat.daysLeft}
              </Text>
              <Text style={[styles.daysLabel, { color: t.muted }]}>
                {zakat.daysLeft === 1 ? "day left" : "days left"}
              </Text>
            </View>
          </View>

          <View style={[styles.track, { backgroundColor: t.border }]}>
            <View
              style={{
                // The share of this year's zakat paid so far.
                width: `${current.zakat > 0 ? Math.min(100, (Math.max(0, current.paid) / current.zakat) * 100) : 0}%`,
                backgroundColor: t.income,
              }}
            />
          </View>
          <View style={styles.amounts}>
            <Amount label="Paid" value={formatMoney(current.paid)} />
            <Amount
              label={current.remaining < 0 ? "Paid ahead" : "Remaining"}
              value={formatMoney(Math.abs(current.remaining))}
              align="center"
            />
            <Amount
              label={`Zakat ${current.key} AH`}
              value={formatMoney(current.zakat)}
              align="right"
            />
          </View>

          {overdue > 0 && (
            <View style={[styles.overdue, { backgroundColor: t.spend + "14" }]}>
              <Ionicons name="alert-circle" size={16} color={t.spend} />
              <Text style={[styles.overdueText, { color: t.spend }]}>
                {formatMoney(overdue)} still due from previous{" "}
                {zakat.overdue.length === 1 ? "year" : "years"}
              </Text>
            </View>
          )}
        </>
      )}
    </Pressable>
  );
}

function Amount({
  label,
  value,
  align = "left",
}: {
  label: string;
  value: string;
  align?: "left" | "center" | "right";
}) {
  const t = useTheme();
  return (
    <View
      style={styles.fill}
      accessible
      accessibilityLabel={`${label} ${value}`}
    >
      <Text
        style={[styles.amountLabel, { color: t.muted, textAlign: align }]}
        numberOfLines={1}
      >
        {label}
      </Text>
      <Text
        style={[styles.amountValue, { color: t.text, textAlign: align }]}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 16, borderWidth: 1, padding: 16 },
  pressed: { opacity: 0.7 },
  row: { flexDirection: "row", alignItems: "center" },
  fill: { flex: 1 },
  middle: { flex: 1, marginHorizontal: 12 },
  right: { alignItems: "flex-end" },
  title: { fontSize: 15, fontWeight: "700" },
  sub: { fontSize: 13, marginTop: 2 },
  daysLabel: { fontSize: 12 },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  days: { fontSize: 22, fontWeight: "800" },
  track: {
    flexDirection: "row",
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
    marginTop: 14,
    marginBottom: 10,
  },
  amounts: { flexDirection: "row" },
  amountLabel: { fontSize: 12 },
  amountValue: { fontSize: 15, fontWeight: "700", marginTop: 2 },
  overdue: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 10,
    padding: 8,
    marginTop: 12,
  },
  overdueText: { flex: 1, fontSize: 13, fontWeight: "600", marginLeft: 6 },
});
