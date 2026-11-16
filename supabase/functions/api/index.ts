// The app's backend. Implements the contract in README.md:
//   GET  /accounts        Account[]
//   GET  /transactions    Transaction[] (no category; the app fills it in)
//   GET  /connect/:bank   { url } consent page to open (?redirect=<app url> to return to afterwards)
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
// The app passes its own return address (exp:// in Expo Go, budgetapp:// in a build). Only app schemes are
// accepted, so the callback can't be used to bounce a browser to an arbitrary website.
const APP_SCHEMES = ['budgetapp:', 'exp:', 'exps:'];
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
    if (req.method === 'GET' && connect) return await startConnect(userId, connect[1], url.searchParams.get('redirect'));
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

async function startConnect(userId: string, bank: string, redirect: string | null) {
  if (!BANKS.includes(bank as BankId)) return json({ error: `Unknown bank: ${bank}` }, 400);
  if (redirect && !isAppUrl(redirect)) return json({ error: 'Invalid redirect' }, 400);
  const [pending] = await check<{ state: string }[]>(
    db.from('pending_auths').insert({ user_id: userId, bank, redirect_url: redirect }).select('state'),
  );
  try {
    return json({ url: await eb.startAuth(bank as BankId, pending.state, CALLBACK_URL) });
  } catch (e) {
    // e.g. the bank isn't on Enable Banking, or the app credentials are wrong. Shown in the app's alert.
    console.error('startAuth failed:', e);
    return json({ error: e instanceof Error ? e.message : 'Could not start the bank connection' }, 502);
  }
}

function isAppUrl(value: string) {
  try {
    return APP_SCHEMES.includes(new URL(value).protocol);
  } catch {
    return false;
  }
}

async function callback(url: URL) {
  const state = url.searchParams.get('state') ?? '';
  if (!/^[0-9a-f-]{36}$/i.test(state)) return page('This link is not valid.', 400);

  // Deleting as we read means each consent link can only be used once.
  const [pending] = await check<{ user_id: string; bank: BankId; created_at: string; redirect_url: string | null }[]>(
    db.from('pending_auths').delete().eq('state', state).select('user_id, bank, created_at, redirect_url'),
  );
  if (!pending || Date.now() - Date.parse(pending.created_at) > PENDING_AUTH_MAX_AGE_MS) {
    return page('This link has expired. Start again from the app.', 400);
  }
  const back = (params: Record<string, string>) =>
    backToApp(pending.redirect_url ?? APP_REDIRECT_URL, { bank: pending.bank, ...params });

  const code = url.searchParams.get('code');
  if (!code) return back({ error: url.searchParams.get('error') ?? 'cancelled' });

  try {
    const session = await eb.createSession(code);
    await saveSession(db, pending.user_id, pending.bank, session);
    try {
      await syncSession(db, session.session_id);
    } catch (e) {
      // The consent is saved, so the next scheduled sync can still pick the data up.
      console.error('Initial sync failed:', e);
    }
  } catch (e) {
    // Return to the app either way, so the in-app browser closes instead of showing an error page.
    console.error('Saving the consent failed:', e);
    return back({ error: 'server_error' });
  }
  return back({ connected: '1' });
}

async function cronSync(req: Request) {
  const secret = Deno.env.get('CRON_SECRET');
  if (!secret || req.headers.get('x-cron-secret') !== secret) return json({ error: 'Unauthorized' }, 401);
  return json(await syncAll(db));
}

function backToApp(redirect: string, params: Record<string, string>) {
  const target = new URL(redirect);
  for (const [key, value] of Object.entries(params)) target.searchParams.set(key, value);
  return new Response(null, { status: 302, headers: { Location: target.toString() } });
}

// Plain text: Supabase serves edge function HTML as text/plain on the default domain, so markup would show raw.
function page(message: string, status: number) {
  return new Response(message, { status, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}
