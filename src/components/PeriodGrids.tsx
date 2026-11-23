import { Ionicons } from "@expo/vector-icons";
import { addDays, addMonths, format } from "date-fns";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { periodStart } from "../lib/budgetPeriod";
import { useTheme } from "./theme";

const YEARS_PER_PAGE = 6;

type Tile = {
  key: string;
  label: string;
  sublabel?: string;
  selected: boolean;
  disabled: boolean;
  onPress: () => void;
};

type Props = {
  /** Start of the currently selected period. */
  selectedStart: Date;
  budgetStartDay: number;
  today: Date;
  /** Called with a date inside the chosen period. */
  onPick: (anchor: Date) => void;
};

/** The 12 budget months of a year, with arrows to change year. Future months are disabled. */
export function MonthGrid({
  selectedStart,
  budgetStartDay,
  today,
  onPick,
}: Props) {
  const [year, setYear] = useState(selectedStart.getFullYear());
  const tiles: Tile[] = Array.from({ length: 12 }, (_, m) => {
    const start = new Date(year, m, budgetStartDay);
    return {
      key: String(m),
      label: format(start, "MMM"),
      selected: start.getTime() === selectedStart.getTime(),
      disabled: start > today,
      onPress: () => onPick(start),
    };
  });
  return (
    <TileGrid
      title={String(year)}
      onPrev={() => setYear(year - 1)}
      onNext={() => setYear(year + 1)}
      hasNext={new Date(year + 1, 0, budgetStartDay) <= today}
      prevLabel="Previous year"
      nextLabel="Next year"
      tiles={tiles}
      note={
        budgetStartDay === 1
          ? undefined
          : `Each month runs from the ${ordinal(budgetStartDay)}, your budget day.`
      }
    />
  );
}

/** The four quarters of a year as a 2×2 grid, each showing the months it covers. */
export function QuarterGrid({
  selectedStart,
  budgetStartDay,
  today,
  onPick,
}: Props) {
  const [year, setYear] = useState(selectedStart.getFullYear());
  const tiles: Tile[] = [1, 2, 3, 4].map((q) => {
    const start = new Date(year, (q - 1) * 3, budgetStartDay);
    const end = addDays(addMonths(start, 3), -1);
    return {
      key: String(q),
      label: `Q${q}`,
      sublabel: `${format(start, "MMM")} – ${format(end, "MMM")}`,
      selected: start.getTime() === selectedStart.getTime(),
      disabled: start > today,
      onPress: () => onPick(start),
    };
  });
  return (
    <TileGrid
      title={String(year)}
      onPrev={() => setYear(year - 1)}
      onNext={() => setYear(year + 1)}
      hasNext={new Date(year + 1, 0, budgetStartDay) <= today}
      prevLabel="Previous year"
      nextLabel="Next year"
      tiles={tiles}
      columns={2}
    />
  );
}

/** Six years at a time, newest last, with arrows to page through earlier and later sets. */
export function YearGrid({
  selectedStart,
  budgetStartDay,
  today,
  onPick,
}: Props) {
  // The newest year that has started, following the budget day (e.g. on 3 Jan with a budget day of
  // 25, the current budget year still began last January).
  const latest = periodStart(today, budgetStartDay).getFullYear();
  const [page, setPage] = useState(() =>
    Math.max(
      0,
      Math.floor((latest - selectedStart.getFullYear()) / YEARS_PER_PAGE)
    )
  );
  const last = latest - page * YEARS_PER_PAGE;
  const first = last - YEARS_PER_PAGE + 1;
  const tiles: Tile[] = Array.from({ length: YEARS_PER_PAGE }, (_, i) => {
    const y = first + i;
    const start = new Date(y, 0, budgetStartDay);
    return {
      key: String(y),
      label: String(y),
      selected: y === selectedStart.getFullYear(),
      disabled: start > today,
      onPress: () => onPick(start),
    };
  });
  return (
    <TileGrid
      title={`${first} – ${last}`}
      onPrev={() => setPage(page + 1)}
      onNext={() => setPage(page - 1)}
      hasNext={page > 0}
      prevLabel="Earlier years"
      nextLabel="Later years"
      tiles={tiles}
    />
  );
}

function TileGrid({
  title,
  onPrev,
  onNext,
  hasNext,
  prevLabel,
  nextLabel,
  tiles,
  columns = 3,
  note,
}: {
  title: string;
  onPrev: () => void;
  onNext: () => void;
  hasNext: boolean;
  prevLabel: string;
  nextLabel: string;
  tiles: Tile[];
  columns?: 2 | 3;
  note?: string;
}) {
  const t = useTheme();
  return (
    <View>
      <View style={styles.header}>
        <Pressable onPress={onPrev} hitSlop={12} accessibilityLabel={prevLabel}>
          <Ionicons name="chevron-back" size={22} color={t.text} />
        </Pressable>
        <Text style={{ color: t.text, fontSize: 16, fontWeight: "700" }}>
          {title}
        </Text>
        <Pressable
          onPress={onNext}
          disabled={!hasNext}
          hitSlop={12}
          accessibilityLabel={nextLabel}
          style={{ opacity: hasNext ? 1 : 0.3 }}
        >
          <Ionicons name="chevron-forward" size={22} color={t.text} />
        </Pressable>
      </View>
      <View style={styles.grid}>
        {tiles.map((tile) => (
          <Pressable
            key={tile.key}
            onPress={tile.onPress}
            disabled={tile.disabled}
            accessibilityRole="button"
            accessibilityState={{
              selected: tile.selected,
              disabled: tile.disabled,
            }}
            style={[
              styles.tile,
              { width: columns === 2 ? "48.5%" : "31.5%" },
              tile.selected
                ? { backgroundColor: t.primary, borderColor: t.primary }
                : { backgroundColor: t.card, borderColor: t.border },
            ]}
          >
            <Text
              style={{
                color: tile.selected
                  ? "#fff"
                  : tile.disabled
                    ? t.border
                    : t.text,
                fontSize: 15,
                fontWeight: tile.selected ? "700" : "500",
              }}
            >
              {tile.label}
            </Text>
            {tile.sublabel && (
              <Text
                style={{
                  color: tile.selected ? "#fff" : t.muted,
                  fontSize: 12,
                  marginTop: 2,
                  opacity: tile.disabled ? 0.5 : 1,
                }}
              >
                {tile.sublabel}
              </Text>
            )}
          </Pressable>
        ))}
      </View>
      {note && <Text style={[styles.note, { color: t.muted }]}>{note}</Text>}
    </View>
  );
}

function ordinal(n: number) {
  const suffix =
    n % 10 === 1 && n !== 11
      ? "st"
      : n % 10 === 2 && n !== 12
        ? "nd"
        : n % 10 === 3 && n !== 13
          ? "rd"
          : "th";
  return `${n}${suffix}`;
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 4,
    marginBottom: 10,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 10,
  },
  tile: {
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
  },
  note: { fontSize: 12, textAlign: "center", marginTop: 10 },
});
