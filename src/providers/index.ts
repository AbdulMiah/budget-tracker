import { mockProvider } from "@/providers/mock";
import { createRemoteProvider } from "@/providers/remote";
import { BankProvider } from "@/providers/types";

const apiUrl = process.env.EXPO_PUBLIC_API_URL;

/** Real backend when EXPO_PUBLIC_API_URL is set, otherwise demo data. */
export const provider: BankProvider = apiUrl
  ? createRemoteProvider(apiUrl)
  : mockProvider;
export const usingDemoData = !apiUrl;
