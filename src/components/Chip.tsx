import { Pressable, StyleSheet, Text } from "react-native";

import { useTheme } from "@/hooks/useTheme";

type Props = {
  label: string;
  selected?: boolean;
  disabled?: boolean;
  onPress: () => void;
};

export function Chip({ label, selected, disabled, onPress }: Props) {
  const t = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ selected: !!selected, disabled: !!disabled }}
      style={[
        styles.chip,
        {
          backgroundColor: selected ? t.primary : t.card,
          borderColor: selected ? t.primary : t.border,
        },
        disabled && { opacity: 0.35 },
      ]}
    >
      <Text
        style={[styles.label, { color: selected ? "#fff" : t.text }]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  label: { fontSize: 14, fontWeight: "600" },
});
