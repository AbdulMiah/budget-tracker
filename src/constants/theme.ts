import { useColorScheme } from "react-native";

import { BankId } from "@/constants/types";

const light = {
  bg: "#F4F6FA",
  card: "#FFFFFF",
  text: "#121826",
  muted: "#6B7588",
  border: "#E3E8F0",
  primary: "#3D5AFE",
  income: "#2E9E6B",
  spend: "#E5604D",
  /** Money already promised to upcoming recurring payments. */
  committed: "#E0A030",
};

const dark: typeof light = {
  bg: "#0C0F17",
  card: "#161B27",
  text: "#F2F4F8",
  muted: "#8D97AA",
  border: "#252C3B",
  primary: "#7C8CFF",
  income: "#4CC38A",
  spend: "#F07A68",
  committed: "#F0B54A",
};

export const useTheme = () => (useColorScheme() === "dark" ? dark : light);
export type Theme = ReturnType<typeof useTheme>;

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
