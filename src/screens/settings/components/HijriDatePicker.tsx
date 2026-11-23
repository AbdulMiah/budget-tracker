import { Ionicons } from "@expo/vector-icons";
import { addDays, format, startOfDay } from "date-fns";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { WHITE } from "@/constants";
import { useTheme } from "@/hooks/useTheme";
import {
  fromHijri,
  HIJRI_MONTHS,
  HijriDate,
  hijriMonthLength,
  hijriMonthStart,
  toHijri,
} from "@/utils/hijri";

type Props = {
  /** Null shows nothing selected. */
  value: HijriDate | null;
  /** Latest selectable day. */
  maxDate: Date;
  onChange: (date: HijriDate) => void;
};

/** Pick a Hijri date as year, month and day. Tapping a month or day selects it straight away. */
export function HijriDatePicker({ value, maxDate, onChange }: Props) {
  const t = useTheme();
  const max = startOfDay(maxDate);
  const maxHijri = toHijri(max);
  const [year, setYear] = useState(() => value?.year ?? maxHijri.year);
  const selected = value?.year === year ? value : null;
  const month =
    selected?.month ?? (year === maxHijri.year ? maxHijri.month : 1);
  const monthStart = hijriMonthStart(year, month);
  const length = hijriMonthLength(year, month);

  const pickMonth = (m: number) => {
    // Keep the chosen day, unless that would be in the future.
    const next = { year, month: m, day: selected?.day ?? 1 };
    onChange(fromHijri(next) > max ? maxHijri : next);
  };

  return (
    <View>
      <View style={styles.yearRow}>
        <Pressable
          onPress={() => setYear(year - 1)}
          hitSlop={12}
          accessibilityLabel="Previous year"
        >
          <Ionicons name="chevron-back" size={22} color={t.text} />
        </Pressable>
        <Text style={[styles.year, { color: t.text }]}>{year} AH</Text>
        <Pressable
          onPress={() => year < maxHijri.year && setYear(year + 1)}
          hitSlop={12}
          accessibilityLabel="Next year"
          style={year >= maxHijri.year && styles.arrowDisabled}
        >
          <Ionicons name="chevron-forward" size={22} color={t.text} />
        </Pressable>
      </View>

      <View style={styles.months}>
        {HIJRI_MONTHS.map((name, i) => {
          const m = i + 1;
          const disabled = hijriMonthStart(year, m) > max;
          const active = selected?.month === m;
          return (
            <Pressable
              key={name}
              disabled={disabled}
              onPress={() => pickMonth(m)}
              accessibilityRole="button"
              accessibilityLabel={`${name} ${year}`}
              accessibilityState={{ selected: active, disabled }}
              style={[
                styles.month,
                {
                  backgroundColor: active ? t.primary : t.card,
                  borderColor: active ? t.primary : t.border,
                },
                disabled && styles.monthDisabled,
              ]}
            >
              <Text
                style={[styles.monthText, { color: active ? WHITE : t.text }]}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                {name}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={[styles.monthTitle, { color: t.muted }]}>
        {HIJRI_MONTHS[month - 1].toUpperCase()}
      </Text>
      <View style={styles.days}>
        {Array.from({ length }, (_, i) => i + 1).map((d) => {
          const day = { year, month, day: d };
          const disabled = addDays(monthStart, d - 1) > max;
          const active = selected?.month === month && selected.day === d;
          return (
            <Pressable
              key={d}
              disabled={disabled}
              onPress={() => onChange(day)}
              accessibilityRole="button"
              accessibilityLabel={`${d} ${HIJRI_MONTHS[month - 1]} ${year}`}
              accessibilityState={{ selected: active, disabled }}
              style={[
                styles.day,
                {
                  backgroundColor: active ? t.primary : "transparent",
                  borderColor: active ? t.primary : t.border,
                },
                disabled && styles.dayDisabled,
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
      {selected && (
        <Text style={[styles.footer, { color: t.muted }]}>
          {format(fromHijri(selected), "EEEE d MMMM yyyy")}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  yearRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 4,
    marginBottom: 12,
  },
  year: { fontSize: 16, fontWeight: "700" },
  arrowDisabled: { opacity: 0.3 },
  months: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  month: {
    width: "31.5%",
    paddingVertical: 9,
    paddingHorizontal: 6,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
  },
  monthDisabled: { opacity: 0.35 },
  monthText: { fontSize: 13, fontWeight: "600" },
  monthTitle: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.8,
    marginTop: 16,
    marginBottom: 8,
  },
  days: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  day: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  dayDisabled: { opacity: 0.3 },
  dayText: { fontWeight: "600" },
  footer: { textAlign: "center", fontSize: 13, marginTop: 14 },
});
