import { Category } from './types';

export const CATEGORY_COLORS: Record<Category, string> = {
  Income: '#2E9E6B',
  Rent: '#7C5CFA',
  Bills: '#E0903A',
  Groceries: '#4CAF50',
  'Eating out': '#E5604D',
  Transport: '#3D8BE0',
  Shopping: '#D1569A',
  Subscriptions: '#8E6BBF',
  Entertainment: '#E0B83A',
  Travel: '#2AB3B3',
  Health: '#E0586E',
  Zakat: '#14806F',
  Transfer: '#8A94A6',
  Other: '#8A94A6',
};

const RULES: [RegExp, Category][] = [
  [/\bzaka[th]\b|zakat foundation/i, 'Zakat'],
  [/salary|payroll|wages/i, 'Income'],
  [/landlord|rent\b|letting/i, 'Rent'],
  [/council tax|octopus|british gas|thames water|bt broadband|vodafone|o2|ee\b|virgin media/i, 'Bills'],
  [/tesco|sainsbury|aldi|lidl|waitrose|co-?op|asda|m&s food/i, 'Groceries'],
  [/pret|starbucks|costa|deliveroo|uber eats|just eat|nando|wagamama|pizza|greggs|mcdonald/i, 'Eating out'],
  [/tfl|trainline|uber\b|bolt|shell|bp\b|national rail/i, 'Transport'],
  [/amazon|asos|argos|ikea|zara|h&m|john lewis/i, 'Shopping'],
  [/netflix|spotify|disney|icloud|apple\.com|youtube|gym|puregym|prime video/i, 'Subscriptions'],
  [/odeon|cineworld|ticketmaster|steam|playstation/i, 'Entertainment'],
  [/ryanair|easyjet|booking\.com|airbnb|british airways/i, 'Travel'],
  [/boots|pharmacy|dentist|optician|superdrug/i, 'Health'],
  [/transfer (to|from)|own account/i, 'Transfer'],
];

export function categorize(merchant: string, description = ''): Category {
  const text = `${merchant} ${description}`;
  for (const [re, cat] of RULES) if (re.test(text)) return cat;
  return 'Other';
}
