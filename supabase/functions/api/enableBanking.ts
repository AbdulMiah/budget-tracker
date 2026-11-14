// Minimal Enable Banking client: https://enablebanking.com/docs/api/reference/
import { importPKCS8, SignJWT } from 'jose';
import type { BankId, EbAccount, EbBalance, EbTransaction } from './mapping.ts';

const API = 'https://api.enablebanking.com';
const MAX_CONSENT_SECONDS = 90 * 24 * 60 * 60;

// The names Enable Banking lists these banks under in GB. Matched loosely, see findAspsp.
const ASPSP_NAMES: Record<BankId, string> = { barclays: 'Barclays', lloyds: 'Lloyds', wise: 'Wise' };

export class EnableBankingError extends Error {
  constructor(readonly status: number, body: string) {
    super(`Enable Banking ${status}: ${body.slice(0, 300)}`);
  }
}

let cached: { token: string; expires: number } | null = null;

async function token(): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  if (cached && cached.expires - 300 > now) return cached.token;
  const appId = Deno.env.get('EB_APPLICATION_ID');
  const pem = Deno.env.get('EB_PRIVATE_KEY')?.replace(/\\n/g, '\n');
  if (!appId || !pem) throw new Error('EB_APPLICATION_ID and EB_PRIVATE_KEY must be set');
  const key = await importPKCS8(pem, 'RS256');
  const expires = now + 3600;
  const jwt = await new SignJWT({})
    .setProtectedHeader({ alg: 'RS256', typ: 'JWT', kid: appId })
    .setIssuer('enablebanking.com')
    .setAudience('api.enablebanking.com')
    .setIssuedAt(now)
    .setExpirationTime(expires)
    .sign(key);
  cached = { token: jwt, expires };
  return jwt;
}

async function call<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${await token()}`, 'Content-Type': 'application/json' },
  });
  if (!res.ok) throw new EnableBankingError(res.status, await res.text());
  return res.json();
}

type Aspsp = { name: string; country: string; psu_types?: string[]; maximum_consent_validity?: number };

async function findAspsp(bank: BankId): Promise<Aspsp> {
  const { aspsps } = await call<{ aspsps: Aspsp[] }>('/aspsps?country=GB&psu_type=personal');
  const wanted = ASPSP_NAMES[bank].toLowerCase();
  const match =
    aspsps.find((a) => a.name.toLowerCase() === wanted) ??
    aspsps.find((a) => a.name.toLowerCase().startsWith(wanted));
  if (!match) throw new Error(`${ASPSP_NAMES[bank]} is not available on Enable Banking in GB`);
  return match;
}

/** Starts a consent and returns the bank's authorisation page. */
export async function startAuth(bank: BankId, state: string, redirectUrl: string): Promise<string> {
  const aspsp = await findAspsp(bank);
  const seconds = Math.min(MAX_CONSENT_SECONDS, aspsp.maximum_consent_validity ?? MAX_CONSENT_SECONDS);
  // A minute's margin so clock drift can't push it past the bank's maximum.
  const validUntil = new Date(Date.now() + (seconds - 60) * 1000).toISOString();
  const { url } = await call<{ url: string }>('/auth', {
    method: 'POST',
    body: JSON.stringify({
      access: { valid_until: validUntil },
      aspsp: { name: aspsp.name, country: aspsp.country },
      state,
      redirect_url: redirectUrl,
      psu_type: 'personal',
    }),
  });
  return url;
}

export type EbSession = {
  session_id: string;
  accounts: EbAccount[];
  access: { valid_until: string };
};

export function createSession(code: string): Promise<EbSession> {
  return call<EbSession>('/sessions', { method: 'POST', body: JSON.stringify({ code }) });
}

export async function balances(uid: string): Promise<EbBalance[]> {
  return (await call<{ balances: EbBalance[] }>(`/accounts/${encodeURIComponent(uid)}/balances`)).balances;
}

/** Booked transactions from `dateFrom` (yyyy-MM-dd, or the bank's default window when omitted), all pages. */
export async function transactions(uid: string, dateFrom?: string): Promise<EbTransaction[]> {
  const all: EbTransaction[] = [];
  let continuationKey: string | undefined;
  do {
    const params = new URLSearchParams({ transaction_status: 'BOOK' });
    if (dateFrom) params.set('date_from', dateFrom);
    if (continuationKey) params.set('continuation_key', continuationKey);
    const page = await call<{ transactions: EbTransaction[]; continuation_key?: string | null }>(
      `/accounts/${encodeURIComponent(uid)}/transactions?${params}`,
    );
    all.push(...page.transactions);
    continuationKey = page.continuation_key ?? undefined;
  } while (continuationKey);
  return all;
}
