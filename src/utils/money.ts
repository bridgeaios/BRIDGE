/**
 * Decimal-safe Money & Currency Utility
 * Stores money in integer minor units (cents) to eliminate IEEE 754 floating point inaccuracies.
 * 1 ZAR = 100 cents.
 */

export interface CurrencyConfig {
  code: string;
  symbol: string;
  name: string;
}

export const SUPPORTED_CURRENCIES: CurrencyConfig[] = [
  { code: 'ZAR', symbol: 'R', name: 'South African Rand' },
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
];

let activeCurrency: CurrencyConfig = SUPPORTED_CURRENCIES[0]; // ZAR default

export function getActiveCurrency(): CurrencyConfig {
  try {
    const code = localStorage.getItem('bb_currency');
    const match = SUPPORTED_CURRENCIES.find((c) => c.code === code);
    if (match) activeCurrency = match;
  } catch {}
  return activeCurrency;
}

export function setActiveCurrency(code: string): CurrencyConfig {
  const match = SUPPORTED_CURRENCIES.find((c) => c.code === code) || SUPPORTED_CURRENCIES[0];
  activeCurrency = match;
  try {
    localStorage.setItem('bb_currency', match.code);
  } catch {}
  return activeCurrency;
}

/**
 * Format integer cents to display string with currency symbol.
 * Example: 14950 -> "R 149.50"
 */
export function formatCents(cents: number, includeSymbol: boolean = true): string {
  const isNegative = cents < 0;
  const absCents = Math.abs(Math.round(cents));
  const rands = Math.floor(absCents / 100);
  const remainingCents = absCents % 100;
  const paddedCents = remainingCents.toString().padStart(2, '0');
  
  // Format with thousands separator
  const formattedRands = rands.toLocaleString('en-ZA');
  const formattedAmount = `${formattedRands}.${paddedCents}`;
  
  const curr = getActiveCurrency();
  const sign = isNegative ? '-' : '';
  return includeSymbol ? `${sign}${curr.symbol} ${formattedAmount}` : `${sign}${formattedAmount}`;
}

/**
 * Parse user text input into integer cents.
 * Handles "149.50", "R149.50", "R 149,50", "2000"
 */
export function parseToCents(input: string | number): number {
  if (typeof input === 'number') return Math.round(input * 100);
  if (!input) return 0;
  const cleaned = input
    .replace(/[^\d.,-]/g, '')
    .replace(',', '.');
  const num = parseFloat(cleaned);
  if (isNaN(num)) return 0;
  return Math.round(num * 100);
}

/**
 * Safe integer additions / subtractions
 */
export const moneyMath = {
  remaining: (allocatedCents: number, actualCents: number) => allocatedCents - actualCents,
  netCashFlow: (incomeCents: number, expenseCents: number) => incomeCents - expenseCents,
  variance: (actualCents: number, plannedCents: number) => actualCents - plannedCents,
  percentUsed: (actualCents: number, allocatedCents: number) => {
    if (allocatedCents <= 0) return actualCents > 0 ? 100 : 0;
    return Math.min(Math.round((actualCents / allocatedCents) * 100), 200);
  },
};
