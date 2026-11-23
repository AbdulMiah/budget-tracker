import { Override, Settings, Transaction } from "@/constants/types";

type Overrides = Record<string, Override>;

/** Transactions with the user's category/icon edits applied; a one-off edit wins over a merchant rule. */
export function applyOverrides(
  transactions: Transaction[],
  byTxn: Overrides,
  byMerchant: Overrides
): Transaction[] {
  return transactions.map((t) => {
    const override = byTxn[t.id] ?? byMerchant[t.merchant];
    return override ? { ...t, ...override } : t;
  });
}

/** The settings change that saves an edit to one transaction, or to every transaction from its merchant. */
export function withOverride(
  settings: Settings,
  transactions: Transaction[],
  txn: Transaction,
  override: Override,
  applyToMerchant: boolean
): Pick<Settings, "txnOverrides" | "merchantOverrides"> {
  const txnOverrides = { ...settings.txnOverrides };
  if (!applyToMerchant) {
    txnOverrides[txn.id] = override;
    return { txnOverrides, merchantOverrides: settings.merchantOverrides };
  }
  // The merchant rule replaces any earlier one-off edits for this merchant.
  for (const t of transactions) {
    if (t.merchant === txn.merchant) delete txnOverrides[t.id];
  }
  return {
    txnOverrides,
    merchantOverrides: {
      ...settings.merchantOverrides,
      [txn.merchant]: override,
    },
  };
}
