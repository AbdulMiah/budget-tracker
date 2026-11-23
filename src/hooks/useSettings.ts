import { use } from "react";

import { SettingsContext } from "@/providers/SettingsProvider";

export function useSettings() {
  const value = use(SettingsContext);
  if (!value) {
    throw new Error("useSettings must be wrapped in a <SettingsProvider />");
  }
  return value;
}
