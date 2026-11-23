// Bank Types
export type BankId = "barclays" | "lloyds" | "wise";

export type AccountType = "current" | "credit";

export interface Account {
  id: string;
  bank: BankId;
  type: AccountType;
  name: string;
  currency: "GBP";
  /** Current balance in pence. Negative on a credit card means money owed. */
  balance: number;
}

export interface Transaction {
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
}

// Category Types
export const CATEGORIES = [
  "Income",
  "Rent",
  "Bills",
  "Groceries",
  "Eating out",
  "Transport",
  "Shopping",
  "Subscriptions",
  "Entertainment",
  "Travel",
  "Health",
  "Zakat",
  "Transfer",
  "Other",
] as const;

export type Category = (typeof CATEGORIES)[number];

/**
 * Categories money can be budgeted for: everything except income, moving money between accounts,
 * and zakat (a yearly obligation tracked on its own tab, not a monthly spend).
 */
export const SPENDING_CATEGORIES = CATEGORIES.filter(
  (c) => c !== "Income" && c !== "Transfer" && c !== "Zakat"
);

/** A user's edit to how a transaction is shown. `icon: null` means the default initial. */
export interface Override {
  category: Category;
  icon: string | null;
}

// Analytics Types
/** Which chart Analytics shows. */
export type ChartType = "income-spending" | "spending-trend" | "categories";

// Zakat Types
/** A payment recorded by hand (cash, or from an account that isn't linked). Amount is positive pence. */
export interface ZakatPayment {
  id: string;
  date: string;
  amount: number;
  note?: string;
}

// Settings Types (saved on this phone, kept across sign-outs)
export interface Settings {
  /** Day of month (1-28) the budget period starts on. */
  budgetStartDay: number;
  /** Edits keyed by transaction id. */
  txnOverrides: Record<string, Override>;
  /** Edits keyed by merchant name, applied to all of its transactions. */
  merchantOverrides: Record<string, Override>;
  /** Tilting the phone down toggles hidden amounts. */
  tiltToHide: boolean;
  /** True while amounts are masked. */
  amountsHidden: boolean;
  /** Chart shown on Analytics. */
  analyticsChart: ChartType;
  /** Spending limit for each budget month in pence, or null when not set. */
  budgetLimit: number | null;
  /** Parts of the limit set aside for particular categories, in pence. */
  categoryBudgets: Partial<Record<Category, number>>;
  /** First day of the first zakat year (yyyy-MM-dd), or null before zakat tracking starts. */
  zakatStart: string | null;
  /** Gold and silver prices in pence per gram, used to work out nisab. */
  goldPrice: number | null;
  silverPrice: number | null;
  /** Zakat paid outside the linked accounts. */
  zakatPayments: ZakatPayment[];
  /** The user's own wealth figure for a completed zakat year, keyed by its Hijri year. */
  zakatWealthOverrides: Record<string, number>;
}
