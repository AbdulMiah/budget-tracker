import { addDays, addMonths, startOfDay } from "date-fns";

/** First day of the budget period containing `date`. */
export function periodStart(date: Date, startDay: number): Date {
  const d = startOfDay(date);
  const thisMonth = new Date(d.getFullYear(), d.getMonth(), startDay);
  return d >= thisMonth ? thisMonth : addMonths(thisMonth, -1);
}

/** Last day (inclusive) of the budget period that begins at `start`. */
export function periodEnd(start: Date): Date {
  return addDays(addMonths(start, 1), -1);
}
