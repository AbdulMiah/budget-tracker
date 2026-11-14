-- Bank data synced from Enable Banking. The `api` edge function writes everything
-- with the secret key; RLS only lets signed-in users read their own rows.

-- One Enable Banking session per bank consent. Renewed (replaced) every 90 days.
create table public.bank_sessions (
  id text primary key, -- Enable Banking session_id
  user_id uuid not null references auth.users on delete cascade,
  bank text not null check (bank in ('barclays', 'lloyds', 'wise')),
  valid_until timestamptz not null,
  created_at timestamptz not null default now()
);

-- Consent flows that have been started but not finished. `state` round-trips
-- through the bank so the callback knows whose consent it is.
create table public.pending_auths (
  state uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  bank text not null check (bank in ('barclays', 'lloyds', 'wise')),
  created_at timestamptz not null default now()
);

create table public.accounts (
  -- Hash of the user and Enable Banking's identification_hash, so it survives reconnecting.
  id text primary key,
  user_id uuid not null references auth.users on delete cascade,
  -- Current session and its account uid, used for API calls. Null once the consent is replaced or removed.
  session_id text references public.bank_sessions on delete set null,
  uid text,
  bank text not null check (bank in ('barclays', 'lloyds', 'wise')),
  type text not null check (type in ('current', 'credit')),
  name text not null,
  currency text not null,
  balance bigint not null default 0, -- pence; negative on a credit card means owed
  synced_at timestamptz
);

create index accounts_user_id_idx on public.accounts (user_id);
create index accounts_session_id_idx on public.accounts (session_id);

create table public.transactions (
  id text primary key, -- hash of the account id and the bank's transaction id
  account_id text not null references public.accounts on delete cascade,
  user_id uuid not null references auth.users on delete cascade,
  date date not null,
  amount bigint not null, -- signed pence: negative is money out
  merchant text not null,
  description text
);

create index transactions_user_date_idx on public.transactions (user_id, date desc);
create index transactions_account_date_idx on public.transactions (account_id, date desc);

alter table public.bank_sessions enable row level security;
alter table public.pending_auths enable row level security;
alter table public.accounts enable row level security;
alter table public.transactions enable row level security;

create policy "Users read their own bank sessions" on public.bank_sessions
  for select to authenticated using ((select auth.uid()) = user_id);

create policy "Users read their own accounts" on public.accounts
  for select to authenticated using ((select auth.uid()) = user_id);

create policy "Users read their own transactions" on public.transactions
  for select to authenticated using ((select auth.uid()) = user_id);

-- pending_auths has no policies: only the edge function touches it.
