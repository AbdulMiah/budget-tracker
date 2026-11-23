import { useColorScheme } from "react-native";

import { DARK_THEME, LIGHT_THEME, Theme } from "@/constants/theme";

/** Colours for the phone's light or dark appearance. */
export function useTheme(): Theme {
  return useColorScheme() === "dark" ? DARK_THEME : LIGHT_THEME;
}
