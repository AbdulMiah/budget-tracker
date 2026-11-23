import {
  differenceInCalendarDays,
  format,
  startOfDay,
  startOfYear,
  subDays,
  subMonths,
} from "date-fns";

import { Account, Transaction } from "@/constants/types";

export type RangeKey = "1W" | "1M" | "3M" | "6M" | "YTD";
export const RANGES: RangeKey[] = ["1W", "1M", "3M", "6M", "YTD"];

export function rangeStart(range: RangeKey, today: Date): Date {
  const t = startOfDay(today);
  switch (range) {
    case "1W":
      return subDays(t, 6);
    case "1M":
      return subMonths(t, 1);
    case "3M":
      return subMonths(t, 3);
    case "6M":
      return subMonths(t, 6);
    case "YTD":
      return startOfYear(t);
  }
}

export type NetWorthPoint = { date: Date; value: number };

/**
 * Daily end-of-day net worth (pence) from `from` to `today`, rebuilt by walking
 * back from current balances. Transfers between own accounts net to zero.
 */
export function netWorthSeries(
  accounts: Account[],
  txns: Transaction[],
  from: Date,
  today: Date
): NetWorthPoint[] {
  const deltaByDay = new Map<string, number>();
  for (const t of txns)
    deltaByDay.set(t.date, (deltaByDay.get(t.date) ?? 0) + t.amount);

  let value = accounts.reduce((sum, a) => sum + a.balance, 0);
  const days = differenceInCalendarDays(today, from);
  const points: NetWorthPoint[] = [];
  for (let i = 0; i <= days; i++) {
    const d = subDays(today, i);
    points.push({ date: d, value });
    value -= deltaByDay.get(format(d, "yyyy-MM-dd")) ?? 0;
  }
  return points.reverse();
}

export type NiceAxis = { axisMin: number; step: number; sections: number };

/**
 * Tidy y-axis for values in pounds: starts at a round number at or below `min`, and always leaves
 * headroom above `max`, so the plotted line can never poke outside the chart.
 */
export function niceAxis(min: number, max: number): NiceAxis {
  const span = Math.max(max - min, 1);
  const raw = (span * 1.1) / 4;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const n = raw / mag;
  const step =
    (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * mag;
  const axisMin = Math.floor(min / step) * step;
  const sections = Math.floor((max - axisMin) / step) + 1;
  return { axisMin, step, sections };
}

/** Reduce a series to at most `max` points, keeping the last value of each bucket. */
export function downsample<T>(points: T[], max: number): T[] {
  if (points.length <= max) return points;
  const step = Math.ceil(points.length / max);
  const out: T[] = [];
  for (let i = points.length - 1; i >= 0; i -= step) out.push(points[i]);
  return out.reverse();
}
