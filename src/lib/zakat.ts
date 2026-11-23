import { format } from "date-fns";

import { fromHijri, HijriDate, toHijri } from "./hijri";
import { Account, Transaction } from "./types";

export const ZAKAT_RATE = 0.025;
export const GOLD_NISAB_GRAMS = 87.48;
export const SILVER_NISAB_GRAMS = 612.36;

/** A payment recorded by hand (cash, or from an account that isn't linked). Amount is positive pence. */
export type ZakatPayment = {
  id: string;
  date: string;
  amount: number;
  note?: string;
};

/** A manual payment or a bank transaction labelled Zakat. Amount is positive pence paid. */
export type PaymentEntry = {
  id: string;
  date: string;
  amount: number;
  source: "manual" | "bank";
  note?: string;
  accountId?: string;
};

export type Nisab = {
  /** Value of 87.48g of gold, in pence, or null without a gold price. */
  gold: number | null;
  /** Value of 612.36g of silver, in pence, or null without a silver price. */
  silver: number | null;
  /** Wealth at or above this means zakat is due: the lower of the two, as meeting either is enough. */
  threshold: number | null;
};

/** Prices are pence per gram. */
export function nisabValues(
  goldPrice: number | null,
  silverPrice: number | null
): Nisab {
  const gold =
    goldPrice === null ? null : Math.round(goldPrice * GOLD_NISAB_GRAMS);
  const silver =
    silverPrice === null ? null : Math.round(silverPrice * SILVER_NISAB_GRAMS);
  const known = [gold, silver].filter((v): v is number => v !== null);
  return { gold, silver, threshold: known.length ? Math.min(...known) : null };
}

/** True when wealth meets nisab. Without any prices nisab can't be checked, so zakat is assumed due. */
export const meetsNisab = (wealth: number, nisab: Nisab) =>
  wealth > 0 && (nisab.threshold === null || wealth >= nisab.threshold);

export const zakatOn = (wealth: number, nisab: Nisab) =>
  meetsNisab(wealth, nisab) ? Math.round(wealth * ZAKAT_RATE) : 0;

/** End-of-day net worth on `date`, rebuilt by taking later transactions off current balances. */
export function netWorthOn(
  accounts: Account[],
  txns: Transaction[],
  date: Date
): number {
  const day = format(date, "yyyy-MM-dd");
  let value = accounts.reduce((sum, a) => sum + a.balance, 0);
  for (const t of txns) if (t.date > day) value -= t.amount;
  return value;
}

/** Manual payments and Zakat-labelled bank transactions, oldest first. */
export function zakatPayments(
  manual: ZakatPayment[],
  txns: Transaction[]
): PaymentEntry[] {
  const bank: PaymentEntry[] = txns
    .filter((t) => t.category === "Zakat")
    .map((t) => ({
      id: t.id,
      date: t.date,
      amount: -t.amount,
      source: "bank",
      note: t.merchant,
      accountId: t.accountId,
    }));
  const own: PaymentEntry[] = manual.map((p) => ({ ...p, source: "manual" }));
  return [...bank, ...own].sort(
    (a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id)
  );
}

export type ZakatYear = {
  /** The Hijri year the zakat falls due in, as a string, e.g. "1448". */
  key: string;
  hijriYear: number;
  /** First day of the lunar year (hawl). */
  start: Date;
  /** The anniversary the zakat falls due on. */
  due: Date;
  dueHijri: HijriDate;
  /** The due date has been reached, so the amount is fixed. */
  complete: boolean;
  /** Wealth the zakat is worked out on: net worth on the due date, or today for the current year. */
  wealth: number;
  /** Where `wealth` came from. 'history' is rebuilt from transactions; 'manual' is the user's figure. */
  wealthSource: "current" | "history" | "manual";
  /** The due date is before the earliest transaction, so a 'history' figure is just today's balances. */
  beforeHistory: boolean;
  aboveNisab: boolean;
  zakat: number;
  paid: number;
  /** zakat - paid. Only the latest year can go negative (paid in advance beyond its estimate). */
  remaining: number;
  /** The payments (or parts of them) counted towards this year. */
  allocations: { payment: PaymentEntry; amount: number }[];
};

type YearsInput = {
  /** First day of the first hawl: the day wealth first reached nisab. */
  start: Date;
  today: Date;
  accounts: Account[];
  txns: Transaction[];
  payments: PaymentEntry[];
  /** The user's own wealth figures for completed years, keyed by `ZakatYear.key`. */
  wealthOverrides: Record<string, number>;
  nisab: Nisab;
};

/**
 * Every lunar year from `start` up to the one in progress, oldest first.
 *
 * Payments are treated like paying off a debt: each one goes to the oldest year that still has
 * zakat outstanding, then the next. That fits the usual practice of paying just after the due
 * date, and payments made early count towards the year in progress. Anything left over after the
 * latest year stays on it as an advance.
 */
export function zakatYears({
  start,
  today,
  accounts,
  txns,
  payments,
  wealthOverrides,
  nisab,
}: YearsInput): ZakatYear[] {
  const anniversary = toHijri(start);
  const earliest = txns.reduce(
    (min, t) => (t.date < min ? t.date : min),
    format(today, "yyyy-MM-dd")
  );
  const current = netWorthOn(accounts, [], today);
  const years: ZakatYear[] = [];

  for (let yearStart = start, n = 1; yearStart <= today; n++) {
    const dueHijri = { ...anniversary, year: anniversary.year + n };
    const due = fromHijri(dueHijri);
    const key = String(dueHijri.year);
    const complete = due <= today;
    const override = complete ? wealthOverrides[key] : undefined;
    const wealth =
      override ?? (complete ? netWorthOn(accounts, txns, due) : current);
    const zakat = zakatOn(wealth, nisab);
    years.push({
      key,
      hijriYear: dueHijri.year,
      start: yearStart,
      due,
      dueHijri,
      complete,
      wealth,
      wealthSource:
        override !== undefined ? "manual" : complete ? "history" : "current",
      beforeHistory: complete && format(due, "yyyy-MM-dd") < earliest,
      aboveNisab: meetsNisab(wealth, nisab),
      zakat,
      paid: 0,
      remaining: zakat,
      allocations: [],
    });
    yearStart = due;
  }

  const from = format(start, "yyyy-MM-dd");
  let i = 0;
  for (const payment of payments) {
    if (payment.date < from || !years.length) continue;
    let left = payment.amount;
    while (left !== 0) {
      // Skip settled years, but the last one takes whatever is left.
      while (i < years.length - 1 && years[i].remaining <= 0) i++;
      const year = years[i];
      const amount =
        i === years.length - 1 || left < 0
          ? left
          : Math.min(left, year.remaining);
      year.paid += amount;
      year.remaining -= amount;
      year.allocations.push({ payment, amount });
      left -= amount;
    }
  }
  return years;
}
