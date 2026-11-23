import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { Account, Category, ChartType, Transaction } from "../lib/types";
import { ZakatPayment } from "../lib/zakat";
import { provider } from "../providers";

/** A user's edit to how a transaction is shown. `icon: null` means the default initial. */
export type Override = { category: Category; icon: string | null };

type Overrides = Record<string, Override>;

type State = {
  accounts: Account[];
  /** Transactions as the bank reported them. */
  rawTransactions: Transaction[];
  /** Transactions with the user's category/icon edits applied. */
  transactions: Transaction[];
  loading: boolean;
  error: string | null;
  /** Day of month (1-28) the budget period starts on. Persisted. */
  budgetStartDay: number;
  /** Edits keyed by transaction id. Persisted. */
  txnOverrides: Overrides;
  /** Edits keyed by merchant name, applied to all of its transactions. Persisted. */
  merchantOverrides: Overrides;
  /** Tilting the phone down toggles hidden amounts. Persisted. */
  tiltToHide: boolean;
  /** True while amounts are masked. Persisted. */
  amountsHidden: boolean;
  /** Chart shown on Analytics. Persisted. */
  analyticsChart: ChartType;
  /** Spending limit for each budget month in pence, or null when not set. Persisted. */
  budgetLimit: number | null;
  /** Parts of the limit set aside for particular categories, in pence. Persisted. */
  categoryBudgets: Partial<Record<Category, number>>;
  /** First day of the first zakat year (yyyy-MM-dd), or null before zakat tracking starts. Persisted. */
  zakatStart: string | null;
  /** Gold and silver prices in pence per gram, used to work out nisab. Persisted. */
  goldPrice: number | null;
  silverPrice: number | null;
  /** Zakat paid outside the linked accounts. Persisted. */
  zakatPayments: ZakatPayment[];
  /** The user's own wealth figure for a completed zakat year, keyed by its Hijri year. Persisted. */
  zakatWealthOverrides: Record<string, number>;
  setBudgetStartDay: (day: number) => void;
  setOverride: (
    txnId: string,
    override: Override,
    applyToMerchant: boolean
  ) => void;
  setTiltToHide: (on: boolean) => void;
  setAnalyticsChart: (chart: ChartType) => void;
  setBudgetLimit: (pence: number | null) => void;
  /** Pass null to remove a category's allocation. */
  setCategoryBudget: (category: Category, pence: number | null) => void;
  setZakatStart: (date: string | null) => void;
  setGoldPrice: (pence: number | null) => void;
  setSilverPrice: (pence: number | null) => void;
  addZakatPayment: (payment: Omit<ZakatPayment, "id">) => void;
  removeZakatPayment: (id: string) => void;
  /** Pass null to go back to the figure rebuilt from transactions. */
  setZakatWealthOverride: (key: string, pence: number | null) => void;
  /** Flips hidden amounts and vibrates so the change is felt as well as seen. */
  toggleAmountsHidden: () => void;
  load: () => Promise<void>;
};

function applyOverrides(
  raw: Transaction[],
  byTxn: Overrides,
  byMerchant: Overrides
): Transaction[] {
  return raw.map((t) => {
    const o = byTxn[t.id] ?? byMerchant[t.merchant];
    return o ? { ...t, ...o } : t;
  });
}

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      accounts: [],
      rawTransactions: [],
      transactions: [],
      loading: false,
      error: null,
      budgetStartDay: 1,
      txnOverrides: {},
      merchantOverrides: {},
      tiltToHide: true,
      amountsHidden: false,
      analyticsChart: "income-spending",
      budgetLimit: null,
      categoryBudgets: {},
      zakatStart: null,
      goldPrice: null,
      silverPrice: null,
      zakatPayments: [],
      zakatWealthOverrides: {},
      setBudgetStartDay: (day) => set({ budgetStartDay: day }),
      setTiltToHide: (on) => set({ tiltToHide: on }),
      setAnalyticsChart: (chart) => set({ analyticsChart: chart }),
      setBudgetLimit: (pence) => set({ budgetLimit: pence }),
      setCategoryBudget: (category, pence) => {
        const next = { ...get().categoryBudgets };
        if (pence === null) delete next[category];
        else next[category] = pence;
        set({ categoryBudgets: next });
      },
      setZakatStart: (date) => set({ zakatStart: date }),
      setGoldPrice: (pence) => set({ goldPrice: pence }),
      setSilverPrice: (pence) => set({ silverPrice: pence }),
      addZakatPayment: (payment) => {
        const id = `zakat-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
        set({ zakatPayments: [...get().zakatPayments, { ...payment, id }] });
      },
      removeZakatPayment: (id) =>
        set({ zakatPayments: get().zakatPayments.filter((p) => p.id !== id) }),
      setZakatWealthOverride: (key, pence) => {
        const next = { ...get().zakatWealthOverrides };
        if (pence === null) delete next[key];
        else next[key] = pence;
        set({ zakatWealthOverrides: next });
      },
      toggleAmountsHidden: () => {
        const hidden = !get().amountsHidden;
        set({ amountsHidden: hidden });
        Haptics.notificationAsync(
          hidden
            ? Haptics.NotificationFeedbackType.Success
            : Haptics.NotificationFeedbackType.Warning
        ).catch(() => {});
      },
      setOverride: (txnId, override, applyToMerchant) => {
        const { rawTransactions, txnOverrides, merchantOverrides } = get();
        const txn = rawTransactions.find((t) => t.id === txnId);
        if (!txn) return;
        const nextTxn = { ...txnOverrides };
        let nextMerchant = merchantOverrides;
        if (applyToMerchant) {
          nextMerchant = { ...merchantOverrides, [txn.merchant]: override };
          // The merchant rule replaces any earlier one-off edits for this merchant.
          for (const t of rawTransactions)
            if (t.merchant === txn.merchant) delete nextTxn[t.id];
        } else {
          nextTxn[txnId] = override;
        }
        set({
          txnOverrides: nextTxn,
          merchantOverrides: nextMerchant,
          transactions: applyOverrides(rawTransactions, nextTxn, nextMerchant),
        });
      },
      load: async () => {
        set({ loading: true, error: null });
        try {
          const { accounts, transactions } = await provider.fetchAll();
          const { txnOverrides, merchantOverrides } = get();
          set({
            accounts,
            rawTransactions: transactions,
            transactions: applyOverrides(
              transactions,
              txnOverrides,
              merchantOverrides
            ),
            loading: false,
          });
        } catch (e) {
          set({
            loading: false,
            error:
              e instanceof Error ? e.message : "Could not load transactions",
          });
        }
      },
    }),
    {
      name: "budget-settings",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({
        budgetStartDay: s.budgetStartDay,
        txnOverrides: s.txnOverrides,
        merchantOverrides: s.merchantOverrides,
        tiltToHide: s.tiltToHide,
        amountsHidden: s.amountsHidden,
        analyticsChart: s.analyticsChart,
        budgetLimit: s.budgetLimit,
        categoryBudgets: s.categoryBudgets,
        zakatStart: s.zakatStart,
        goldPrice: s.goldPrice,
        silverPrice: s.silverPrice,
        zakatPayments: s.zakatPayments,
        zakatWealthOverrides: s.zakatWealthOverrides,
      }),
      // Saved edits can arrive after the first fetch, so re-apply them on hydration.
      merge: (persisted, current) => {
        const merged = { ...current, ...(persisted as Partial<State>) };
        return {
          ...merged,
          transactions: applyOverrides(
            merged.rawTransactions,
            merged.txnOverrides,
            merged.merchantOverrides
          ),
        };
      },
    }
  )
);
