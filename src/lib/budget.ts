import {
  differenceInCalendarDays,
  format,
  isAfter,
  startOfDay,
} from "date-fns";

import { periodEnd, periodStart } from "./budgetPeriod";
import { advance, RecurringPayment } from "./recurring";
import { Category, Transaction } from "./types";

export type Upcoming = { payment: RecurringPayment; date: Date };

export type CategoryBudget = {
  category: Category;
  limit: number;
  spent: number;
  committed: number;
};

export type BudgetStatus = {
  start: Date;
  end: Date;
  limit: number;
  /** Spent so far this budget month (transfers between own accounts and zakat excluded). */
  spent: number;
  /** Recurring payments still due between today and the end of the month. */
  committed: number;
  upcoming: Upcoming[];
  /** limit - spent - committed; negative when over budget. */
  remaining: number;
  /** Days left including today. */
  daysLeft: number;
  /** What can be spent each remaining day and still stay within the limit (0 when over). */
  dailyAllowance: number;
  categories: CategoryBudget[];
};

/**
 * Recurring payments expected from today to `end`, one entry per charge (a weekly payment can
 * fall several times). A charge already taken today has moved its next date on, so isn't counted twice.
 */
export function upcomingPayments(
  recurring: RecurringPayment[],
  today: Date,
  end: Date
): Upcoming[] {
  const from = startOfDay(today);
  const out: Upcoming[] = [];
  for (const payment of recurring) {
    if (payment.direction !== "out" || payment.category === "Zakat") continue;
    for (
      let date = payment.nextDate;
      !isAfter(date, end);
      date = advance(date, payment.frequency)
    ) {
      if (date >= from) out.push({ payment, date });
    }
  }
  return out.sort((a, b) => a.date.getTime() - b.date.getTime());
}

export function budgetStatus(
  txns: Transaction[],
  recurring: RecurringPayment[],
  limit: number,
  categoryLimits: Partial<Record<Category, number>>,
  startDay: number,
  today: Date
): BudgetStatus {
  const day = startOfDay(today);
  const start = periodStart(day, startDay);
  const end = periodEnd(start);
  const from = format(start, "yyyy-MM-dd");
  const to = format(day, "yyyy-MM-dd");

  const spentBy = new Map<Category, number>();
  let spent = 0;
  for (const t of txns) {
    if (
      t.amount >= 0 ||
      t.category === "Transfer" ||
      t.category === "Zakat" ||
      t.date < from ||
      t.date > to
    )
      continue;
    spent -= t.amount;
    spentBy.set(t.category, (spentBy.get(t.category) ?? 0) - t.amount);
  }

  const upcoming = upcomingPayments(recurring, day, end);
  const committedBy = new Map<Category, number>();
  let committed = 0;
  for (const u of upcoming) {
    committed += u.payment.amount;
    committedBy.set(
      u.payment.category,
      (committedBy.get(u.payment.category) ?? 0) + u.payment.amount
    );
  }

  const remaining = limit - spent - committed;
  const daysLeft = differenceInCalendarDays(end, day) + 1;
  const categories = (Object.entries(categoryLimits) as [Category, number][])
    .map(([category, categoryLimit]) => ({
      category,
      limit: categoryLimit,
      spent: spentBy.get(category) ?? 0,
      committed: committedBy.get(category) ?? 0,
    }))
    .sort((a, b) => b.limit - a.limit);

  return {
    start,
    end,
    limit,
    spent,
    committed,
    upcoming,
    remaining,
    daysLeft,
    dailyAllowance: remaining > 0 ? Math.floor(remaining / daysLeft) : 0,
    categories,
  };
}
