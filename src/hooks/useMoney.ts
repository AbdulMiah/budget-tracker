import { AMOUNT_MASK } from "@/constants";
import { useSettings } from "@/hooks/useSettings";
import * as money from "@/utils/format";

const masked: typeof money = {
  formatMoney: () => AMOUNT_MASK,
  formatMoneyShort: () => AMOUNT_MASK,
  // Keep the sign so money in and out still read differently.
  formatSigned: (pence) =>
    `${pence > 0 ? "+" : pence < 0 ? "-" : ""}${AMOUNT_MASK}`,
  formatAxis: () => AMOUNT_MASK,
};

/** The money formatters, swapped for masked ones while amounts are hidden (e.g. the phone is tilted down). */
export function useMoney() {
  const { settings } = useSettings();
  return settings.amountsHidden ? masked : money;
}
