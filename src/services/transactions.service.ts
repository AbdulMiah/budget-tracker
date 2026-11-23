import { IS_DEMO } from "@/config/env";
import { Category, Transaction } from "@/constants/types";
import { getDemoTransactions } from "@/services/demo-data";
import { apiGet } from "@/utils/api-client";
import { categorize } from "@/utils/categories";

// The category is optional from the API; missing ones are filled in by the app's rules.
type ApiTransaction = Omit<Transaction, "category"> & { category?: Category };

export const transactionsApi = {
  /** Every transaction on the linked accounts, newest first. */
  async listTransactions(signal?: AbortSignal): Promise<Transaction[]> {
    if (IS_DEMO) return getDemoTransactions();
    const transactions = await apiGet<ApiTransaction[]>("/transactions", {
      signal,
    });
    return transactions
      .map((t) => ({
        ...t,
        category: t.category ?? categorize(t.merchant, t.description),
      }))
      .sort((a, b) => b.date.localeCompare(a.date));
  },
};
