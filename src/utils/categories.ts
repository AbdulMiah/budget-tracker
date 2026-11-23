import { Category } from "@/constants/types";

const RULES: [RegExp, Category][] = [
  [/\bzaka[th]\b|zakat foundation/i, "Zakat"],
  [/salary|payroll|wages/i, "Income"],
  [/landlord|rent\b|letting/i, "Rent"],
  [
    /council tax|octopus|british gas|thames water|bt broadband|vodafone|o2|ee\b|virgin media/i,
    "Bills",
  ],
  [/tesco|sainsbury|aldi|lidl|waitrose|co-?op|asda|m&s food/i, "Groceries"],
  [
    /pret|starbucks|costa|deliveroo|uber eats|just eat|nando|wagamama|pizza|greggs|mcdonald/i,
    "Eating out",
  ],
  [/tfl|trainline|uber\b|bolt|shell|bp\b|national rail/i, "Transport"],
  [/amazon|asos|argos|ikea|zara|h&m|john lewis/i, "Shopping"],
  [
    /netflix|spotify|disney|icloud|apple\.com|youtube|gym|puregym|prime video/i,
    "Subscriptions",
  ],
  [/odeon|cineworld|ticketmaster|steam|playstation/i, "Entertainment"],
  [/ryanair|easyjet|booking\.com|airbnb|british airways/i, "Travel"],
  [/boots|pharmacy|dentist|optician|superdrug/i, "Health"],
  [/transfer (to|from)|own account/i, "Transfer"],
];

export function categorize(merchant: string, description = ""): Category {
  const text = `${merchant} ${description}`;
  for (const [re, cat] of RULES) if (re.test(text)) return cat;
  return "Other";
}
