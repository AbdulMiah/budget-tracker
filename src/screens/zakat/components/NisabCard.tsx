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
        <Text style={{ color: t.text, fontSize: 16, fontWeight: "700" }}>
          Nisab
        </Text>
        <Pressable
          onPress={() => router.push("/zakat-settings")}
          hitSlop={10}
          accessibilityRole="button"
        >
          <Text style={{ color: t.primary, fontSize: 14, fontWeight: "600" }}>
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
        <Text style={{ color: t.text, fontSize: 13, flex: 1, marginLeft: 8 }}>
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
      <Text style={{ color: bold ? t.text : t.muted, fontSize: 14, flex: 1 }}>
        {label}
      </Text>
      <Text
        style={{
          color: t.text,
          fontSize: 14,
          fontWeight: bold ? "700" : "600",
        }}
      >
        {value}
      </Text>
      {met !== undefined && (
        <Ionicons
          name={met ? "checkmark" : "close"}
          size={16}
          color={met ? t.income : t.muted}
          style={{ marginLeft: 6 }}
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
  row: { flexDirection: "row", alignItems: "center", paddingVertical: 5 },
  notice: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 10,
    padding: 10,
    marginTop: 8,
  },
});
