import { Override, Transaction } from "@/constants/types";
import { useSettings } from "@/hooks/useSettings";
import { useTransactions } from "@/services/transactions.queries";
import { withOverride } from "@/utils/overrides";

/** Saves a category/icon edit for one transaction, or for every transaction from its merchant. */
export function useEditTransaction() {
  const { update } = useSettings();
  const { data: transactions = [] } = useTransactions();

  return (txn: Transaction, override: Override, applyToMerchant: boolean) =>
    update((settings) =>
      withOverride(settings, transactions, txn, override, applyToMerchant)
    );
}
