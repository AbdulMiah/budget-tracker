import { format, startOfMonth, subMonths } from 'date-fns';
import { categorize } from '../lib/categories';
import { Account, Transaction } from '../lib/types';
import { BankData, BankProvider } from './types';

// Deterministic PRNG so the demo data is stable between reloads.
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const ACCOUNTS: Account[] = [
  { id: 'barclays-current', bank: 'barclays', type: 'current', name: 'Barclays Current', currency: 'GBP', balance: 881245 },
  { id: 'lloyds-current', bank: 'lloyds', type: 'current', name: 'Lloyds Club Lloyds', currency: 'GBP', balance: 120650 },
  { id: 'wise-gbp', bank: 'wise', type: 'current', name: 'Wise GBP', currency: 'GBP', balance: 68420 },
  { id: 'barclaycard', bank: 'barclays', type: 'credit', name: 'Barclaycard', currency: 'GBP', balance: -34218 },
  { id: 'lloyds-credit', bank: 'lloyds', type: 'credit', name: 'Lloyds Credit Card', currency: 'GBP', balance: -12840 },
];

type Fixed = { account: string; day: number; merchant: string; pounds: number };

const FIXED: Fixed[] = [
  { account: 'barclays-current', day: 25, merchant: 'Acme Ltd Salary', pounds: 3100 },
  { account: 'barclays-current', day: 3, merchant: 'Netflix', pounds: -10.99 },
  { account: 'barclays-current', day: 8, merchant: 'Spotify', pounds: -11.99 },
  { account: 'barclays-current', day: 12, merchant: 'PureGym', pounds: -32 },
  { account: 'barclays-current', day: 17, merchant: 'iCloud', pounds: -2.99 },
  { account: 'lloyds-current', day: 1, merchant: 'Landlord Rent', pounds: -1150 },
  { account: 'lloyds-current', day: 5, merchant: 'Council Tax', pounds: -140 },
  { account: 'lloyds-current', day: 10, merchant: 'Octopus Energy', pounds: -95 },
  { account: 'lloyds-current', day: 15, merchant: 'BT Broadband', pounds: -30 },
  { account: 'lloyds-current', day: 20, merchant: 'Vodafone', pounds: -25 },
];

type Variable = { account: string; merchant: string; perMonth: number; min: number; max: number };

const VARIABLE: Variable[] = [
  { account: 'barclays-current', merchant: 'Tesco', perMonth: 6, min: 18, max: 70 },
  { account: 'barclays-current', merchant: 'Sainsburys', perMonth: 2, min: 25, max: 60 },
  { account: 'barclays-current', merchant: 'Pret A Manger', perMonth: 5, min: 4, max: 9 },
  { account: 'barclays-current', merchant: 'TfL Travel', perMonth: 6, min: 3, max: 14 },
  { account: 'barclays-current', merchant: 'Amazon', perMonth: 2, min: 8, max: 60 },
  { account: 'barclays-current', merchant: 'Boots', perMonth: 1, min: 5, max: 22 },
  { account: 'barclays-current', merchant: 'Odeon Cinemas', perMonth: 1, min: 10, max: 24 },
  { account: 'wise-gbp', merchant: 'Uber', perMonth: 3, min: 6, max: 22 },
  { account: 'wise-gbp', merchant: 'Deliveroo', perMonth: 3, min: 14, max: 32 },
  { account: 'wise-gbp', merchant: 'Booking.com', perMonth: 0.3, min: 60, max: 180 },
  { account: 'barclaycard', merchant: 'Waitrose', perMonth: 2, min: 25, max: 55 },
  { account: 'barclaycard', merchant: 'Trainline', perMonth: 2, min: 20, max: 70 },
  { account: 'lloyds-credit', merchant: 'ASOS', perMonth: 2, min: 20, max: 50 },
  { account: 'lloyds-credit', merchant: 'Steam', perMonth: 1, min: 8, max: 30 },
];

function generate(today: Date): Transaction[] {
  const todayStr = format(today, 'yyyy-MM-dd');
  const txns: Transaction[] = [];
  const seen = new Map<string, number>();
  const push = (account: string, date: Date, pounds: number, merchant: string, description?: string) => {
    const d = format(date, 'yyyy-MM-dd');
    if (d > todayStr) return;
    // Ids are derived from content so they stay the same between reloads.
    const base = `${account}-${d}-${merchant}`;
    const n = seen.get(base) ?? 0;
    seen.set(base, n + 1);
    txns.push({
      id: `${base}-${n}`,
      accountId: account,
      date: d,
      amount: Math.round(pounds * 100),
      merchant,
      description,
      category: categorize(merchant, description),
    });
  };

  for (let back = 13; back >= 0; back--) {
    const month = startOfMonth(subMonths(today, back));
    const rand = mulberry32(month.getFullYear() * 12 + month.getMonth());
    const dayOf = (day: number) => new Date(month.getFullYear(), month.getMonth(), day);

    for (const f of FIXED) push(f.account, dayOf(f.day), f.pounds, f.merchant);

    // Monthly top-ups from Barclays into the other two accounts.
    push('barclays-current', dayOf(26), -1450, 'Transfer to Lloyds', 'Transfer to own account');
    push('lloyds-current', dayOf(26), 1450, 'Transfer from Barclays', 'Transfer from own account');
    push('barclays-current', dayOf(27), -250, 'Transfer to Wise', 'Transfer to own account');
    push('wise-gbp', dayOf(27), 250, 'Transfer from Barclays', 'Transfer from own account');
    // Credit card repayments.
    push('barclays-current', dayOf(18), -170, 'Transfer to Barclaycard', 'Transfer to own account');
    push('barclaycard', dayOf(18), 170, 'Payment received', 'Transfer from own account');
    push('lloyds-current', dayOf(22), -90, 'Transfer to Lloyds Credit Card', 'Transfer to own account');
    push('lloyds-credit', dayOf(22), 90, 'Payment received', 'Transfer from own account');

    for (const v of VARIABLE) {
      let count = Math.floor(v.perMonth);
      if (rand() < v.perMonth - count) count++;
      for (let i = 0; i < count; i++) {
        const pounds = v.min + rand() * (v.max - v.min);
        push(v.account, dayOf(1 + Math.floor(rand() * 28)), -Math.round(pounds * 100) / 100, v.merchant);
      }
    }
  }

  return txns.sort((a, b) => b.date.localeCompare(a.date) || a.id.localeCompare(b.id));
}

export const mockProvider: BankProvider = {
  async fetchAll(): Promise<BankData> {
    await new Promise((r) => setTimeout(r, 400));
    return { accounts: ACCOUNTS, transactions: generate(new Date()) };
  },
  async connect() {
    // Demo data is already "connected".
  },
};
