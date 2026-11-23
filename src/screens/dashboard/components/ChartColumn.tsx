import { ReactNode } from "react";
import { Pressable, StyleSheet, Text } from "react-native";

import { RADIUS } from "@/constants";
import { useTheme } from "@/hooks/useTheme";

export const COLUMN_PADDING = 12;

/** A tappable dashboard card in the two-column grid. */
export function ChartColumn({
  title,
  subtitle,
  width,
  onPress,
  hint = "Opens this chart in Analytics",
  children,
}: {
  title: string;
  subtitle: string;
  width: number;
  onPress?: () => void;
  /** Screen reader hint for onPress; defaults to opening the chart in Analytics. */
  hint?: string;
  children: ReactNode;
}) {
  const t = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? "button" : undefined}
      accessibilityHint={onPress ? hint : undefined}
      style={({ pressed }) => [
        styles.column,
        pressed && styles.pressed,
        { width, backgroundColor: t.card, borderColor: t.border },
      ]}
    >
      <Text style={[styles.title, { color: t.text }]}>{title}</Text>
      <Text style={[styles.subtitle, { color: t.muted }]}>{subtitle}</Text>
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  column: {
    borderRadius: RADIUS.large,
    borderWidth: 1,
    padding: COLUMN_PADDING,
  },
  pressed: { opacity: 0.7 },
  title: { fontSize: 14, fontWeight: "700" },
  subtitle: { fontSize: 12, marginTop: 2, marginBottom: 10 },
});
