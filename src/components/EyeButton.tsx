import { Ionicons } from "@expo/vector-icons";
import { Pressable } from "react-native";

import { useAmountsHidden } from "@/hooks/useAmountsHidden";
import { useTheme } from "@/hooks/useTheme";

/** Shows or hides every amount in the app. */
export function EyeButton() {
  const t = useTheme();
  const { amountsHidden, toggleAmountsHidden } = useAmountsHidden();
  return (
    <Pressable
      onPress={toggleAmountsHidden}
      hitSlop={10}
      accessibilityRole="button"
      accessibilityLabel={amountsHidden ? "Show amounts" : "Hide amounts"}
    >
      <Ionicons
        name={amountsHidden ? "eye-off-outline" : "eye-outline"}
        size={24}
        color={t.text}
      />
    </Pressable>
  );
}
