import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import {
  PERIOD_KINDS,
  PeriodSelection,
  resolvePeriod,
} from "../lib/spendingPeriods";
import { BottomSheet } from "./BottomSheet";
import { Chip } from "./Chip";
import { DayCalendar } from "./DayCalendar";
import { MonthGrid, QuarterGrid, YearGrid } from "./PeriodGrids";
import { useTheme } from "./theme";

type Props = {
  visible: boolean;
  selection: PeriodSelection;
  budgetStartDay: number;
  today: Date;
  onApply: (selection: PeriodSelection) => void;
  onClose: () => void;
};

/** Bottom sheet for choosing the analytics period. Changes apply on Apply; dismissing discards them. */
export function PeriodSheet({ visible, onClose, ...rest }: Props) {
  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <Body onClose={onClose} {...rest} />
    </BottomSheet>
  );
}

function Body({
  selection,
  budgetStartDay,
  today,
  onApply,
  onClose,
}: Omit<Props, "visible">) {
  const t = useTheme();
  const [draft, setDraft] = useState(selection);
  const { kind } = draft;
  const { fullRange, title, subtitle } = resolvePeriod(
    draft,
    budgetStartDay,
    today
  );
  const setAnchor = (anchor: Date) => setDraft((d) => ({ ...d, anchor }));

  return (
    <View style={styles.body}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <Text style={[styles.heading, { color: t.text }]}>Period</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.kinds}
        >
          {PERIOD_KINDS.map((k) => (
            <Chip
              key={k.kind}
              label={k.label}
              selected={k.kind === kind}
              onPress={() => setDraft((d) => ({ ...d, kind: k.kind }))}
            />
          ))}
        </ScrollView>

        {kind === "week" && (
          <DayCalendar
            key="week"
            mode="week"
            value={fullRange}
            maxDate={today}
            onChange={(r) => setAnchor(r.start)}
          />
        )}
        {kind === "custom" && (
          <DayCalendar
            key="custom"
            mode="range"
            value={draft.custom}
            maxDate={today}
            onChange={(custom) => setDraft((d) => ({ ...d, custom }))}
          />
        )}
        {kind === "month" && (
          <MonthGrid
            selectedStart={fullRange.start}
            budgetStartDay={budgetStartDay}
            today={today}
            onPick={setAnchor}
          />
        )}
        {kind === "year" && (
          <YearGrid
            selectedStart={fullRange.start}
            budgetStartDay={budgetStartDay}
            today={today}
            onPick={setAnchor}
          />
        )}
        {kind === "quarter" && (
          <QuarterGrid
            selectedStart={fullRange.start}
            budgetStartDay={budgetStartDay}
            today={today}
            onPick={setAnchor}
          />
        )}
      </ScrollView>

      <View style={[styles.footer, { borderTopColor: t.border }]}>
        <View style={{ flex: 1, marginRight: 12 }}>
          <Text
            style={{ color: t.text, fontSize: 15, fontWeight: "700" }}
            numberOfLines={1}
          >
            {title}
          </Text>
          {subtitle && (
            <Text style={{ color: t.muted, fontSize: 12 }} numberOfLines={1}>
              {subtitle}
            </Text>
          )}
        </View>
        <Pressable
          onPress={() => {
            onApply(draft);
            onClose();
          }}
          accessibilityRole="button"
          style={[styles.apply, { backgroundColor: t.primary }]}
        >
          <Text style={{ color: "#fff", fontSize: 16, fontWeight: "700" }}>
            Apply
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  body: { flexShrink: 1 },
  scroll: { flexGrow: 0, flexShrink: 1 },
  content: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  heading: { fontSize: 18, fontWeight: "700", marginBottom: 12 },
  kinds: { flexGrow: 0, marginBottom: 16 },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  apply: {
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 14,
    alignItems: "center",
  },
});
