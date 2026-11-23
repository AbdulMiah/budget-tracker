import { Ionicons } from "@expo/vector-icons";
import {
  addDays,
  addMonths,
  format,
  isSameMonth,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useTheme } from "@/hooks/useTheme";
import { DateRange } from "@/utils/spending-periods";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

type Props = {
  /**
   * 'week': tapping a day picks its Monday-Sunday week. 'range': tap a first day, then a last day.
   * 'day': tapping picks just that day (start and end are the same).
   */
  mode: "week" | "range" | "day";
  value: DateRange;
  /** Latest selectable day. */
  maxDate: Date;
  onChange: (range: DateRange) => void;
};

/**
 * Month-at-a-time calendar for picking a week or a date range. In range mode the first tap selects
 * that single day, and a second tap extends it to a range.
 */
export function DayCalendar({ mode, value, maxDate, onChange }: Props) {
  const t = useTheme();
  const [month, setMonth] = useState(() => startOfMonth(value.end));
  // First day of a range, while waiting for the second tap.
  const [pending, setPending] = useState<Date | null>(null);

  const max = startOfDay(maxDate);
  const gridStart = startOfWeek(month, { weekStartsOn: 1 });
  const days = Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));
  const rows = Array.from({ length: 6 }, (_, r) =>
    days.slice(r * 7, r * 7 + 7)
  );
  const canGoNext = startOfMonth(addMonths(month, 1)) <= max;

  const pick = (day: Date) => {
    if (mode === "week") {
      const start = startOfWeek(day, { weekStartsOn: 1 });
      onChange({ start, end: addDays(start, 6) });
    } else if (mode === "day") {
      onChange({ start: day, end: day });
    } else if (!pending) {
      setPending(day);
      onChange({ start: day, end: day });
    } else {
      const [start, end] = pending <= day ? [pending, day] : [day, pending];
      setPending(null);
      onChange({ start, end });
    }
  };

  const hint =
    mode === "day"
      ? "Tap a day"
      : mode === "week"
        ? "Tap any day to select its week"
        : pending
          ? "Tap the last day, or apply for just this day"
          : "Tap the first day";

  return (
    <View>
      <View style={styles.monthRow}>
        <Pressable
          onPress={() => setMonth(addMonths(month, -1))}
          hitSlop={12}
          accessibilityLabel="Previous month"
        >
          <Ionicons name="chevron-back" size={22} color={t.text} />
        </Pressable>
        <Text style={{ color: t.text, fontSize: 16, fontWeight: "700" }}>
          {format(month, "MMMM yyyy")}
        </Text>
        <Pressable
          onPress={() => canGoNext && setMonth(addMonths(month, 1))}
          hitSlop={12}
          accessibilityLabel="Next month"
          style={{ opacity: canGoNext ? 1 : 0.3 }}
        >
          <Ionicons name="chevron-forward" size={22} color={t.text} />
        </Pressable>
      </View>
      <Text style={[styles.hint, { color: t.muted }]}>{hint}</Text>

      <View style={styles.weekRow}>
        {WEEKDAYS.map((d) => (
          <Text key={d} style={[styles.weekday, { color: t.muted }]}>
            {d}
          </Text>
        ))}
      </View>
      {rows.map((row, r) => (
        <View key={r} style={styles.weekRow}>
          {row.map((day) => {
            const inMonth = isSameMonth(day, month);
            const disabled = day > max;
            const inRange = day >= value.start && day <= value.end;
            const isEdge =
              day.getTime() === value.start.getTime() ||
              day.getTime() === value.end.getTime();
            return (
              <Pressable
                key={day.getTime()}
                disabled={disabled}
                onPress={() => pick(day)}
                accessibilityRole="button"
                accessibilityLabel={format(day, "EEEE d MMMM yyyy")}
                accessibilityState={{ selected: inRange, disabled }}
                style={[
                  styles.cell,
                  {
                    backgroundColor: inRange ? t.primary + "26" : "transparent",
                  },
                ]}
              >
                <View
                  style={[
                    styles.dayCircle,
                    isEdge && { backgroundColor: t.primary },
                  ]}
                >
                  <Text
                    style={{
                      color: isEdge
                        ? "#fff"
                        : disabled
                          ? t.border
                          : inMonth
                            ? t.text
                            : t.muted,
                      fontWeight: isEdge ? "700" : "500",
                      opacity: inMonth || isEdge ? 1 : 0.5,
                    }}
                  >
                    {day.getDate()}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  monthRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 4,
    marginBottom: 4,
  },
  hint: { textAlign: "center", fontSize: 12, marginBottom: 6 },
  weekRow: { flexDirection: "row" },
  weekday: {
    flex: 1,
    textAlign: "center",
    fontSize: 12,
    fontWeight: "600",
    paddingVertical: 4,
  },
  cell: { flex: 1, height: 42, alignItems: "center", justifyContent: "center" },
  dayCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
});
