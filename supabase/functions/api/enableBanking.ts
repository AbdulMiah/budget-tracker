// Minimal Enable Banking client: https://enablebanking.com/docs/api/reference/
import { createPrivateKey } from 'node:crypto';
import { importPKCS8, SignJWT } from 'jose';
import type { BankId, EbAccount, EbBalance, EbTransaction } from './mapping.ts';

const API = 'https://api.enablebanking.com';
const MAX_CONSENT_SECONDS = 90 * 24 * 60 * 60;

type AspspRef = { name: string; country: string };

// The names Enable Banking lists these banks under. Matched loosely, see findAspsp. The optional
// EB_ASPSP_NAMES secret overrides them, for sandbox test banks (the sandbox has no GB banks). It is JSON whose
// values are a GB name or a name and country, e.g. {"barclays":{"name":"Mock ASPSP","country":"FI"}}.
const ASPSPS: Record<BankId, AspspRef> = {
  barclays: { name: 'Barclays', country: 'GB' },
  lloyds: { name: 'Lloyds', country: 'GB' },
  wise: { name: 'Wise', country: 'GB' },
  ...Object.fromEntries(
    Object.entries(JSON.parse(Deno.env.get('EB_ASPSP_NAMES') || '{}') as Record<string, string | AspspRef>).map(
      ([bank, ref]) => [bank, typeof ref === 'string' ? { name: ref, country: 'GB' } : ref],
    ),
  ),
};

export class EnableBankingError extends Error {
  constructor(readonly status: number, body: string) {
    super(`Enable Banking ${status}: ${body.slice(0, 300)}`);
  }
}

let cached: { token: string; expires: number } | null = null;

async function token(): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  if (cached && cached.expires - 300 > now) return cached.token;
  const appId = Deno.env.get('EB_APPLICATION_ID')?.trim();
  const raw = Deno.env.get('EB_PRIVATE_KEY');
  if (!appId || !raw) throw new Error('EB_APPLICATION_ID and EB_PRIVATE_KEY must be set');
  const key = await importPKCS8(toPkcs8Pem(raw), 'RS256');
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

/**
 * The key secret is pasted by hand, so accept the shapes that paste can produce: surrounding quotes, literal
 * "\n"s, line breaks collapsed to spaces, and the older PKCS#1 "RSA PRIVATE KEY" format. Errors name the
 * problem without echoing any of the key.
 */
export function toPkcs8Pem(raw: string): string {
  const text = raw.trim().replace(/^["']|["']$/g, '').replace(/\\r/g, '').replace(/\\n/g, '\n');
  const match = text.match(/-----BEGIN ([A-Z ]+)-----([\s\S]*?)-----END \1-----/);
  if (!match) throw new Error('EB_PRIVATE_KEY is not a PEM key: it needs the -----BEGIN … KEY----- and -----END … KEY----- lines');
  const [, label, body] = match;
  if (label !== 'PRIVATE KEY' && label !== 'RSA PRIVATE KEY') {
    throw new Error(`EB_PRIVATE_KEY holds a "${label}", not an unencrypted private key`);
  }
  const lines = body.replace(/\s+/g, '').match(/.{1,64}/g) ?? [];
  const pem = `-----BEGIN ${label}-----\n${lines.join('\n')}\n-----END ${label}-----\n`;
  try {
    return createPrivateKey(pem).export({ type: 'pkcs8', format: 'pem' }) as string;
  } catch {
    throw new Error('EB_PRIVATE_KEY could not be read as an RSA private key; paste the whole .pem file again');
  }
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
  const { name, country } = ASPSPS[bank];
  const { aspsps } = await call<{ aspsps: Aspsp[] }>(`/aspsps?country=${country}&psu_type=personal`);
  const wanted = name.toLowerCase();
  const match =
    aspsps.find((a) => a.name.toLowerCase() === wanted) ??
    aspsps.find((a) => a.name.toLowerCase().startsWith(wanted));
  if (!match) {
    // The list is public bank names, so logging it is safe; it's what to put in EB_ASPSP_NAMES. Unfiltered,
    // since the country's list can be empty (the sandbox has no GB banks).
    const all = (await call<{ aspsps: Aspsp[] }>('/aspsps')).aspsps;
    console.log(
      `No ${country} ASPSP matches "${name}". ${all.length} available in all countries:`,
      all.map((a) => `${a.name} (${a.country})`).join(' | '),
    );
    throw new Error(`${name} is not available on Enable Banking in ${country}`);
  }
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
