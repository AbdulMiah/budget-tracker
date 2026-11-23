import { Ionicons } from "@expo/vector-icons";
import { ComponentProps } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { WHITE } from "@/constants";
import { useTheme } from "@/hooks/useTheme";

type Props = {
  icon: ComponentProps<typeof Ionicons>["name"];
  accessibilityLabel: string;
  /** When above 0 the button turns solid and shows this number as a badge. */
  count?: number;
  onPress: () => void;
};

/** Square icon button that sits beside a search bar or filter, matching its height. */
export function IconButton({
  icon,
  accessibilityLabel,
  count = 0,
  onPress,
}: Props) {
  const t = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={[
        styles.button,
        count
          ? { backgroundColor: t.primary, borderColor: t.primary }
          : { backgroundColor: t.card, borderColor: t.border },
      ]}
    >
      <Ionicons name={icon} size={22} color={count ? WHITE : t.text} />
      {count > 0 && (
        <View
          style={[styles.badge, { backgroundColor: t.text, borderColor: t.bg }]}
        >
          <Text style={[styles.badgeText, { color: t.bg }]}>{count}</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 46,
    marginLeft: 8,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  badge: {
    position: "absolute",
    top: -6,
    right: -6,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  badgeText: { fontSize: 11, fontWeight: "700" },
});
