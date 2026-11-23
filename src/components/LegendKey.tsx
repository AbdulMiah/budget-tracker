import { StyleSheet, Text, View } from "react-native";

import { useTheme } from "@/hooks/useTheme";

/** A label (with an optional colour swatch) above an amount, for a ring chart's key. */
export function LegendKey({
  color,
  label,
  value,
}: {
  color?: string;
  label: string;
  value: string;
}) {
  const t = useTheme();
  return (
    <View
      style={styles.key}
      accessible
      accessibilityLabel={`${label} ${value}`}
    >
      <View style={styles.row}>
        {color && <View style={[styles.swatch, { backgroundColor: color }]} />}
        <Text style={[styles.label, { color: t.muted }]}>{label}</Text>
      </View>
      <Text
        style={[styles.value, { color: t.text }]}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  key: { flex: 1, alignItems: "center" },
  row: { flexDirection: "row", alignItems: "center" },
  swatch: { width: 10, height: 10, borderRadius: 5, marginRight: 6 },
  label: { fontSize: 13 },
  value: { fontSize: 16, fontWeight: "700", marginTop: 2 },
});
