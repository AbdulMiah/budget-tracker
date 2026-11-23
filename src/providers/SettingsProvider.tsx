import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";

import { LoadingScreen } from "@/components/LoadingScreen";
import {
  BUDGET_START_DAY_RANGE,
  CHART_TYPES,
  DEFAULT_SETTINGS,
} from "@/constants";
import { type Settings } from "@/constants/types";

const STORAGE_KEY = "settings";
// Where older versions of the app kept settings (a zustand persist store, as { state, version }).
const LEGACY_STORAGE_KEY = "budget-settings";

type SettingsPatch =
  Partial<Settings> | ((prev: Settings) => Partial<Settings>);

export type SettingsContextValue = {
  settings: Settings;
  /** Merges the patch into the settings and saves them. Pass a function to build on the latest settings. */
  update: (patch: SettingsPatch) => void;
};

export const SettingsContext = createContext<SettingsContextValue | null>(null);

const isRecord = (value: unknown): value is Record<string, never> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const pence = (value: unknown): number | null =>
  typeof value === "number" && Number.isFinite(value) && value >= 0
    ? Math.round(value)
    : null;

// Stored JSON may be missing fields (older app version) or hand-edited; fall back per field.
function parse(stored: unknown): Settings {
  if (!isRecord(stored)) return DEFAULT_SETTINGS;
  const s = stored as Partial<Record<keyof Settings, unknown>>;
  const d = DEFAULT_SETTINGS;
  const bool = (value: unknown, fallback: boolean) =>
    typeof value === "boolean" ? value : fallback;
  const record = <T,>(value: unknown, fallback: T): T =>
    isRecord(value) ? (value as T) : fallback;
  const { min, max } = BUDGET_START_DAY_RANGE;

  return {
    budgetStartDay:
      typeof s.budgetStartDay === "number" && Number.isFinite(s.budgetStartDay)
        ? Math.min(max, Math.max(min, Math.round(s.budgetStartDay)))
        : d.budgetStartDay,
    txnOverrides: record(s.txnOverrides, d.txnOverrides),
    merchantOverrides: record(s.merchantOverrides, d.merchantOverrides),
    tiltToHide: bool(s.tiltToHide, d.tiltToHide),
    amountsHidden: bool(s.amountsHidden, d.amountsHidden),
    analyticsChart:
      CHART_TYPES.find((c) => c === s.analyticsChart) ?? d.analyticsChart,
    budgetLimit: pence(s.budgetLimit),
    categoryBudgets: record(s.categoryBudgets, d.categoryBudgets),
    zakatStart:
      typeof s.zakatStart === "string" &&
      /^\d{4}-\d{2}-\d{2}$/.test(s.zakatStart)
        ? s.zakatStart
        : d.zakatStart,
    goldPrice: pence(s.goldPrice),
    silverPrice: pence(s.silverPrice),
    zakatPayments: Array.isArray(s.zakatPayments)
      ? s.zakatPayments
      : d.zakatPayments,
    zakatWealthOverrides: record(
      s.zakatWealthOverrides,
      d.zakatWealthOverrides
    ),
  };
}

async function loadSettings(): Promise<Settings> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (raw) return parse(JSON.parse(raw));
  // First run after updating: carry over what the old store saved. It's left in
  // place so going back to an older build still finds it.
  const legacy = await AsyncStorage.getItem(LEGACY_STORAGE_KEY);
  return legacy ? parse(JSON.parse(legacy)?.state) : DEFAULT_SETTINGS;
}

export function SettingsProvider({ children }: PropsWithChildren) {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    loadSettings()
      .then(setSettings)
      .catch(() => undefined)
      .finally(() => setIsLoaded(true));
  }, []);

  const update = useCallback((patch: SettingsPatch) => {
    setSettings((prev) => {
      const next = {
        ...prev,
        ...(typeof patch === "function" ? patch(prev) : patch),
      };
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(
        () => undefined
      );
      return next;
    });
  }, []);

  const value = useMemo(() => ({ settings, update }), [settings, update]);

  // Wait for stored values so screens never flash the defaults (e.g. shown amounts).
  if (!isLoaded) return <LoadingScreen />;
  return <SettingsContext value={value}>{children}</SettingsContext>;
}
