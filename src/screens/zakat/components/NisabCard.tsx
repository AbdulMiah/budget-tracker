import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useMoney } from "@/hooks/useMoney";
import { useTheme } from "@/hooks/useTheme";
import { GOLD_NISAB_GRAMS, Nisab, SILVER_NISAB_GRAMS } from "@/utils/zakat";

type Props = { netWorth: number; nisab: Nisab; aboveNisab: boolean };

/** Net worth against the gold and silver nisab, and whether zakat is due on it. */
export function NisabCard({ netWorth, nisab, aboveNisab }: Props) {
  const t = useTheme();
  const { formatMoney } = useMoney();
  const known = nisab.threshold !== null;
  const color = known && aboveNisab ? t.income : t.muted;

  return (
    <View
      style={[styles.card, { backgroundColor: t.card, borderColor: t.border }]}
    >
      <View style={styles.top}>
        <Text style={[styles.title, { color: t.text }]}>Nisab</Text>
        <Pressable
          onPress={() => router.push("/zakat-settings")}
          hitSlop={10}
          accessibilityRole="button"
        >
          <Text style={[styles.link, { color: t.primary }]}>
            {known ? "Prices" : "Add prices"}
          </Text>
        </Pressable>
      </View>
      <Row label="Your net worth" value={formatMoney(netWorth)} bold />
      <Row
        label={`Gold · ${GOLD_NISAB_GRAMS}g`}
        value={nisab.gold === null ? "No price" : formatMoney(nisab.gold)}
        met={nisab.gold === null ? undefined : netWorth >= nisab.gold}
      />
      <Row
        label={`Silver · ${SILVER_NISAB_GRAMS}g`}
        value={nisab.silver === null ? "No price" : formatMoney(nisab.silver)}
        met={nisab.silver === null ? undefined : netWorth >= nisab.silver}
      />
      <View style={[styles.notice, { backgroundColor: color + "1a" }]}>
        <Ionicons
          name={
            !known
              ? "information-circle-outline"
              : aboveNisab
                ? "checkmark-circle"
                : "remove-circle-outline"
          }
          size={20}
          color={color}
        />
        <Text style={[styles.noticeText, { color: t.text }]}>
          {!known
            ? "Add today's gold and silver prices to check whether your wealth reaches nisab."
            : aboveNisab
              ? "Your wealth is at or above nisab, so zakat will be fardh on you once it has been held for a full lunar year."
              : "Your wealth is below nisab, so zakat is not fardh on you."}
        </Text>
      </View>
    </View>
  );
}

function Row({
  label,
  value,
  met,
  bold,
}: {
  label: string;
  value: string;
  met?: boolean;
  bold?: boolean;
}) {
  const t = useTheme();
  return (
    <View style={styles.row}>
      <Text style={[styles.rowLabel, { color: bold ? t.text : t.muted }]}>
        {label}
      </Text>
      <Text style={[styles.rowValue, bold && styles.bold, { color: t.text }]}>
        {value}
      </Text>
      {met !== undefined && (
        <Ionicons
          name={met ? "checkmark" : "close"}
          size={16}
          color={met ? t.income : t.muted}
          style={styles.met}
          accessibilityLabel={met ? "Reached" : "Not reached"}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { padding: 16, borderRadius: 16, borderWidth: 1, marginBottom: 12 },
  top: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  title: { fontSize: 16, fontWeight: "700" },
  link: { fontSize: 14, fontWeight: "600" },
  row: { flexDirection: "row", alignItems: "center", paddingVertical: 5 },
  rowLabel: { flex: 1, fontSize: 14 },
  rowValue: { fontSize: 14, fontWeight: "600" },
  bold: { fontWeight: "700" },
  met: { marginLeft: 6 },
  notice: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 10,
    padding: 10,
    marginTop: 8,
  },
  noticeText: { flex: 1, fontSize: 13, marginLeft: 8 },
});
