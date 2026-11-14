import type { SupabaseClient } from '@supabase/supabase-js';
import * as eb from './enableBanking.ts';
import {
  accountId,
  accountName,
  accountType,
  type AccountType,
  type BankId,
  pickBalance,
  toTransactionRows,
} from './mapping.ts';

const DAY = 24 * 60 * 60 * 1000;
// Re-fetch a little before the newest stored transaction to catch late-booked ones.
const OVERLAP_DAYS = 10;
// On the first sync, ask for this much history. UK banks only give more than 90 days
// in the few minutes after consent, which is why the callback syncs straight away.
const FIRST_SYNC_DAYS = 730;
const CHUNK = 500;

type AccountRow = { id: string; uid: string; user_id: string; type: AccountType };

const isoDate = (ms: number) => new Date(ms).toISOString().slice(0, 10);

/** Stores a new consent and its accounts, replacing any older consent for the same bank. */
export async function saveSession(db: SupabaseClient, userId: string, bank: BankId, session: eb.EbSession) {
  await check(db.from('bank_sessions').delete().eq('user_id', userId).eq('bank', bank));
  await check(
    db.from('bank_sessions').insert({
      id: session.session_id,
      user_id: userId,
      bank,
      valid_until: session.access.valid_until,
    }),
  );
  // The app only handles GBP for now, so other currency pots (e.g. Wise EUR) are skipped.
  const gbp = session.accounts.filter((a) => (a.currency ?? 'GBP') === 'GBP');
  const rows = await Promise.all(
    gbp.map(async (a) => ({
      id: await accountId(userId, a),
      user_id: userId,
      session_id: session.session_id,
      uid: a.uid,
      bank,
      type: accountType(a),
      name: accountName(a, bank),
      currency: 'GBP',
    })),
  );
  if (rows.length) await check(db.from('accounts').upsert(rows));
}

/** Syncs every account on a session. Used right after consent. */
export async function syncSession(db: SupabaseClient, sessionId: string) {
  const accounts = await check<AccountRow[]>(
    db.from('accounts').select('id, uid, user_id, type').eq('session_id', sessionId),
  );
  await syncAccounts(db, accounts);
}

/** Syncs every account with a consent that hasn't expired. Used by the cron job. */
export async function syncAll(db: SupabaseClient) {
  const sessions = await check<{ id: string }[]>(
    db.from('bank_sessions').select('id').gt('valid_until', new Date().toISOString()),
  );
  if (!sessions.length) return { accounts: 0, failed: 0 };
  const accounts = await check<AccountRow[]>(
    db.from('accounts').select('id, uid, user_id, type').in('session_id', sessions.map((s) => s.id)),
  );
  return syncAccounts(db, accounts);
}

async function syncAccounts(db: SupabaseClient, accounts: AccountRow[]) {
  let failed = 0;
  // One account failing (bank down, consent revoked) shouldn't stop the rest.
  for (const account of accounts) {
    try {
      await syncAccount(db, account);
    } catch (e) {
      failed++;
      console.error(`Sync failed for account ${account.id}:`, e);
    }
  }
  return { accounts: accounts.length, failed };
}

async function syncAccount(db: SupabaseClient, account: AccountRow) {
  const balance = pickBalance(await eb.balances(account.uid), account.type);

  const latest = await check<{ date: string }[]>(
    db.from('transactions').select('date').eq('account_id', account.id).order('date', { ascending: false }).limit(1),
  );
  let raw;
  if (latest.length) {
    raw = await eb.transactions(account.uid, isoDate(Date.parse(latest[0].date) - OVERLAP_DAYS * DAY));
  } else {
    try {
      raw = await eb.transactions(account.uid, isoDate(Date.now() - FIRST_SYNC_DAYS * DAY));
    } catch (e) {
      // Some banks reject a start date beyond what they hold; fall back to their default window.
      if (!(e instanceof eb.EnableBankingError) || e.status >= 500) throw e;
      raw = await eb.transactions(account.uid);
    }
  }

  const rows = await toTransactionRows(account.id, account.user_id, raw);
  for (let i = 0; i < rows.length; i += CHUNK) {
    await check(db.from('transactions').upsert(rows.slice(i, i + CHUNK)));
  }
  await check(
    db
      .from('accounts')
      .update({ ...(balance === null ? {} : { balance }), synced_at: new Date().toISOString() })
      .eq('id', account.id),
  );
}

/** Awaits a Supabase query and throws on error, returning its data. */
export async function check<T = unknown>(
  query: PromiseLike<{ data: unknown; error: { message: string } | null }>,
): Promise<T> {
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data as T;
}
