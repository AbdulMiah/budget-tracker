// Pure conversions from Enable Banking shapes to the app's. No Deno APIs here,
// so this file can be checked with Node too.

export type BankId = 'barclays' | 'lloyds' | 'wise';
export const BANKS: BankId[] = ['barclays', 'lloyds', 'wise'];

export type EbAmount = { amount: string; currency: string };

export type EbAccount = {
  uid: string;
  identification_hash?: string;
  name?: string;
  product?: string;
  details?: string;
  cash_account_type?: string;
  currency?: string;
};

export type EbBalance = {
  balance_type: string;
  balance_amount: EbAmount;
};

export type EbTransaction = {
  transaction_id?: string | null;
  entry_reference?: string | null;
  transaction_amount: EbAmount;
  credit_debit_indicator: 'CRDT' | 'DBIT';
  booking_date?: string | null;
  value_date?: string | null;
  transaction_date?: string | null;
  creditor?: { name?: string | null } | null;
  debtor?: { name?: string | null } | null;
  remittance_information?: string[] | null;
};

export type AccountType = 'current' | 'credit';

/** "12.3" → 1230, "-0.05" → -5. Parses the string rather than going through floats. */
export function toPence(amount: string): number {
  const s = amount.trim();
  const negative = s.startsWith('-');
  const [whole, frac = ''] = s.replace(/^[-+]/, '').split('.');
  const pence = Number(whole || '0') * 100 + Number((frac + '00').slice(0, 2));
  if (!Number.isFinite(pence)) throw new Error(`Bad amount: ${amount}`);
  return negative ? -pence : pence;
}

export function accountType(acc: EbAccount): AccountType {
  return acc.cash_account_type === 'CARD' ? 'credit' : 'current';
}

export function accountName(acc: EbAccount, bank: BankId): string {
  const name = acc.name?.trim() || acc.product?.trim() || acc.details?.trim();
  return name || `${bank[0].toUpperCase()}${bank.slice(1)} account`;
}

// Booked balances first: they match what the bank's own app shows as "balance".
const BALANCE_PREFERENCE = ['ITBD', 'CLBD', 'ITAV', 'CLAV', 'XPCD', 'OTHR', 'INFO'];

/**
 * Balance in pence. Card balances are reported as an amount owed with no sign we
 * can rely on, so they're stored as negative. TODO: check against a real card.
 */
export function pickBalance(balances: EbBalance[], type: AccountType): number | null {
  const ranked = [...balances].sort(
    (a, b) => rank(a.balance_type) - rank(b.balance_type),
  );
  const best = ranked[0];
  if (!best) return null;
  const pence = toPence(best.balance_amount.amount);
  return type === 'credit' ? -Math.abs(pence) : pence;
}

function rank(type: string) {
  const i = BALANCE_PREFERENCE.indexOf(type);
  return i === -1 ? BALANCE_PREFERENCE.length : i;
}

export type TransactionRow = {
  id: string;
  account_id: string;
  user_id: string;
  date: string;
  amount: number;
  merchant: string;
  description: string | null;
};

export async function sha256(text: string): Promise<string> {
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(bytes), (b) => b.toString(16).padStart(2, '0')).join('');
}

export async function accountId(userId: string, acc: EbAccount): Promise<string> {
  return (await sha256(`${userId}|${acc.identification_hash ?? acc.uid}`)).slice(0, 32);
}

export async function toTransactionRows(
  accountId: string,
  userId: string,
  txns: EbTransaction[],
): Promise<TransactionRow[]> {
  const rows: TransactionRow[] = [];
  // Counts identical fallback keys so two same-day, same-amount payments stay separate.
  const seen = new Map<string, number>();
  for (const t of txns) {
    const date = t.booking_date ?? t.value_date ?? t.transaction_date;
    if (!date) continue;
    const magnitude = Math.abs(toPence(t.transaction_amount.amount));
    const amount = t.credit_debit_indicator === 'DBIT' ? -magnitude : magnitude;
    const remittance = (t.remittance_information ?? []).map((s) => s.trim()).filter(Boolean);
    const counterparty = t.credit_debit_indicator === 'DBIT' ? t.creditor?.name : t.debtor?.name;
    const merchant = counterparty?.trim() || remittance[0] || 'Unknown';
    const description = remittance.join(' ') || null;

    let bankId = t.transaction_id || t.entry_reference;
    if (!bankId) {
      const key = `${date}|${amount}|${merchant}|${description ?? ''}`;
      const n = seen.get(key) ?? 0;
      seen.set(key, n + 1);
      bankId = `${key}|${n}`;
    }
    rows.push({
      id: (await sha256(`${accountId}|${bankId}`)).slice(0, 32),
      account_id: accountId,
      user_id: userId,
      date,
      amount,
      merchant,
      description,
    });
  }
  return rows;
}
