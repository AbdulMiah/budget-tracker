import { useStore } from "@/store/useStore";
import * as money from "@/utils/format";

const MASK = "£***";

const masked: typeof money = {
  formatMoney: () => MASK,
  formatMoneyShort: () => MASK,
  // Keep the sign so money in and out still read differently.
  formatSigned: (pence) => `${pence > 0 ? "+" : pence < 0 ? "-" : ""}${MASK}`,
  formatAxis: () => MASK,
};

/** The money formatters, swapped for masked ones while amounts are hidden (e.g. the phone is tilted down). */
export function useMoney() {
  const hidden = useStore((s) => s.amountsHidden);
  return hidden ? masked : money;
}
