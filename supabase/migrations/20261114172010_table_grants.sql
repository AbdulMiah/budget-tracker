-- Newer Supabase projects don't grant API roles access to tables created in SQL.
-- The edge function uses the secret key (service_role) for all reads and writes.
grant select, insert, update, delete on public.bank_sessions, public.pending_auths, public.accounts, public.transactions to service_role;

-- Signed-in users may read their own rows; RLS policies limit them to user_id = auth.uid().
grant select on public.bank_sessions, public.accounts, public.transactions to authenticated;
