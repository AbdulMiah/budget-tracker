import { differenceInCalendarDays, startOfDay } from "date-fns";

/** A copy of the record with `key` set, or removed when `value` is null. */
export function withEntry<K extends string, V>(
  record: Partial<Record<K, V>>,
  key: K,
  value: V | null
): Partial<Record<K, V>> {
  const next = { ...record };
  if (value === null) delete next[key];
  else next[key] = value;
  return next;
}

/** 1 -> "1st", 22 -> "22nd". */
export function ordinal(n: number): string {
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

/** "Category", "Category: Groceries", or "Categories: 3". */
export function filterLabel(
  singular: string,
  plural: string,
  values: string[]
): string {
  if (values.length === 0) return singular;
  if (values.length === 1) return `${singular}: ${values[0]}`;
  return `${plural}: ${values.length}`;
}

/** "Due today", "Due tomorrow" or "Due in 5 days". */
export function dueIn(date: Date): string {
  const days = differenceInCalendarDays(date, startOfDay(new Date()));
  if (days <= 0) return "Due today";
  if (days === 1) return "Due tomorrow";
  return `Due in ${days} days`;
}
