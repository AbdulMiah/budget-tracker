import {
  addDays,
  addMonths,
  differenceInCalendarDays,
  format,
  parseISO,
  startOfWeek,
} from "date-fns";

import { periodEnd, periodStart } from "./budgetPeriod";
import { Transaction } from "./types";

export type PeriodKind = "week" | "month" | "quarter" | "year" | "custom";

export const PERIOD_KINDS: { kind: PeriodKind; label: string }[] = [
  { kind: "week", label: "Weekly" },
  { kind: "month", label: "Monthly" },
  { kind: "quarter", label: "Quarterly" },
  { kind: "year", label: "Yearly" },
  { kind: "custom", label: "Custom" },
];

/** Inclusive on both ends, at local midnight. */
export type DateRange = { start: Date; end: Date };

/**
 * The period containing `anchor`. Weeks run Monday to Sunday; months, quarters and years follow
 * the user's budget day, so with a budget day of 25 the "November" month is 25 Nov to 24 Dec.
 */
export function resolveRange(
  kind: PeriodKind,
  anchor: Date,
  startDay: number,
  custom: DateRange
): DateRange {
  switch (kind) {
    case "week": {
      const start = startOfWeek(anchor, { weekStartsOn: 1 });
      return { start, end: addDays(start, 6) };
    }
    case "month": {
      const start = periodStart(anchor, startDay);
      return { start, end: periodEnd(start) };
    }
    case "quarter": {
      const month = periodStart(anchor, startDay);
      const start = new Date(
        month.getFullYear(),
        Math.floor(month.getMonth() / 3) * 3,
        startDay
      );
      return { start, end: addDays(addMonths(start, 3), -1) };
    }
    case "year": {
      const month = periodStart(anchor, startDay);
      const start = new Date(month.getFullYear(), 0, startDay);
      return { start, end: addDays(addMonths(start, 12), -1) };
    }
    case "custom":
      return custom;
  }
}

/** Move the anchor one period back (-1) or forward (+1). */
export function shiftAnchor(kind: PeriodKind, anchor: Date, dir: 1 | -1): Date {
  switch (kind) {
    case "week":
      return addDays(anchor, 7 * dir);
    case "month":
      return addMonths(anchor, dir);
    case "quarter":
      return addMonths(anchor, 3 * dir);
    case "year":
      return addMonths(anchor, 12 * dir);
    case "custom":
      return anchor;
  }
}

export function rangeDates(range: DateRange): string {
  // Only repeat the year when the range crosses into a new one.
  const startFormat =
    range.start.getFullYear() === range.end.getFullYear()
      ? "d MMM"
      : "d MMM yyyy";
  return `${format(range.start, startFormat)} – ${format(range.end, "d MMM yyyy")}`;
}

/** Friendly heading when the budget month is a calendar month, otherwise the plain dates. */
export function rangeTitle(
  kind: PeriodKind,
  range: DateRange,
  startDay: number
): string {
  if (startDay === 1) {
    if (kind === "month") return format(range.start, "MMMM yyyy");
    if (kind === "quarter")
      return `Q${Math.floor(range.start.getMonth() / 3) + 1} ${range.start.getFullYear()}`;
    if (kind === "year") return String(range.start.getFullYear());
  }
  return rangeDates(range);
}

/** Income and spending totals for a whole range, shaped for the bar chart. */
export type Bucket = {
  label: string;
  start: Date;
  end: Date;
  income: number;
  spending: number;
};

/** Total income and spending across the range (transfers between own accounts excluded). */
export function rangeTotals(txns: Transaction[], range: DateRange): Bucket {
  const from = format(range.start, "yyyy-MM-dd");
  const to = format(range.end, "yyyy-MM-dd");
  let income = 0;
  let spending = 0;
  for (const t of txns) {
    if (t.category === "Transfer" || t.date < from || t.date > to) continue;
    if (t.amount > 0) income += t.amount;
    else spending -= t.amount;
  }
  return {
    label: rangeDates(range),
    start: range.start,
    end: range.end,
    income,
    spending,
  };
}

export type GroupBy = "category" | "merchant";

export type GroupRow = {
  key: string;
  category: Transaction["category"];
  icon?: string | null;
  spending: number;
  income: number;
};

/** Per-category or per-merchant totals for the range (transfers excluded). */
export function groupTotals(
  txns: Transaction[],
  range: DateRange,
  by: GroupBy
): GroupRow[] {
  const from = format(range.start, "yyyy-MM-dd");
  const to = format(range.end, "yyyy-MM-dd");
  const groups = new Map<string, GroupRow>();
  for (const t of txns) {
    if (t.category === "Transfer" || t.date < from || t.date > to) continue;
    const key = by === "category" ? t.category : t.merchant;
    let row = groups.get(key);
    if (!row) {
      // Transactions arrive newest first, so the first one seen supplies the latest category/icon.
      row = { key, category: t.category, icon: t.icon, spending: 0, income: 0 };
      groups.set(key, row);
    }
    if (t.amount > 0) row.income += t.amount;
    else row.spending -= t.amount;
  }
  return [...groups.values()];
}

/** What the user picked: a kind of period plus which one (`anchor`), or a custom range. */
export type PeriodSelection = {
  kind: PeriodKind;
  anchor: Date;
  custom: DateRange;
};

export type ResolvedPeriod = {
  /** The whole period, used for stepping back and forward. */
  fullRange: DateRange;
  /** The period capped at today, since days that haven't happened have nothing to show. */
  range: DateRange;
  title: string;
  /** The exact dates, or null when the title already shows them. */
  subtitle: string | null;
  /** True when the period contains today, so there is no next one yet. */
  isCurrent: boolean;
};

export function resolvePeriod(
  sel: PeriodSelection,
  startDay: number,
  today: Date
): ResolvedPeriod {
  const fullRange = resolveRange(sel.kind, sel.anchor, startDay, sel.custom);
  const range =
    fullRange.end > today ? { start: fullRange.start, end: today } : fullRange;
  const named = rangeTitle(sel.kind, fullRange, startDay);
  const title = named === rangeDates(fullRange) ? rangeDates(range) : named;
  const dates = rangeDates(range);
  return {
    fullRange,
    range,
    title,
    subtitle: title === dates ? null : dates,
    isCurrent: fullRange.end >= today,
  };
}

/**
 * The selection one period back (-1) or forward (+1), or null when that would be in the future.
 * Custom ranges move by their own length, so a 10-day range steps to the 10 days before it.
 */
export function stepSelection(
  sel: PeriodSelection,
  dir: 1 | -1,
  startDay: number,
  today: Date
): PeriodSelection | null {
  if (sel.kind === "custom") {
    if (dir === 1 && sel.custom.end >= today) return null;
    const days = differenceInCalendarDays(sel.custom.end, sel.custom.start) + 1;
    let start = addDays(sel.custom.start, days * dir);
    let end = addDays(sel.custom.end, days * dir);
    if (end > today) {
      end = today;
      start = addDays(today, 1 - days);
    }
    return { ...sel, custom: { start, end } };
  }
  if (dir === 1 && resolvePeriod(sel, startDay, today).isCurrent) return null;
  const next = shiftAnchor(sel.kind, sel.anchor, dir);
  return { ...sel, anchor: next > today ? today : next };
}

/** Spending on each day of the range, oldest first (transfers excluded). */
export function dailySpending(txns: Transaction[], range: DateRange): number[] {
  const days = differenceInCalendarDays(range.end, range.start) + 1;
  const out = new Array<number>(Math.max(0, days)).fill(0);
  const from = format(range.start, "yyyy-MM-dd");
  const to = format(range.end, "yyyy-MM-dd");
  for (const t of txns) {
    if (
      t.category === "Transfer" ||
      t.amount >= 0 ||
      t.date < from ||
      t.date > to
    )
      continue;
    out[differenceInCalendarDays(parseISO(t.date), range.start)] -= t.amount;
  }
  return out;
}
