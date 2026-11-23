import { addDays, differenceInCalendarDays } from "date-fns";

/** A date in the Hijri (lunar) calendar. `month` is 1 (Muharram) to 12 (Dhu al-Hijjah). */
export type HijriDate = { year: number; month: number; day: number };

export const HIJRI_MONTHS = [
  "Muharram",
  "Safar",
  "Rabi al-Awwal",
  "Rabi al-Thani",
  "Jumada al-Ula",
  "Jumada al-Akhirah",
  "Rajab",
  "Sha'ban",
  "Ramadan",
  "Shawwal",
  "Dhu al-Qa'dah",
  "Dhu al-Hijjah",
];

const DAY_MS = 86_400_000;
// Julian day of 1 Muharram 1 AH in the arithmetic (tabular) calendar.
const EPOCH = 1948439.5;

/** Local calendar day -> whole day number (Julian day at midnight). */
const toJulian = (d: Date) =>
  Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / DAY_MS + 2440587.5;

/** Julian day of a Hijri date in the arithmetic calendar. */
const tabularToJulian = (year: number, month: number, day: number) =>
  day +
  Math.ceil(29.5 * (month - 1)) +
  (year - 1) * 354 +
  Math.floor((3 + 11 * year) / 30) +
  EPOCH -
  1;

/** Arithmetic Hijri calendar: a fixed 30-year cycle, usually within a day of Umm al-Qura. */
function tabularToHijri(date: Date): HijriDate {
  const jd = Math.floor(toJulian(date)) + 0.5;
  const year = Math.floor((30 * (jd - EPOCH) + 10646) / 10631);
  const month = Math.min(
    12,
    Math.ceil((jd - (29 + tabularToJulian(year, 1, 1))) / 29.5) + 1
  );
  const day = jd - tabularToJulian(year, month, 1) + 1;
  return { year, month, day };
}

/**
 * Umm al-Qura (the calendar Saudi Arabia publishes, based on astronomical calculation) through Intl,
 * or null where the JS engine doesn't support it. Checked once against a known date.
 */
const ummAlQura = (() => {
  try {
    const fmt = new Intl.DateTimeFormat("en-u-ca-islamic-umalqura", {
      timeZone: "UTC",
      day: "numeric",
      month: "numeric",
      year: "numeric",
    });
    const convert = (date: Date): HijriDate => {
      const parts = fmt.formatToParts(
        new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
      );
      const get = (type: string) =>
        parseInt(parts.find((p) => p.type === type)?.value ?? "", 10);
      return { year: get("year"), month: get("month"), day: get("day") };
    };
    // 11 March 2024 was 1 Ramadan 1445 in Umm al-Qura.
    const check = convert(new Date(2024, 2, 11));
    return check.year === 1445 && check.month === 9 && check.day === 1
      ? convert
      : null;
  } catch {
    return null;
  }
})();

/** The calendar in use, for showing a note about accuracy. */
export const hijriCalendarName = ummAlQura ? "Umm al-Qura" : "arithmetic Hijri";

export const toHijri = (date: Date): HijriDate =>
  (ummAlQura ?? tabularToHijri)(date);

/** First day of a Hijri month, as a local-midnight Date. */
export function hijriMonthStart(year: number, month: number): Date {
  // Estimate with the arithmetic calendar, then nudge until it agrees with the calendar in use.
  const jd = tabularToJulian(year, month, 1);
  let d = new Date((jd - 2440587.5) * DAY_MS);
  d = new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
  // The two calendars differ by a day or two at most, so a few steps always land on it.
  for (let i = 0; i < 8; i++) {
    const h = toHijri(d);
    const cmp = (h.year - year) * 12 + (h.month - month);
    if (cmp === 0 && h.day === 1) return d;
    // In the target month: jump to its first day. In a later month: step back; earlier: forward.
    d = addDays(d, cmp === 0 ? 1 - h.day : cmp > 0 ? -h.day : 1);
  }
  return d;
}

/** Days in a Hijri month (29 or 30). */
export function hijriMonthLength(year: number, month: number): number {
  const next =
    month === 12
      ? hijriMonthStart(year + 1, 1)
      : hijriMonthStart(year, month + 1);
  return differenceInCalendarDays(next, hijriMonthStart(year, month));
}

/** Hijri date -> local-midnight Date. Day 30 of a 29-day month falls on its last day. */
export function fromHijri({ year, month, day }: HijriDate): Date {
  return addDays(
    hijriMonthStart(year, month),
    Math.min(day, hijriMonthLength(year, month)) - 1
  );
}

/** "1 Ramadan 1448 AH"; `short` leaves out the year. */
export const formatHijri = (h: HijriDate, short = false) =>
  `${h.day} ${HIJRI_MONTHS[h.month - 1]}${short ? "" : ` ${h.year} AH`}`;
