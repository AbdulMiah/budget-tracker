# Budget app: project context

A personal budgeting app (Expo / React Native, iOS-first) that brings Barclays, Lloyds and Wise accounts into one place. Built iteratively with Claude Code. This file records what exists and why, so future sessions don't have to rediscover it.

**Read `AGENTS.md` too.** It has the Expo rules for this repo: use `npx expo install` for packages, check versioned docs instead of memory, routes only in `src/app/`, and run lint + typecheck before calling anything done.

## Checks to run after every change

```bash
npx tsc --noEmit
npx expo lint
npx expo export --platform ios --output-dir <scratch dir>   # proves the bundle builds
```

There are no unit tests. Logic has been checked with throwaway `npx tsx` scripts that import from `src/utils` using absolute paths (relative imports of `date-fns` fail from outside the repo). Nothing has been tested on a real device or simulator by Claude; the user tests on their phone.

## Stack

- Expo SDK 58, React Native 0.88, React 19.3, TypeScript 6, Expo Router (routes in `src/app/`).
- State: TanStack Query v5 for server data and a React Context provider for settings (see Code structure). No zustand.
- Dates: date-fns 4. Charts: custom `react-native-svg` everywhere except the net worth line, which uses `react-native-gifted-charts` (that's why `expo-linear-gradient` is installed).
- Sensors and feedback: `expo-sensors` (DeviceMotion, for tilt to hide; iOS motion permission text is set in `app.json`) and `expo-haptics`.
- `expo-secure-store` is installed and in the `app.json` plugins but not used yet. It was meant for backend auth tokens.
- The React Compiler lint rules are on (`react-hooks/refs`, `react-hooks/immutability`): don't read `ref.current` during render, and don't reassign variables after render. Hold `Animated.Value`s in `useState(() => new Animated.Value(0))`, not `useRef(...).current`.
- RN 0.88 has no `StyleSheet.absoluteFillObject`; spell out `position: 'absolute', top: 0, ...`.

## Data conventions

- **Money is integer pence**, signed: negative is money out. Format only through `useMoney()` (`src/hooks/useMoney.ts`), never `src/utils/format.ts` directly in UI, so hiding amounts works everywhere. The mask is `£***` (`AMOUNT_MASK`).
- **Dates on transactions are `yyyy-MM-dd` strings.** Ranges (`DateRange`) are `Date`s at local midnight, inclusive at both ends.
- **The `Transfer` category is excluded** from income, spending, budgets and recurring detection. Moving money between your own accounts and paying off a credit card are not spending.
- **The `Zakat` category is excluded from the budget** (spent, committed and category allocations via `SPENDING_CATEGORIES`) but still counts as spending on Analytics. It's a yearly obligation tracked on the Zakat tab.
- Accounts are `current` or `credit`. A credit card's balance is negative when money is owed.
- **The budget month follows `budgetStartDay` (1–28)**, see `src/utils/budget-period.ts`. With day 25, the "November" month is 25 Nov – 24 Dec. Month, quarter and year periods all follow the budget day; weeks run Monday to Sunday.
- **Nothing in the future:** pickers disable future dates and ranges are capped at today.

## Data sources

- `src/services/`: `accounts.service.ts`, `transactions.service.ts` and `banks.service.ts` call the backend at `EXPO_PUBLIC_API_URL` (read in `config/env.ts`) through `utils/api-client.ts` (`apiGet`, `ApiError`). With no URL set, `IS_DEMO` is true and the services return `demo-data.ts` (deterministic seeded demo data; IDs are built from content so they stay stable across reloads). Connecting a bank opens the backend's consent URL with `Linking.openURL` and refetches.
- Real bank access needs a server-side Open Banking aggregator (e.g. TrueLayer or GoCardless). Secrets never go in the app. The backend contract is in `README.md`. **No backend has been built yet.**

## Code structure (follows gms-platform's pos-app)

- `src/app/` holds thin route files only: each renders a screen from `src/screens/<feature>/index.tsx` (or another file there, such as `settings/BudgetDate.tsx`). Route URLs are unchanged.
- Screen-only components live in `src/screens/<feature>/components/`. Shared ones stay in `src/components/`. One component per file, styles in `StyleSheet.create` (only theme colours inline).
- `src/constants/`: `index.ts` (SPACING, RADIUS, WHITE, bank/category colours and names, CHART_TYPE_OPTIONS, FREQUENCY_LABELS, DEFAULT_SETTINGS...), `types.ts` (interfaces) and `theme.ts` (LIGHT_THEME/DARK_THEME; read with `useTheme()` from `src/hooks/useTheme.ts`).
- `src/services/<x>.service.ts` exports an `xApi` object; `<x>.queries.ts` holds the query key factory and `useQuery`/`useMutation` hooks.
- `src/providers/` holds Context providers rendered as `<Context value>`; `src/hooks/useX.ts` reads each with `use()` and throws outside its provider.
- `src/utils/` holds pure logic plus `api-client`, `query-client` (retry 2, 5-minute staleTime, refetch on foreground via `focusManager`), `helpers` and `overrides`.
- Imports: `@/` alias, third-party first, a blank line, then `@/` imports. Formatted with Prettier defaults plus `--trailing-comma es5` (`npx prettier@3 --trailing-comma es5 --write src`; not a dependency).

## State

**Settings** (`SettingsProvider`, read with `useSettings()` → `{ settings, update }`; `update` takes a patch or `(prev) => patch`). Saved to AsyncStorage under `settings`. On first launch after the refactor it migrates from the old zustand key `budget-settings` (`JSON.parse(raw).state`) and leaves that key in place. Each field is validated on load and falls back to `DEFAULT_SETTINGS`. Fields: `budgetStartDay`, `txnOverrides` and `merchantOverrides` (the user's category/icon edits), `tiltToHide`, `amountsHidden`, `analyticsChart`, `budgetLimit` (pence or null; null means budgeting is off), `categoryBudgets`, and for zakat `zakatStart` (yyyy-MM-dd or null), `goldPrice`/`silverPrice` (pence per gram), `zakatPayments` (manual ones) and `zakatWealthOverrides` (keyed by Hijri year).

**Bank data** is TanStack Query: `useAccounts()` and `useTransactions()` (overrides are applied in `select`, so an edit never refetches). Screens usually read `useBankData()` (`{ accounts, transactions, isPending, error, refetch }`, with stable empty arrays) and `usePullToRefresh(refetch)`. Edits go through `useEditTransaction()` (`utils/overrides.ts`).

Provider order in the root layout: QueryClientProvider > SettingsProvider (renders `LoadingScreen` until loaded).

## Screens

Routes live in `src/app/`. The root `_layout.tsx` is a Stack, and pushed pages get a native header with a back button and an `EyeButton`.

**Tabs** (`(tabs)/_layout.tsx`): Dashboard, Analytics, Budget, Zakat, Settings. Tab icons are Ionicons except Zakat, which uses MaterialCommunityIcons `hand-coin` (Ionicons has no hand with money).

- **Dashboard** (`(tabs)/index.tsx`):
  - Net worth hero, which opens `/net-worth`.
  - Zakat (`ZakatSummaryCard`, opens the Zakat tab): due date and days left, a paid/remaining progress bar with amounts, and anything still owed from past years. Before tracking it shows the nisab status instead.
  - "This budget month" 2×2 grid of tappable `ChartColumn`s:
    - Income & spending, Spending trend and By category (top 5 in the legend) each open Analytics with that chart selected, by setting `analyticsChart` in the store before navigating.
    - Budget (mini ring and daily allowance) opens the Budget tab.
  - Recent transactions (5, See all → `/transactions`) and upcoming recurring spending (5, See all → `/recurring`; spending only, no income).
- **Analytics** (`screens/analytics` → `screens/analytics/components/SpendingSection.tsx`):
  - Top row: a period button (opens `PeriodSheet`), the account filter (`AccountFilterSheet`) and the chart type (`ChartTypeSheet`).
  - Charts: income vs spending (`TotalsChart`, with net above), spending over time (`SpendingTrendChart`, cumulative, current vs previous period lined up by day index) and spending by category (`CategoryPieChart`).
  - Below the chart: a category/merchant breakdown list.
  - The chart card is a `SwipeablePeriod`: swipe right for earlier and left for later, which never goes past the current period. `PeriodDots` (3 dots, with the right dot hidden on the latest period) sit outside the card and lean towards the swipe through a shared `drag` Animated.Value.
- **PeriodSheet**: chips for Weekly, Monthly, Quarterly, Yearly and Custom.
  - Each kind shows its picker inline: `DayCalendar` (week or range mode), `MonthGrid` (12 months with year arrows), `QuarterGrid` (2×2) or `YearGrid` (6 years per page).
  - The draft is applied on Apply and discarded on dismiss. The footer shows the selected range.
  - Logic lives in `src/utils/spending-periods.ts`: `resolvePeriod`, `stepSelection` (a custom range steps by its own length) and `dailySpending`.
- **Budget** (`(tabs)/budget.tsx`):
  - Donut of spent (red) and committed (amber, `t.committed`) against the limit, with what's left in the middle.
  - A daily allowance row and a line spelling out the formula.
  - Category budget bars, and a "Committed this month" list (tap through to the recurring details).
  - With no limit set, it shows an empty state that links to `/spending-limit`.
- **Zakat** (`(tabs)/zakat.tsx`):
  - Before tracking: `NisabCard` (net worth vs gold and silver nisab) and a start prompt, only offered when net worth meets nisab. "Start from today" or pick an earlier date in `/zakat-settings`.
  - Tracking: red cards for completed years with zakat left (tap through), a due-date countdown (Hijri and Gregorian), a donut of paid vs zakat for the current year, the nisab card, all payments (Add payment opens `AddZakatPaymentSheet`; tapping a manual one offers delete), and Previous years → `/zakat/[year]`.
- **Settings** (`(tabs)/settings.tsx`):
  - BUDGET card with rows: Budget date → `/budget-date` (day grid); Spending limit → `/spending-limit` (limit, an Allocated % card with a segmented bar, and per-category `MoneyInput`s).
  - ZAKAT row → `/zakat-settings`: gold and silver prices per gram, and the zakat date (`HijriDatePicker`), plus Stop tracking.
  - Privacy (the tilt to hide switch) and bank connections.
- **Pushed pages:**
  - `/net-worth`: `NetWorthCard` line chart (1W, 1M, 3M, 6M or YTD) plus Current accounts and Credit cards lists. Tapping an account opens `/transactions?account=<id>`.
  - `/transactions`: search, multi-select account sheet (with balances), multi-select Category and Merchant pickers (`PickerModal`), and a list grouped by day. Tapping a row opens `TransactionEditModal` (category, icon, "apply to all from this merchant").
  - `/recurring` (`recurring/index.tsx`): search, All, Spending and Income chips, a monthly summary, and a list grouped by the month each payment is next due.
  - `/recurring/[key]` (`recurring/[key].tsx`): details and history for one payment.
  - `/zakat/[year]`: one zakat year (keyed by the Hijri year it falls due): totals, the wealth it was worked out on with a `MoneyInput` to override it, and the payments counted towards it.

## Key logic

- **Recurring detection** (`src/utils/recurring.ts`):
  - Groups transactions by normalised merchant and direction. Outgoing keys are the plain merchant name and income keys start with `in:`, so older links still work.
  - A group counts as recurring when the median interval classifies as weekly, fortnightly, monthly or yearly, at least 70% of intervals fall within tolerance, and amounts stay within 25% of the median.
  - Payments more than a period overdue are treated as stopped.
  - Each result carries `direction`, `accountId` (from the latest charge), `history` (newest first) and `monthlyCost`.
- **Budget** (`src/utils/budget.ts`, `useBudgetStatus()` in `src/hooks/useBudgetStatus.ts`):
  - spent = spending (no transfers) from the start of the budget month to today.
  - committed = recurring outgoing charges from today to the end of the month, one entry per occurrence. Weekly payments count every week; a charge already paid has moved its `nextDate` on, so it's never counted twice.
  - remaining = limit − spent − committed.
  - dailyAllowance = floor(remaining ÷ days left including today), or 0 when over.
- **Zakat** (`src/utils/zakat.ts`, `useZakat()` in `src/hooks/useZakat.ts`, calendar in `src/utils/hijri.ts`):
  - Zakat = 2.5% of net worth (all linked account balances) when it meets nisab: 87.48g gold or 612.36g silver, whichever is lower, as reaching either is enough. With no prices, nisab can't be checked and zakat is assumed due.
  - Years run from `zakatStart` to the same Hijri day each following year. A year is complete once its due date is reached (today counts). Completed years use net worth rebuilt for the due date (`netWorthOn`) unless overridden; the current year uses today's net worth. Past years are checked against today's metal prices.
  - Payments are manual entries plus transactions labelled `Zakat` (auto-matched by `/zakat|zakah/`). They're applied like paying off a debt: oldest year with zakat left first, overflow on the current year as an advance. Payments before `zakatStart` are ignored.
  - Hijri dates use Intl's `islamic-umalqura` when the engine supports it (checked once against a known date), otherwise the arithmetic calendar, which is within 2 days. Whether Hermes on iOS supports Umm al-Qura hasn't been checked; the settings page names the calendar in use.
- **Net worth over time** is rebuilt by walking backwards from current balances through the transactions (`src/utils/analytics.ts`).
- **Categorisation:** regex rules in `src/utils/categories.ts`. Remote data without a category is filled in the same way.
- **Hiding amounts:** the eye button (store `toggleAmountsHidden`, which also vibrates) or tilting the phone down. Each tilt toggles: it fires when the pitch drops below 20° after being above 35°, and starts unarmed so the phone lying flat at launch doesn't trigger it. Rotation is assumed to be in radians, which the Expo types don't state.

## Shared UI pieces

`BottomSheet` (transparent modal, renders children only while visible so draft state resets), `IconButton` (square, with a count badge; `AccountFilterButton` wraps it), `InfoTip` (ⓘ icon; the bubble is placed with `measureInWindow` in a transparent modal) and `SectionTitle` (uppercase section label with an optional `info` tip), `Chip`, `DayCalendar` (week, range or day mode), `HijriDatePicker`, `NisabCard`, `ZakatPaymentRow`, `DonutRing` (segmented ring used by the budget and category charts), `MoneyInput` (pounds in, pence out, commits on end editing; `parsePounds` for forms that read on submit), `RecurringRow`, `TransactionRow`, `SectionHeader`, `EyeButton`.
Theme tokens live in `constants/theme.ts` (light and dark): bg, card, text, muted, border, primary, income, spend, committed.

## Decisions and user preferences

- The user prefers compact, uncluttered screens: totals beside titles, settings split into sub-pages, and no "swipe to…" hint text (carousel dots instead).
- Explanations of a section or setting go in an `InfoTip` (ⓘ icon with a bubble), not inline text. Status messages, warnings and empty states stay visible.
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
