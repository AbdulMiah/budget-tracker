import { Account, Transaction } from "@/constants/types";
import { useAccounts } from "@/services/accounts.queries";
import { useTransactions } from "@/services/transactions.queries";

// Stable empty lists, so memos keyed on them don't rerun while loading.
const NO_ACCOUNTS: Account[] = [];
const NO_TRANSACTIONS: Transaction[] = [];

/** Linked accounts and their transactions (with the user's edits), for screens that need both. */
export function useBankData() {
  const accounts = useAccounts();
  const transactions = useTransactions();

  return {
    accounts: accounts.data ?? NO_ACCOUNTS,
    transactions: transactions.data ?? NO_TRANSACTIONS,
    isPending: accounts.isPending || transactions.isPending,
    error: accounts.error ?? transactions.error,
    refetch: () => Promise.all([accounts.refetch(), transactions.refetch()]),
  };
}
