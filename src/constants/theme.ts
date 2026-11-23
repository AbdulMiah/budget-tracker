export const LIGHT_THEME = {
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

export type Theme = typeof LIGHT_THEME;

export const DARK_THEME: Theme = {
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
