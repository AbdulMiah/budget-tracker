import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { AppState } from 'react-native';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const key = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

// Some iOS releases refuse Keychain values over ~2 KB and a session can be bigger,
// so the session is split across several entries: `<key>.n` holds the count.
const CHUNK = 1800;

const chunkedSecureStore = {
  async getItem(name: string) {
    const count = await SecureStore.getItemAsync(`${name}.n`);
    if (count === null) return null;
    const parts = await Promise.all(
      Array.from({ length: Number(count) }, (_, i) => SecureStore.getItemAsync(`${name}.${i}`)),
    );
    return parts.some((p) => p === null) ? null : parts.join('');
  },
  async setItem(name: string, value: string) {
    const before = Number((await SecureStore.getItemAsync(`${name}.n`)) ?? 0);
    const count = Math.ceil(value.length / CHUNK);
    for (let i = 0; i < count; i++) {
      await SecureStore.setItemAsync(`${name}.${i}`, value.slice(i * CHUNK, (i + 1) * CHUNK));
    }
    await SecureStore.setItemAsync(`${name}.n`, String(count));
    for (let i = count; i < before; i++) await SecureStore.deleteItemAsync(`${name}.${i}`);
  },
  async removeItem(name: string) {
    const count = Number((await SecureStore.getItemAsync(`${name}.n`)) ?? 0);
    for (let i = 0; i < count; i++) await SecureStore.deleteItemAsync(`${name}.${i}`);
    await SecureStore.deleteItemAsync(`${name}.n`);
  },
};

/** Null when the app isn't pointed at a Supabase project, which means demo data. */
export const supabase: SupabaseClient | null =
  url && key
    ? createClient(url, key, {
        auth: {
          storage: chunkedSecureStore,
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: false,
        },
      })
    : null;

export const supabaseUrl = url;

// Only refresh tokens while the app is in the foreground, as Supabase recommends for React Native.
if (supabase) {
  AppState.addEventListener('change', (state) => {
    if (state === 'active') supabase.auth.startAutoRefresh();
    else supabase.auth.stopAutoRefresh();
  });
}
