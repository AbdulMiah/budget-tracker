import {
  QueryClient,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";

import { BankId } from "@/constants/types";
import { accountKeys } from "@/services/accounts.queries";
import { banksApi } from "@/services/banks.service";
import { transactionKeys } from "@/services/transactions.queries";

// A newly linked bank brings new accounts and transactions.
export function useConnectBank() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (bank: BankId) => banksApi.connect(bank),
    // The consent page opens in the browser, so refetch now; the app refetches again when it comes back to the foreground.
    onSuccess: () => invalidateBankData(queryClient),
  });
}

// Accounts and the transactions on them.
export function invalidateBankData(queryClient: QueryClient) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: accountKeys.all }),
    queryClient.invalidateQueries({ queryKey: transactionKeys.all }),
  ]);
}
