/**
 * Pure helpers for parsing and formatting money amounts.
 *
 * Convention for v1: 1 KISS = 1 €. KISS is the token that moves in the
 * background; the UI always shows euros to keep it intuitive for fair operators.
 */

import { MAX_ISSUE_EUROS, MONEY_PRECISION } from "../config";

export type ParsedAmount =
  | { ok: true; euros: number; cents: number; canonical: string }
  | { ok: false; error: string };

/**
 * Parse an operator-entered amount such as "20", "20.00" or "20,00" (comma
 * decimal separator is accepted). Rejects non-numeric input, zero/negative
 * values, amounts above {@link MAX_ISSUE_EUROS}, and more than 2 decimals.
 */
export function parseEuroAmount(input: string): ParsedAmount {
  const trimmed = (input ?? "").trim();
  if (trimmed === "") return { ok: false, error: "Enter an amount." };

  // Accept a single comma as the decimal separator (European entry).
  const normalized = trimmed.replace(",", ".");
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) {
    return { ok: false, error: "Amount must be a number like 20 or 20.50." };
  }

  const euros = Number(normalized);
  if (!Number.isFinite(euros) || euros <= 0) {
    return { ok: false, error: "Amount must be greater than 0." };
  }
  if (euros > MAX_ISSUE_EUROS) {
    return { ok: false, error: `Amount may not exceed €${MAX_ISSUE_EUROS}.` };
  }

  const cents = Math.round(euros * 100);
  return {
    ok: true,
    euros: cents / 100,
    cents,
    canonical: (cents / 100).toFixed(MONEY_PRECISION),
  };
}

/** 1:1 conversion. Kept as named functions so the rate lives in one place. */
export function eurosToKiss(euros: number): number {
  return euros;
}

export function kissToEuros(kiss: number): number {
  return kiss;
}

/** Format a euro amount for display, e.g. formatEuros(20) === "20.00 €". */
export function formatEuros(euros: number): string {
  return `${euros.toFixed(MONEY_PRECISION)} €`;
}

/**
 * Format a KISS quantity (number, string, or Prisma Decimal-like) as euros for
 * the UI. Accepts anything coercible via Number() so callers can pass Prisma
 * Decimal values straight through.
 */
export function formatKissAsEuros(kiss: number | string): string {
  return formatEuros(kissToEuros(Number(kiss)));
}
