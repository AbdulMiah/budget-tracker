import { useQuery } from "@tanstack/react-query";
import { useCallback } from "react";

import { Transaction } from "@/constants/types";
import { useSettings } from "@/hooks/useSettings";
import { transactionsApi } from "@/services/transactions.service";
import { applyOverrides } from "@/utils/overrides";

export const transactionKeys = {
  all: ["transactions"] as const,
};

// The cache holds transactions as the bank reported them; the user's category
// and icon edits are applied on the way out, so editing never refetches.
export function useTransactions() {
  const { settings } = useSettings();
  const { txnOverrides, merchantOverrides } = settings;

  const select = useCallback(
    (transactions: Transaction[]) =>
      applyOverrides(transactions, txnOverrides, merchantOverrides),
    [txnOverrides, merchantOverrides]
  );

  return useQuery({
    queryKey: transactionKeys.all,
    queryFn: ({ signal }) => transactionsApi.listTransactions(signal),
    select,
  });
}
