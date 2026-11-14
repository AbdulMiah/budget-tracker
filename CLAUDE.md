# Budget app: project context

A personal budgeting app (Expo / React Native, iOS-first) that brings Barclays, Lloyds and Wise accounts into one place. Built iteratively with Claude Code. This file records what exists and why, so future sessions don't have to rediscover it.

**Read `AGENTS.md` too.** It has the Expo rules for this repo: use `npx expo install` for packages, check versioned docs instead of memory, routes only in `src/app/`, and run lint + typecheck before calling anything done.

## Checks to run after every change

```bash
npx tsc --noEmit
npx expo lint
npx expo export --platform ios --output-dir <scratch dir>   # proves the bundle builds
```

There are no unit tests. Logic has been checked with throwaway `npx tsx` scripts that import from `src/lib` using absolute paths (relative imports of `date-fns` fail from outside the repo). Nothing has been tested on a real device or simulator by Claude; the user tests on their phone.

## Stack

- Expo SDK 58, React Native 0.88, React 19.3, TypeScript 6, Expo Router (routes in `src/app/`).
- State: zustand with `persist` to AsyncStorage (`src/store/useStore.ts`).
- Dates: date-fns 4. Charts: custom `react-native-svg` everywhere except the net worth line, which uses `react-native-gifted-charts` (that's why `expo-linear-gradient` is installed).
- Sensors and feedback: `expo-sensors` (DeviceMotion, for tilt to hide; iOS motion permission text is set in `app.json`) and `expo-haptics`.
- `expo-secure-store` is installed and in the `app.json` plugins but not used yet. It was meant for backend auth tokens.
- The React Compiler lint rules are on (`react-hooks/refs`, `react-hooks/immutability`): don't read `ref.current` during render, and don't reassign variables after render. Hold `Animated.Value`s in `useState(() => new Animated.Value(0))`, not `useRef(...).current`.
- RN 0.88 has no `StyleSheet.absoluteFillObject`; spell out `position: 'absolute', top: 0, ...`.

## Data conventions

- **Money is integer pence**, signed: negative is money out. Format only through `useMoney()` (`src/lib/useMoney.ts`), never `src/lib/format.ts` directly in UI, so hiding amounts works everywhere. The mask is `£***`.
- **Dates on transactions are `yyyy-MM-dd` strings.** Ranges (`DateRange`) are `Date`s at local midnight, inclusive at both ends.
- **The `Transfer` category is excluded** from income, spending, budgets and recurring detection. Moving money between your own accounts and paying off a credit card are not spending.
- Accounts are `current` or `credit`. A credit card's balance is negative when money is owed.
- **The budget month follows `budgetStartDay` (1–28)**, see `src/lib/budgetPeriod.ts`. With day 25, the "November" month is 25 Nov – 24 Dec. Month, quarter and year periods all follow the budget day; weeks run Monday to Sunday.
- **Nothing in the future:** pickers disable future dates and ranges are capped at today.

## Data sources

- `src/providers/`: a `BankProvider` interface with `mock.ts` (deterministic seeded demo data; IDs are built from content so they stay stable across reloads) and `remote.ts` (talks to a backend). `index.ts` picks remote when `EXPO_PUBLIC_API_URL` is set, otherwise mock (`usingDemoData`).
- Real bank access needs a server-side Open Banking aggregator (e.g. TrueLayer or GoCardless). Secrets never go in the app. The backend contract is in `README.md`. **No backend has been built yet.**

## Store (`src/store/useStore.ts`)

Persisted: `budgetStartDay`, `txnOverrides` and `merchantOverrides` (the user's category/icon edits), `tiltToHide`, `amountsHidden`, `analyticsChart`, `budgetLimit` (pence or null; null means budgeting is off) and `categoryBudgets`.
Not persisted: `accounts`, `rawTransactions`, `transactions` (with overrides applied), `loading` and `error`.
The `merge` step reapplies overrides on hydration, because a fetch can finish before storage loads.

## Screens

Routes live in `src/app/`. The root `_layout.tsx` is a Stack, and pushed pages get a native header with a back button and an `EyeButton`.

**Tabs** (`(tabs)/_layout.tsx`): Dashboard, Analytics, Budget, Settings.

- **Dashboard** (`(tabs)/index.tsx`):
  - Net worth hero, which opens `/net-worth`.
  - "This budget month" 2×2 grid of tappable `ChartColumn`s:
    - Income & spending, Spending trend and By category (top 5 in the legend) each open Analytics with that chart selected, by setting `analyticsChart` in the store before navigating.
    - Budget (mini ring and daily allowance) opens the Budget tab.
  - Recent transactions (5, See all → `/transactions`) and upcoming recurring spending (5, See all → `/recurring`; spending only, no income).
- **Analytics** (`(tabs)/analytics.tsx` → `components/SpendingSection.tsx`):
  - Top row: a period button (opens `PeriodSheet`), the account filter (`AccountFilterSheet`) and the chart type (`ChartTypeSheet`).
  - Charts: income vs spending (`TotalsChart`, with net above), spending over time (`SpendingTrendChart`, cumulative, current vs previous period lined up by day index) and spending by category (`CategoryPieChart`).
  - Below the chart: a category/merchant breakdown list.
  - The chart card is a `SwipeablePeriod`: swipe right for earlier and left for later, which never goes past the current period. `PeriodDots` (3 dots, with the right dot hidden on the latest period) sit outside the card and lean towards the swipe through a shared `drag` Animated.Value.
- **PeriodSheet**: chips for Weekly, Monthly, Quarterly, Yearly and Custom.
  - Each kind shows its picker inline: `DayCalendar` (week or range mode), `MonthGrid` (12 months with year arrows), `QuarterGrid` (2×2) or `YearGrid` (6 years per page).
  - The draft is applied on Apply and discarded on dismiss. The footer shows the selected range.
  - Logic lives in `src/lib/spendingPeriods.ts`: `resolvePeriod`, `stepSelection` (a custom range steps by its own length) and `dailySpending`.
- **Budget** (`(tabs)/budget.tsx`):
  - Donut of spent (red) and committed (amber, `t.committed`) against the limit, with what's left in the middle.
  - A daily allowance row and a line spelling out the formula.
  - Category budget bars, and a "Committed this month" list (tap through to the recurring details).
  - With no limit set, it shows an empty state that links to `/spending-limit`.
- **Settings** (`(tabs)/settings.tsx`):
  - BUDGET card with rows: Budget date → `/budget-date` (day grid); Spending limit → `/spending-limit` (limit, an Allocated % card with a segmented bar, and per-category `MoneyInput`s).
  - Privacy (the tilt to hide switch) and bank connections.
- **Pushed pages:**
  - `/net-worth`: `NetWorthCard` line chart (1W, 1M, 3M, 6M or YTD) plus Current accounts and Credit cards lists. Tapping an account opens `/transactions?account=<id>`.
  - `/transactions`: search, multi-select account sheet (with balances), multi-select Category and Merchant pickers (`PickerModal`), and a list grouped by day. Tapping a row opens `TransactionEditModal` (category, icon, "apply to all from this merchant").
  - `/recurring` (`recurring/index.tsx`): search, All, Spending and Income chips, a monthly summary, and a list grouped by the month each payment is next due.
  - `/recurring/[key]` (`recurring/[key].tsx`): details and history for one payment.

## Key logic

- **Recurring detection** (`src/lib/recurring.ts`):
  - Groups transactions by normalised merchant and direction. Outgoing keys are the plain merchant name and income keys start with `in:`, so older links still work.
  - A group counts as recurring when the median interval classifies as weekly, fortnightly, monthly or yearly, at least 70% of intervals fall within tolerance, and amounts stay within 25% of the median.
  - Payments more than a period overdue are treated as stopped.
  - Each result carries `direction`, `accountId` (from the latest charge), `history` (newest first) and `monthlyCost`.
- **Budget** (`src/lib/budget.ts`, `useBudgetStatus()` in `src/lib/useBudget.ts`):
  - spent = spending (no transfers) from the start of the budget month to today.
  - committed = recurring outgoing charges from today to the end of the month, one entry per occurrence. Weekly payments count every week; a charge already paid has moved its `nextDate` on, so it's never counted twice.
  - remaining = limit − spent − committed.
  - dailyAllowance = floor(remaining ÷ days left including today), or 0 when over.
- **Net worth over time** is rebuilt by walking backwards from current balances through the transactions (`src/lib/analytics.ts`).
- **Categorisation:** regex rules in `src/lib/categories.ts`. Remote data without a category is filled in the same way.
- **Hiding amounts:** the eye button (store `toggleAmountsHidden`, which also vibrates) or tilting the phone down. Each tilt toggles: it fires when the pitch drops below 20° after being above 35°, and starts unarmed so the phone lying flat at launch doesn't trigger it. Rotation is assumed to be in radians, which the Expo types don't state.

## Shared UI pieces

`BottomSheet` (transparent modal, renders children only while visible so draft state resets), `IconButton` (square, with a count badge; `AccountFilterButton` wraps it), `Chip`, `DonutRing` (segmented ring used by the budget and category charts), `MoneyInput` (pounds in, pence out, commits on end editing), `RecurringRow`, `TransactionRow`, `SectionHeader`, `EyeButton`.
Theme tokens live in `components/theme.ts` (light and dark): bg, card, text, muted, border, primary, income, spend, committed.

## Decisions and user preferences

- The user prefers compact, uncluttered screens: totals beside titles, settings split into sub-pages, and no "swipe to…" hint text (carousel dots instead).
- Charts have no axes or legends above the plot. Values sit under the bars or in keys.
- Lock page scrolling while dragging a chart (NetWorthCard uses `onScrubbingChange` and the page toggles `scrollEnabled`).
- Filters use draft state: changes apply on Apply or Done and are discarded on dismiss. Single-choice sheets (such as chart type) apply straight away.
- Amount fields in settings are not masked when amounts are hidden, so they can still be edited.
- The dashboard recurring preview shows spending only; income appears on the Recurring page.
- Period state on Analytics (the selected period and accounts) is not persisted. The chart type is.

## Not done yet / ideas raised

- The backend (e.g. Supabase edge functions with TrueLayer or GoCardless), auth, and storing tokens in `expo-secure-store`.
- Swiping on the Analytics card can still scroll the page slightly on fast diagonal swipes; a gesture library would fix that if it becomes a problem.
- Category budget overspend alerts and notifications have not been built.
