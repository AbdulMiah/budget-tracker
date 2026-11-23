# Budget

Personal budget tracker for Barclays, Lloyds and Wise, built with Expo and React Native.

## Run it

```bash
npm install
npx expo start
```

Scan the QR code with Expo Go, or press `i` / `a` for a simulator. With no backend configured the app runs on built-in demo data.

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
| `GET /connect/:bank` | `{ "url": "..." }`, the consent page to open |

Shapes are in `src/constants/types.ts`. Amounts are signed pence; dates are `yyyy-MM-dd`. Each account has a `type` of `current` or `credit` (defaults to `current` if missing); a credit card's balance is negative when money is owed.

Point the app at it with a `.env` file:

```
EXPO_PUBLIC_API_URL=https://your-backend.example.com
```

Suggested sources for the backend:

- **Barclays and Lloyds**: an Open Banking aggregator such as TrueLayer or GoCardless Bank Account Data. Consent has to be renewed every 90 days.
- **Wise**: either the same aggregator or a Wise personal API token.

The backend must add its own authentication before it holds real data; `src/utils/api-client.ts` currently sends no credentials.

## Layout

```
src/app/        thin route files (Expo Router)
src/screens/    each screen and its own components
src/components/ shared UI
src/constants/  types, theme and app-wide constants
src/config/     environment variables
src/hooks/      hooks, including ones that read the providers
src/providers/  settings Context provider
src/services/   backend calls, demo data and TanStack Query hooks
src/utils/      categorisation, analytics, recurring detection, zakat, API client
```
