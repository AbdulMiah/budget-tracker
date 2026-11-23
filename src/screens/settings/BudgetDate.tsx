import { format } from "date-fns";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { InfoTip } from "@/components/InfoTip";
import { BUDGET_START_DAY_RANGE, WHITE } from "@/constants";
import { useSettings } from "@/hooks/useSettings";
import { useTheme } from "@/hooks/useTheme";
import { periodEnd, periodStart } from "@/utils/budget-period";

export function BudgetDateScreen() {
  const t = useTheme();
  const { settings, update } = useSettings();
  const { budgetStartDay } = settings;
  const start = periodStart(new Date(), budgetStartDay);
  const { min, max } = BUDGET_START_DAY_RANGE;
  const days = Array.from({ length: max - min + 1 }, (_, i) => min + i);

  return (
    <SafeAreaView
      style={[styles.screen, { backgroundColor: t.bg }]}
      edges={["bottom"]}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <View
          style={[
            styles.card,
            { backgroundColor: t.card, borderColor: t.border },
          ]}
        >
          <View style={styles.titleRow}>
            <Text style={[styles.title, { color: t.text }]}>
              My budget month starts on day {budgetStartDay}
            </Text>
            <InfoTip
              label="Budget date"
              text="Set this to your payday so each month's budget lines up with your salary."
            />
          </View>
          <Text style={[styles.period, { color: t.muted }]}>
            Current period: {format(start, "d MMM")} –{" "}
            {format(periodEnd(start), "d MMM yyyy")}
          </Text>
          <View style={styles.grid}>
            {days.map((d) => {
              const active = d === budgetStartDay;
              return (
                <Pressable
                  key={d}
                  onPress={() => update({ budgetStartDay: d })}
                  accessibilityRole="button"
                  accessibilityLabel={`Day ${d}`}
                  accessibilityState={{ selected: active }}
                  style={[
                    styles.day,
                    {
                      backgroundColor: active ? t.primary : "transparent",
                      borderColor: active ? t.primary : t.border,
                    },
                  ]}
                >
                  <Text
                    style={[styles.dayText, { color: active ? WHITE : t.text }]}
                  >
                    {d}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: 16, paddingBottom: 32 },
  card: { padding: 16, borderRadius: 16, borderWidth: 1 },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  title: { fontSize: 15, fontWeight: "600" },
  period: { fontSize: 13, marginBottom: 14 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  day: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  dayText: { fontWeight: "600" },
});
