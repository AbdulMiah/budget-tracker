import { Ionicons } from "@expo/vector-icons";
import { ComponentProps } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { SPACING } from "@/constants";
import { useTheme } from "@/hooks/useTheme";

/** A settings entry that opens its own page, showing the current value under the title. */
export function SettingsRow({
  icon,
  title,
  value,
  onPress,
}: {
  icon: ComponentProps<typeof Ionicons>["name"];
  title: string;
  value: string;
  onPress: () => void;
}) {
  const t = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${title}, ${value}`}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <View style={[styles.icon, { backgroundColor: t.primary + "1f" }]}>
        <Ionicons name={icon} size={18} color={t.primary} />
      </View>
      <View style={styles.text}>
        <Text style={[styles.title, { color: t.text }]}>{title}</Text>
        <Text style={[styles.value, { color: t.muted }]} numberOfLines={1}>
          {value}
        </Text>
      </View>
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
  icon: {
    width: 32,
    height: 32,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  text: { flex: 1, marginHorizontal: SPACING.three },
  title: { fontSize: 16 },
  value: { fontSize: 13, marginTop: SPACING.half },
});
