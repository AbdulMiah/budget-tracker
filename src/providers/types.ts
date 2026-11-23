import { Account, BankId, Transaction } from "@/constants/types";

export type BankData = { accounts: Account[]; transactions: Transaction[] };

export interface BankProvider {
  /** Fetch every linked account and its transaction history. */
  fetchAll(): Promise<BankData>;
  /** Start the consent flow for a bank (opens the aggregator's auth page). */
  connect(bank: BankId): Promise<void>;
}
