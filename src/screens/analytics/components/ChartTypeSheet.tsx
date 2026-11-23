import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { BottomSheet } from "@/components/BottomSheet";
import { CHART_TYPE_OPTIONS, WHITE } from "@/constants";
import { ChartType } from "@/constants/types";
import { useTheme } from "@/hooks/useTheme";

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
        {CHART_TYPE_OPTIONS.map((c) => {
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
                on && styles.rowSelected,
                {
                  backgroundColor: t.card,
                  borderColor: on ? t.primary : t.border,
                },
              ]}
            >
              <View
                style={[
                  styles.icon,
                  { backgroundColor: on ? t.primary : t.bg },
                ]}
              >
                <Ionicons name={c.icon} size={22} color={on ? WHITE : t.text} />
              </View>
              <View style={styles.text}>
                <Text style={[styles.title, { color: t.text }]}>{c.title}</Text>
                <Text style={[styles.description, { color: t.muted }]}>
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
    borderWidth: 1,
    marginBottom: 10,
  },
  rowSelected: { borderWidth: 2 },
  text: { flex: 1, marginHorizontal: 12 },
  title: { fontSize: 16, fontWeight: "700" },
  description: { fontSize: 13, marginTop: 2 },
  icon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
});
