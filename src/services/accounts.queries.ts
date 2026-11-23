import { useQuery } from "@tanstack/react-query";

import { accountsApi } from "@/services/accounts.service";

export const accountKeys = {
  all: ["accounts"] as const,
};

export function useAccounts() {
  return useQuery({
    queryKey: accountKeys.all,
    queryFn: ({ signal }) => accountsApi.listAccounts(signal),
  });
}
