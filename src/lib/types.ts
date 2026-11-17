export type BankId = 'barclays' | 'lloyds' | 'wise';

export type AccountType = 'current' | 'credit';

export type Account = {
  id: string;
  bank: BankId;
  type: AccountType;
  name: string;
  currency: 'GBP';
  /** Current balance in pence. Negative on a credit card means money owed. */
  balance: number;
};

export type Transaction = {
  id: string;
  accountId: string;
  /** Local calendar date, yyyy-MM-dd. */
  date: string;
  /** Signed amount in pence: negative = money out, positive = money in. */
  amount: number;
  merchant: string;
  description?: string;
  category: Category;
  /** Ionicons glyph name chosen by the user; unset or null shows the merchant initial. */
  icon?: string | null;
};

export const CATEGORIES = [
  'Income',
  'Rent',
  'Bills',
  'Groceries',
  'Eating out',
  'Transport',
  'Shopping',
  'Subscriptions',
  'Entertainment',
  'Travel',
  'Health',
  'Zakat',
  'Transfer',
  'Other',
] as const;

export type Category = (typeof CATEGORIES)[number];

/**
 * Categories money can be budgeted for: everything except income, moving money between accounts,
 * and zakat (a yearly obligation tracked on its own tab, not a monthly spend).
 */
export const SPENDING_CATEGORIES = CATEGORIES.filter((c) => c !== 'Income' && c !== 'Transfer' && c !== 'Zakat');

/** Which chart Analytics shows. */
export type ChartType = 'income-spending' | 'spending-trend' | 'categories';
