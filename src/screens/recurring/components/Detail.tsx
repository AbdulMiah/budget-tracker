import { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";

import { useTheme } from "@/hooks/useTheme";

/** A label and value row in the payment details card. */
export function Detail({
  label,
  last,
  children,
}: {
  label: string;
  last?: boolean;
  children: ReactNode;
}) {
  const t = useTheme();
  return (
    <View
      style={[
        styles.row,
        !last && styles.divided,
        { borderBottomColor: t.border },
      ]}
    >
      <Text style={[styles.label, { color: t.muted }]}>{label}</Text>
      {typeof children === "string" ? (
        <Text style={[styles.value, { color: t.text }]}>{children}</Text>
      ) : (
        children
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
  },
  divided: { borderBottomWidth: StyleSheet.hairlineWidth },
  label: { fontSize: 15 },
  value: { fontSize: 15, fontWeight: "600" },
});
