import { useMemo } from "react";

import { useStore } from "../store/useStore";
import { budgetStatus, BudgetStatus } from "./budget";
import { detectRecurring } from "./recurring";

/** This budget month's status, or null when no budget limit has been set. */
export function useBudgetStatus(): BudgetStatus | null {
  const { transactions, budgetLimit, categoryBudgets, budgetStartDay } =
    useStore();
  return useMemo(() => {
    if (budgetLimit === null) return null;
    const today = new Date();
    return budgetStatus(
      transactions,
      detectRecurring(transactions, today),
      budgetLimit,
      categoryBudgets,
      budgetStartDay,
      today
    );
  }, [transactions, budgetLimit, categoryBudgets, budgetStartDay]);
}
