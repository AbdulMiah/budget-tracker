import Constants from 'expo-constants';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { categorize } from '../lib/categories';
import { BankId } from '../lib/types';
import { BankData, BankProvider } from './types';

/**
 * Talks to your own backend, which holds the open-banking / Wise credentials.
 * Bank secrets must never ship inside the app. See README for the contract:
 *   GET  {API}/accounts      -> Account[]
 *   GET  {API}/transactions  -> Transaction[] (category optional)
 *   GET  {API}/connect/:bank?redirect=<app url> -> { url } consent page to open in the browser
 * Each request carries the signed-in user's access token.
 */
export function createRemoteProvider(baseUrl: string, accessToken: () => Promise<string | null>): BankProvider {
  const get = async <T>(path: string): Promise<T> => {
    const token = await accessToken();
    const res = await fetch(`${baseUrl}${path}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (res.status === 401) throw new Error('Your session has expired. Sign in again.');
    if (!res.ok) {
      // The backend sends { error } with a readable reason where it has one.
      const body = await res.json().catch(() => null);
      throw new Error(body?.error ?? `${path.split('?')[0]} failed: ${res.status}`);
    }
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
      // The backend sends the browser here when consent is done, which is how the auth session knows to close.
      const redirect = appReturnUrl();
      const { url } = await get<{ url: string }>(`/connect/${bank}?redirect=${encodeURIComponent(redirect)}`);
      const result = await WebBrowser.openAuthSessionAsync(url, redirect);
      if (result.type !== 'success') return false;
      const { queryParams } = Linking.parse(result.url);
      if (queryParams?.connected === '1') return true;
      const error = queryParams?.error;
      if (error === 'cancelled' || error === 'access_denied') return false;
      throw new Error(`The bank didn't complete the connection (${String(error ?? 'unknown error')}).`);
    },
  };
}

/**
 * budgetapp://settings in a build. Expo Go only opens exp:// links, and createURL can't be trusted there: some
 * Expo Go versions report a "bare" environment, so it returns budgetapp://, which nothing on the phone opens.
 * Build the exp:// link from the dev server address instead.
 */
function appReturnUrl() {
  const hostUri = Constants.expoConfig?.hostUri;
  if (Constants.expoGoConfig && hostUri) return `exp://${hostUri.replace(/\/$/, '')}/--/settings`;
  return Linking.createURL('settings');
}
