import { IS_DEMO } from "@/config/env";
import { Account } from "@/constants/types";
import { getDemoAccounts } from "@/services/demo-data";
import { apiGet } from "@/utils/api-client";

export const accountsApi = {
  async listAccounts(signal?: AbortSignal): Promise<Account[]> {
    if (IS_DEMO) return getDemoAccounts();
    const accounts = await apiGet<Account[]>("/accounts", { signal });
    // Older backends may not send a type; treat those as current accounts.
    return accounts.map((a) => ({ ...a, type: a.type ?? "current" }));
  },
};
