import type { Ionicons } from "@expo/vector-icons";
import type { ComponentProps } from "react";

import { BankId, Category, ChartType, Settings } from "@/constants/types";
import type { Frequency } from "@/utils/recurring";

export const SPACING = {
  half: 2,
  one: 4,
  two: 8,
  three: 12,
  four: 16,
  five: 24,
  six: 32,
} as const;

export const RADIUS = {
  small: 8,
  medium: 12,
  large: 16,
} as const;

export const WHITE = "#FFFFFF";

export const BANK_COLORS: Record<BankId, string> = {
  barclays: "#00AEEF",
  lloyds: "#2E8B57",
  wise: "#6BBF3B",
};

export const BANK_NAMES: Record<BankId, string> = {
  barclays: "Barclays",
  lloyds: "Lloyds",
  wise: "Wise",
};

export const BANKS: BankId[] = ["barclays", "lloyds", "wise"];

export const CATEGORY_COLORS: Record<Category, string> = {
  Income: "#2E9E6B",
  Rent: "#7C5CFA",
  Bills: "#E0903A",
  Groceries: "#4CAF50",
  "Eating out": "#E5604D",
  Transport: "#3D8BE0",
  Shopping: "#D1569A",
  Subscriptions: "#8E6BBF",
  Entertainment: "#E0B83A",
  Travel: "#2AB3B3",
  Health: "#E0586E",
  Zakat: "#14806F",
  Transfer: "#8A94A6",
  Other: "#8A94A6",
};

export const FREQUENCY_LABELS: Record<Frequency, string> = {
  Weekly: "Every week",
  Fortnightly: "Every 2 weeks",
  Monthly: "Every month",
  Yearly: "Every year",
};

export const CHART_TYPE_OPTIONS: {
  type: ChartType;
  title: string;
  description: string;
  icon: ComponentProps<typeof Ionicons>["name"];
}[] = [
  {
    type: "income-spending",
    title: "Income vs spending",
    description: "Total money in and out for the period",
    icon: "bar-chart-outline",
  },
  {
    type: "spending-trend",
    title: "Spending over time",
    description: "How spending builds up, compared with the previous period",
    icon: "trending-up-outline",
  },
  {
    type: "categories",
    title: "Spending by category",
    description: "How your spending splits between categories",
    icon: "pie-chart-outline",
  },
];

export const CHART_TYPES: ChartType[] = CHART_TYPE_OPTIONS.map((c) => c.type);

/** Highest budget day is 28 so every month has it. */
export const BUDGET_START_DAY_RANGE = { min: 1, max: 28 } as const;

/** Shown in place of every amount while amounts are hidden. */
export const AMOUNT_MASK = "£***";

export const DEFAULT_SETTINGS: Settings = {
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
};
