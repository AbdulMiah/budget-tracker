const gbp = new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' });
const gbpWhole = new Intl.NumberFormat('en-GB', {
  style: 'currency',
  currency: 'GBP',
  maximumFractionDigits: 0,
});

/** Pence -> "£12.34". */
export const formatMoney = (pence: number) => gbp.format(pence / 100);

/** Pence -> "£1,234" (no decimals), for charts and summaries. */
export const formatMoneyShort = (pence: number) => gbpWhole.format(pence / 100);

/** Pence -> "+£12.34" / "-£12.34". */
export const formatSigned = (pence: number) =>
  `${pence > 0 ? '+' : pence < 0 ? '-' : ''}${gbp.format(Math.abs(pence) / 100)}`;

/** Compact axis labels: 12500 pence -> "£125", 1_250_000 -> "£12.5k". */
export function formatAxis(pence: number) {
  const pounds = pence / 100;
  if (Math.abs(pounds) >= 1000) return `£${(pounds / 1000).toFixed(1).replace(/\.0$/, '')}k`;
  return `£${Math.round(pounds)}`;
}
