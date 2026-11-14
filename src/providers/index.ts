import { mockProvider } from './mock';
import { createRemoteProvider } from './remote';
import { BankProvider } from './types';

const apiUrl = process.env.EXPO_PUBLIC_API_URL;

/** Real backend when EXPO_PUBLIC_API_URL is set, otherwise demo data. */
export const provider: BankProvider = apiUrl ? createRemoteProvider(apiUrl) : mockProvider;
export const usingDemoData = !apiUrl;
