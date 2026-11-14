import { supabase, supabaseUrl } from '../lib/supabase';
import { mockProvider } from './mock';
import { createRemoteProvider } from './remote';
import { BankProvider } from './types';

// The Supabase edge function, unless EXPO_PUBLIC_API_URL points somewhere else.
const apiUrl = process.env.EXPO_PUBLIC_API_URL ?? (supabaseUrl ? `${supabaseUrl}/functions/v1/api` : undefined);

const accessToken = async () => (await supabase?.auth.getSession())?.data.session?.access_token ?? null;

/** Real backend when Supabase (or EXPO_PUBLIC_API_URL) is configured, otherwise demo data. */
export const provider: BankProvider = apiUrl ? createRemoteProvider(apiUrl, accessToken) : mockProvider;
export const usingDemoData = !apiUrl;
