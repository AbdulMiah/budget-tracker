# Budget

Personal budget tracker for Barclays, Lloyds and Wise, built with Expo and React Native.

## Run it

```bash
npm install
npx expo start
```

Scan the QR code with Expo Go, or press `i` / `a` for a simulator. With no backend configured the app runs on built-in demo data and skips sign-in.

## Screens

Tabs:

- **Dashboard**: net worth, this budget month's income and spending, recent transactions and upcoming recurring payments.
- **Analytics**: income vs spending, spending over time or spending by category for a chosen period (weekly, monthly, quarterly, yearly or custom) and accounts. Swipe the chart to move between periods.
- **Budget**: this budget month's spending and committed recurring payments against your limit, a daily allowance (limit − spent − committed, divided by the days left), category budgets, and what's still due.
- **Settings**: budget start day (1–28), monthly spending limit and category split, tilt to hide amounts, and bank connections.

Pages opened from the dashboard:

- **Net worth**: net worth line chart over 1W / 1M / 3M / 6M / YTD, with current accounts and credit cards.
- **Transactions**: every account in one list, with filters for account, category and merchant, plus search.
- **Recurring payments**: subscriptions, bills and regular income (such as salary) detected from transaction history, grouped by the month they're next due, with search and an All / Spending / Income filter. Tap one for its details and payment history.

## Connecting real bank accounts

A mobile app cannot talk to Barclays or Lloyds directly. UK banks only expose data through Open Banking, which requires an FCA-regulated provider and a client secret that must stay on a server. The app therefore expects a small backend of your own:

| Endpoint | Returns |
| --- | --- |
| `GET /accounts` | `Account[]` |
| `GET /transactions` | `Transaction[]` (`category` optional; the app fills it in) |
| `GET /connect/:bank?redirect=<app url>` | `{ "url": "..." }`, the consent page to open. Afterwards the browser is sent to `redirect` with `?bank=…&connected=1` or `&error=…` |

Shapes are in `src/lib/types.ts`. Amounts are signed pence; dates are `yyyy-MM-dd`. Each account has a `type` of `current` or `credit` (defaults to `current` if missing); a credit card's balance is negative when money is owed.

Point the app at your Supabase project with a `.env` file (both values are on the project's API settings page and are safe to ship in the app):

```
EXPO_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

The app then asks you to sign in (email and password) and calls the `api` edge function at `<project URL>/functions/v1/api`. Set `EXPO_PUBLIC_API_URL` only to use a different backend.

Planned backend:

- **Hosting**: Supabase (edge functions, Postgres and auth). The free plan is enough for personal use; it pauses after a week without requests, which a daily sync job avoids. Pro is $25/month if needed.
- **Bank data**: [Enable Banking](https://enablebanking.com) in its free restricted mode, which reads only accounts you have linked yourself in its control panel. No contract is needed, and banks allow roughly 4 background refreshes a day. Consent has to be renewed every 90 days. Check that Barclays, Lloyds and Wise are on its bank list before relying on it.
- **Wise fallback**: if Enable Banking doesn't cover Wise, import a CSV statement. A Wise personal API token can't read balance statements for UK accounts.

Ruled out: GoCardless Bank Account Data closed to new signups in July 2025, and TrueLayer production access needs a registered business and a sales contract.

Every request carries the signed-in Supabase user's access token (`Authorization: Bearer ...`).

## Backend (`supabase/`)

One edge function, `api`, serves the endpoints above plus `GET /callback` (where Enable Banking returns after consent) and `POST /sync` (the scheduled refresh). Data is stored in Postgres and read from there; the app never talks to Enable Banking.

```
supabase/migrations/          tables (bank_sessions, pending_auths, accounts, transactions) and the sync schedule
supabase/functions/api/       index.ts (routes), enableBanking.ts (API client), sync.ts, mapping.ts
```

Setup, once:

1. Create a Supabase project and install the [Supabase CLI](https://supabase.com/docs/guides/local-development). Run `supabase link`, then `supabase db push`.
2. In the [Enable Banking control panel](https://enablebanking.com), register a production application with redirect URL `https://<project-ref>.supabase.co/functions/v1/api/callback`, keep the private key it gives you, and link your own accounts to activate restricted mode.
3. Copy `supabase/functions/.env.example` to `supabase/functions/.env`, fill it in, then `supabase secrets set --env-file supabase/functions/.env`.
4. `supabase functions deploy api`.
5. In the SQL editor, add the two Vault secrets the sync schedule reads (see `supabase/migrations/20261114160509_sync_schedule.sql`).
6. Add the `.env` above, start the app and create your account from the sign-in screen. Then, in Authentication → Sign In / Providers, turn off "Allow new users to sign up" so nobody else can.

Typecheck the function with `npx deno@2 check supabase/functions/api/index.ts`.

## Layout

```
src/app/        screens (Expo Router)
src/components/ shared UI
src/lib/        types, categorisation, analytics, recurring detection
src/providers/  demo data and the backend client
src/store/      Zustand store
```
