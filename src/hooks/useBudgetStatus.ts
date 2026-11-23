import { useMemo } from "react";

import { useBankData } from "@/hooks/useBankData";
import { useSettings } from "@/hooks/useSettings";
import { budgetStatus, BudgetStatus } from "@/utils/budget";
import { detectRecurring } from "@/utils/recurring";

/** This budget month's status, or null when no budget limit has been set. */
export function useBudgetStatus(): BudgetStatus | null {
  const { transactions } = useBankData();
  const { settings } = useSettings();
  const { budgetLimit, categoryBudgets, budgetStartDay } = settings;
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
