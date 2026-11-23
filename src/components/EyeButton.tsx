import { Ionicons } from "@expo/vector-icons";
import { Pressable } from "react-native";

import { useStore } from "../store/useStore";
import { useTheme } from "./theme";

/** Shows or hides every amount in the app. */
export function EyeButton() {
  const t = useTheme();
  const hidden = useStore((s) => s.amountsHidden);
  const toggle = useStore((s) => s.toggleAmountsHidden);
  return (
    <Pressable
      onPress={toggle}
      hitSlop={10}
      accessibilityRole="button"
      accessibilityLabel={hidden ? "Show amounts" : "Hide amounts"}
    >
      <Ionicons
        name={hidden ? "eye-off-outline" : "eye-outline"}
        size={24}
        color={t.text}
      />
    </Pressable>
  );
}
