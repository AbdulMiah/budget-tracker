import * as Linking from "expo-linking";

import { IS_DEMO } from "@/config/env";
import { BankId } from "@/constants/types";
import { apiGet } from "@/utils/api-client";

export const banksApi = {
  /** Starts the consent flow for a bank by opening the aggregator's auth page. */
  async connect(bank: BankId): Promise<void> {
    // Demo data is already "connected".
    if (IS_DEMO) return;

    const { url } = await apiGet<{ url: string }>(`/connect/${bank}`);
    await Linking.openURL(url);
  },
};
