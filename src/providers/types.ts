import { Account, BankId, Transaction } from '../lib/types';

export type BankData = { accounts: Account[]; transactions: Transaction[] };

export interface BankProvider {
  /** Fetch every linked account and its transaction history. */
  fetchAll(): Promise<BankData>;
  /**
   * Runs the consent flow for a bank in an in-app browser and resolves once the user is back.
   * True when the bank was linked, false when they closed the browser. Throws if the bank reported an error.
   */
  connect(bank: BankId): Promise<boolean>;
}
