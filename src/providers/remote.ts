import * as Linking from 'expo-linking';
import { categorize } from '../lib/categories';
import { BankId } from '../lib/types';
import { BankData, BankProvider } from './types';

/**
 * Talks to your own backend, which holds the open-banking / Wise credentials.
 * Bank secrets must never ship inside the app. See README for the contract:
 *   GET  {API}/accounts      -> Account[]
 *   GET  {API}/transactions  -> Transaction[] (category optional)
 *   GET  {API}/connect/:bank -> { url } consent page to open in the browser
 * Each request carries the signed-in user's access token.
 */
export function createRemoteProvider(baseUrl: string, accessToken: () => Promise<string | null>): BankProvider {
  const get = async <T>(path: string): Promise<T> => {
    const token = await accessToken();
    const res = await fetch(`${baseUrl}${path}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (res.status === 401) throw new Error('Your session has expired. Sign in again.');
    if (!res.ok) throw new Error(`${path} failed: ${res.status}`);
    return res.json();
  };

  return {
    async fetchAll(): Promise<BankData> {
      const [accounts, transactions] = await Promise.all([
        get<BankData['accounts']>('/accounts'),
        get<BankData['transactions']>('/transactions'),
      ]);
      return {
        // Older backends may not send a type; treat those as current accounts.
        accounts: accounts.map((a) => ({ ...a, type: a.type ?? 'current' })),
        transactions: transactions
          .map((t) => ({ ...t, category: t.category ?? categorize(t.merchant, t.description) }))
          .sort((a, b) => b.date.localeCompare(a.date)),
      };
    },
    async connect(bank: BankId) {
      const { url } = await get<{ url: string }>(`/connect/${bank}`);
      await Linking.openURL(url);
    },
  };
}
