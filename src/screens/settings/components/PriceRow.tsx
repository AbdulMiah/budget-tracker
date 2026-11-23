import { StyleSheet, Text, View } from "react-native";

import { MoneyInput } from "@/components/MoneyInput";
import { SPACING } from "@/constants";
import { useTheme } from "@/hooks/useTheme";

/** A metal's price per gram, with the nisab it gives once set. */
export function PriceRow({
  label,
  value,
  onChange,
  nisab,
}: {
  label: string;
  value: number | null;
  onChange: (pence: number | null) => void;
  nisab: string | null;
}) {
  const t = useTheme();
  return (
    <View style={[styles.row, { borderTopColor: t.border }]}>
      <View style={styles.text}>
        <Text style={[styles.label, { color: t.text }]}>{label}</Text>
        <Text style={[styles.nisab, { color: t.muted }]}>
          {nisab ? `Nisab ${nisab}` : "Per gram"}
        </Text>
      </View>
      <View style={styles.input}>
        <MoneyInput
          value={value}
          onChange={onChange}
          placeholder="per gram"
          accessibilityLabel={`${label} price per gram`}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: SPACING.two,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  text: { flex: 1 },
  label: { fontSize: 15 },
  nisab: { fontSize: 12, marginTop: SPACING.half },
  input: { width: 120 },
});
