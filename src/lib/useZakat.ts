import { differenceInCalendarDays, parseISO, startOfDay } from "date-fns";
import { useMemo } from "react";

import { useStore } from "../store/useStore";
import {
  meetsNisab,
  Nisab,
  nisabValues,
  PaymentEntry,
  zakatOn,
  zakatPayments,
  ZakatYear,
  zakatYears,
} from "./zakat";

export type ZakatStatus = {
  netWorth: number;
  nisab: Nisab;
  /** Today's net worth meets nisab. */
  aboveNisab: boolean;
  /** 2.5% of today's net worth, or 0 below nisab. */
  zakatToday: number;
  /** Null until tracking starts. */
  start: Date | null;
  /** Every zakat year so far, oldest first; the last is the one in progress. Empty before tracking starts. */
  years: ZakatYear[];
  current: ZakatYear | null;
  /** Completed years that still have zakat to pay, oldest first. */
  overdue: ZakatYear[];
  /** Days from today until the current year's due date. */
  daysLeft: number;
  /** Every payment, newest first. */
  payments: PaymentEntry[];
};

export function useZakat(): ZakatStatus {
  const {
    accounts,
    transactions,
    zakatStart,
    goldPrice,
    silverPrice,
    zakatPayments: manual,
    zakatWealthOverrides,
  } = useStore();
  return useMemo(() => {
    const today = startOfDay(new Date());
    const netWorth = accounts.reduce((sum, a) => sum + a.balance, 0);
    const nisab = nisabValues(goldPrice, silverPrice);
    const start = zakatStart ? parseISO(zakatStart) : null;
    const payments = zakatPayments(manual, transactions);
    const years = start
      ? zakatYears({
          start,
          today,
          accounts,
          txns: transactions,
          payments,
          wealthOverrides: zakatWealthOverrides,
          nisab,
        })
      : [];
    const current = years.at(-1) ?? null;
    return {
      netWorth,
      nisab,
      aboveNisab: meetsNisab(netWorth, nisab),
      zakatToday: zakatOn(netWorth, nisab),
      start,
      years,
      current,
      overdue: years.filter((y) => y.complete && y.remaining > 0),
      daysLeft: current ? differenceInCalendarDays(current.due, today) : 0,
      payments: [...payments].reverse(),
    };
  }, [
    accounts,
    transactions,
    zakatStart,
    goldPrice,
    silverPrice,
    manual,
    zakatWealthOverrides,
  ]);
}
