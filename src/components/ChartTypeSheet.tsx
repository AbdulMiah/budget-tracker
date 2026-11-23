import { Ionicons } from "@expo/vector-icons";
import { ComponentProps } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { ChartType } from "../lib/types";
import { BottomSheet } from "./BottomSheet";
import { useTheme } from "./theme";

export const CHART_TYPES: {
  type: ChartType;
  title: string;
  description: string;
  icon: ComponentProps<typeof Ionicons>["name"];
}[] = [
  {
    type: "income-spending",
    title: "Income vs spending",
    description: "Total money in and out for the period",
    icon: "bar-chart-outline",
  },
  {
    type: "spending-trend",
    title: "Spending over time",
    description: "How spending builds up, compared with the previous period",
    icon: "trending-up-outline",
  },
  {
    type: "categories",
    title: "Spending by category",
    description: "How your spending splits between categories",
    icon: "pie-chart-outline",
  },
];

type Props = {
  visible: boolean;
  value: ChartType;
  onChange: (type: ChartType) => void;
  onClose: () => void;
};

/** Bottom sheet for picking which chart Analytics shows. Picking one applies it straight away. */
export function ChartTypeSheet({ visible, value, onChange, onClose }: Props) {
  const t = useTheme();
  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <View style={styles.body}>
        <Text style={[styles.heading, { color: t.text }]}>Chart</Text>
        {CHART_TYPES.map((c) => {
          const on = c.type === value;
          return (
            <Pressable
              key={c.type}
              onPress={() => {
                onChange(c.type);
                onClose();
              }}
              accessibilityRole="radio"
              accessibilityState={{ selected: on }}
              style={[
                styles.row,
                {
                  backgroundColor: t.card,
                  borderColor: on ? t.primary : t.border,
                  borderWidth: on ? 2 : 1,
                },
              ]}
            >
              <View
                style={[
                  styles.icon,
                  { backgroundColor: on ? t.primary : t.bg },
                ]}
              >
                <Ionicons
                  name={c.icon}
                  size={22}
                  color={on ? "#fff" : t.text}
                />
              </View>
              <View style={{ flex: 1, marginHorizontal: 12 }}>
                <Text
                  style={{ color: t.text, fontSize: 16, fontWeight: "700" }}
                >
                  {c.title}
                </Text>
                <Text style={{ color: t.muted, fontSize: 13, marginTop: 2 }}>
                  {c.description}
                </Text>
              </View>
              {on && (
                <Ionicons name="checkmark-circle" size={22} color={t.primary} />
              )}
            </Pressable>
          );
        })}
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: 16, paddingTop: 16 },
  heading: { fontSize: 18, fontWeight: "700", marginBottom: 12 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 14,
    marginBottom: 10,
  },
  icon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
});
