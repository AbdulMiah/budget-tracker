-- Where the callback sends the browser back to: the app's own URL (exp:// in Expo Go, budgetapp:// in a build).
alter table public.pending_auths add column redirect_url text;
