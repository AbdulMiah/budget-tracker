// The app's backend. Implements the contract in README.md:
//   GET  /accounts        Account[]
//   GET  /transactions    Transaction[] (no category; the app fills it in)
//   GET  /connect/:bank   { url } consent page to open
// plus two routes that arrive without a user JWT:
//   GET  /callback        Enable Banking redirects here after consent
//   POST /sync            cron job, authorised by the x-cron-secret header
import { createClient } from '@supabase/supabase-js';
import * as eb from './enableBanking.ts';
import { BANKS, type BankId } from './mapping.ts';
import { check, saveSession, syncAll, syncSession } from './sync.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SECRET_KEY =
  JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS') ?? '{}').default ?? Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const CALLBACK_URL = `${SUPABASE_URL}/functions/v1/api/callback`;
const APP_REDIRECT_URL = Deno.env.get('APP_REDIRECT_URL') ?? 'budgetapp://settings';
const PENDING_AUTH_MAX_AGE_MS = 30 * 60 * 1000;
const PAGE_SIZE = 1000; // PostgREST's default row cap

// Bypasses RLS, so every query below filters by user_id itself.
const db = createClient(SUPABASE_URL, SECRET_KEY, { auth: { persistSession: false } });

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const path = url.pathname.replace(/^(\/functions\/v1)?\/api/, '') || '/';
  try {
    if (req.method === 'GET' && path === '/callback') return await callback(url);
    if (req.method === 'POST' && path === '/sync') return await cronSync(req);

    const userId = await authenticate(req);
    if (!userId) return json({ error: 'Unauthorized' }, 401);

    if (req.method === 'GET' && path === '/accounts') return json(await listAccounts(userId));
    if (req.method === 'GET' && path === '/transactions') return json(await listTransactions(userId));
    const connect = path.match(/^\/connect\/([a-z]+)$/);
    if (req.method === 'GET' && connect) return await startConnect(userId, connect[1]);
    return json({ error: 'Not found' }, 404);
  } catch (e) {
    console.error(e);
    return json({ error: 'Internal error' }, 500);
  }
});

async function authenticate(req: Request): Promise<string | null> {
  const token = req.headers.get('Authorization')?.replace(/^Bearer /, '');
  if (!token) return null;
  const { data, error } = await db.auth.getUser(token);
  return error ? null : (data.user?.id ?? null);
}

async function listAccounts(userId: string) {
  const rows = await check<{ id: string; bank: string; type: string; name: string; currency: string; balance: number }[]>(
    db.from('accounts').select('id, bank, type, name, currency, balance').eq('user_id', userId).order('name'),
  );
  return rows;
}

async function listTransactions(userId: string) {
  const all = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const page = await check<
      { id: string; account_id: string; date: string; amount: number; merchant: string; description: string | null }[]
    >(
      db
        .from('transactions')
        .select('id, account_id, date, amount, merchant, description')
        .eq('user_id', userId)
        .order('date', { ascending: false })
        .order('id')
        .range(from, from + PAGE_SIZE - 1),
    );
    all.push(
      ...page.map((t) => ({
        id: t.id,
        accountId: t.account_id,
        date: t.date,
        amount: t.amount,
        merchant: t.merchant,
        ...(t.description ? { description: t.description } : {}),
      })),
    );
    if (page.length < PAGE_SIZE) return all;
  }
}

async function startConnect(userId: string, bank: string) {
  if (!BANKS.includes(bank as BankId)) return json({ error: `Unknown bank: ${bank}` }, 400);
  const [pending] = await check<{ state: string }[]>(
    db.from('pending_auths').insert({ user_id: userId, bank }).select('state'),
  );
  return json({ url: await eb.startAuth(bank as BankId, pending.state, CALLBACK_URL) });
}

async function callback(url: URL) {
  const state = url.searchParams.get('state') ?? '';
  if (!/^[0-9a-f-]{36}$/i.test(state)) return page('This link is not valid.', 400);

  // Deleting as we read means each consent link can only be used once.
  const [pending] = await check<{ user_id: string; bank: BankId; created_at: string }[]>(
    db.from('pending_auths').delete().eq('state', state).select('user_id, bank, created_at'),
  );
  if (!pending || Date.now() - Date.parse(pending.created_at) > PENDING_AUTH_MAX_AGE_MS) {
    return page('This link has expired. Start again from the app.', 400);
  }

  const code = url.searchParams.get('code');
  if (!code) return backToApp({ bank: pending.bank, error: url.searchParams.get('error') ?? 'cancelled' });

  const session = await eb.createSession(code);
  await saveSession(db, pending.user_id, pending.bank, session);
  try {
    await syncSession(db, session.session_id);
  } catch (e) {
    // The consent is saved, so the next scheduled sync can still pick the data up.
    console.error('Initial sync failed:', e);
  }
  return backToApp({ bank: pending.bank, connected: '1' });
}

async function cronSync(req: Request) {
  const secret = Deno.env.get('CRON_SECRET');
  if (!secret || req.headers.get('x-cron-secret') !== secret) return json({ error: 'Unauthorized' }, 401);
  return json(await syncAll(db));
}

function backToApp(params: Record<string, string>) {
  const target = `${APP_REDIRECT_URL}?${new URLSearchParams(params)}`;
  return new Response(null, { status: 302, headers: { Location: target } });
}

function page(message: string, status: number) {
  return new Response(`<!doctype html><meta name="viewport" content="width=device-width"><p>${message}</p>`, {
    status,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}
