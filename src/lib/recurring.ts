import { addMonths, addWeeks, addYears, differenceInCalendarDays, isBefore, parseISO, startOfDay } from 'date-fns';
import { Category, Transaction } from './types';

export type Frequency = 'Weekly' | 'Fortnightly' | 'Monthly' | 'Yearly';

/** 'out' for bills and subscriptions, 'in' for regular income such as salary. */
export type Direction = 'out' | 'in';

export type RecurringPayment = {
  key: string;
  direction: Direction;
  merchant: string;
  category: Category;
  /** Account the latest charge came from. */
  accountId: string;
  frequency: Frequency;
  /** Typical amount in pence, always positive whichever the direction. */
  amount: number;
  lastDate: Date;
  nextDate: Date;
  occurrences: number;
  /** Cost normalised to a month, in pence. */
  monthlyCost: number;
  /** The charges this was detected from, newest first. */
  history: Transaction[];
};

const merchantKey = (m: string) =>
  m.toLowerCase().replace(/[^a-z\s]/g, ' ').replace(/\s+/g, ' ').trim();

const median = (xs: number[]) => {
  const s = [...xs].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
};

function classify(days: number): Frequency | null {
  if (days >= 6 && days <= 8) return 'Weekly';
  if (days >= 13 && days <= 15) return 'Fortnightly';
  if (days >= 27 && days <= 33) return 'Monthly';
  if (days >= 360 && days <= 370) return 'Yearly';
  return null;
}

const TOLERANCE: Record<Frequency, number> = { Weekly: 2, Fortnightly: 3, Monthly: 4, Yearly: 7 };
const MONTHLY_FACTOR: Record<Frequency, number> = {
  Weekly: 52 / 12,
  Fortnightly: 26 / 12,
  Monthly: 1,
  Yearly: 1 / 12,
};

export function advance(date: Date, f: Frequency): Date {
  switch (f) {
    case 'Weekly':
      return addWeeks(date, 1);
    case 'Fortnightly':
      return addWeeks(date, 2);
    case 'Monthly':
      return addMonths(date, 1);
    case 'Yearly':
      return addYears(date, 1);
  }
}

/**
 * Finds repeating payments in either direction: same merchant, steady interval, similar amount.
 * Payments that stopped (nothing for ~2 periods) are dropped.
 */
export function detectRecurring(txns: Transaction[], today: Date): RecurringPayment[] {
  const groups = new Map<string, Transaction[]>();
  for (const t of txns) {
    if (t.amount === 0 || t.category === 'Transfer') continue;
    // Money in and out from the same merchant (e.g. a refund) are separate series. Outgoing keys
    // stay as the plain merchant so existing links keep working.
    const key = t.amount < 0 ? merchantKey(t.merchant) : `in:${merchantKey(t.merchant)}`;
    groups.set(key, [...(groups.get(key) ?? []), t]);
  }

  const now = startOfDay(today);
  const found: RecurringPayment[] = [];

  for (const [key, list] of groups) {
    if (list.length < 2) continue;
    list.sort((a, b) => a.date.localeCompare(b.date));
    const dates = list.map((t) => parseISO(t.date));
    const gaps = dates.slice(1).map((d, i) => differenceInCalendarDays(d, dates[i]));
    const frequency = classify(median(gaps));
    if (!frequency) continue;
    if (list.length < 3 && frequency !== 'Yearly') continue;

    const typicalGap = median(gaps);
    const regular = gaps.filter((g) => Math.abs(g - typicalGap) <= TOLERANCE[frequency]).length;
    if (regular / gaps.length < 0.7) continue;

    const amounts = list.map((t) => Math.abs(t.amount));
    const typical = median(amounts);
    if (amounts.some((a) => Math.abs(a - typical) / typical > 0.25)) continue;

    const lastDate = dates[dates.length - 1];
    let nextDate = advance(lastDate, frequency);
    // Stopped: the next charge is more than a full period overdue.
    if (isBefore(advance(nextDate, frequency), now)) continue;
    while (isBefore(nextDate, now)) nextDate = advance(nextDate, frequency);

    const latest = list[list.length - 1];
    found.push({
      key,
      direction: list[0].amount < 0 ? 'out' : 'in',
      merchant: latest.merchant,
      category: latest.category,
      accountId: latest.accountId,
      frequency,
      amount: Math.round(amounts[amounts.length - 1]),
      lastDate,
      nextDate,
      occurrences: list.length,
      monthlyCost: Math.round(amounts[amounts.length - 1] * MONTHLY_FACTOR[frequency]),
      history: [...list].reverse(),
    });
  }

  return found.sort((a, b) => a.nextDate.getTime() - b.nextDate.getTime());
}
