import { StyleSheet, Text, View } from "react-native";

import { SPACING } from "@/constants";
import { useTheme } from "@/hooks/useTheme";

/** A label above an amount, for a zakat year's summary. */
export function Stat({ label, value }: { label: string; value: string }) {
  const t = useTheme();
  return (
    <View
      style={styles.stat}
      accessible
      accessibilityLabel={`${label} ${value}`}
    >
      <Text style={[styles.label, { color: t.muted }]}>{label}</Text>
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
  stat: { flex: 1 },
  label: { fontSize: 13 },
  value: { fontSize: 16, fontWeight: "700", marginTop: SPACING.half },
});
