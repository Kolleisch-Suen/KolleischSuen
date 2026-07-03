/**
 * Central configuration for the KolleischSuen fair app.
 *
 * v1 is a *simulated* build: no real Hive-Engine calls happen. The KISS token is
 * treated 1:1 with the euro (1 KISS = 1 €). See AGENTS.md for the security rules
 * that apply once real keys/transfers are introduced.
 */

/** Token symbol used on the (simulated) Hive-Engine layer. */
export const TOKEN_SYMBOL = process.env.KISS_SYMBOL ?? "KISS";

/** Decimal precision for money amounts (euros and KISS both use 2). */
export const MONEY_PRECISION = 2;

/** How long a cashier-issued claim token stays valid, in seconds. */
export const CLAIM_TTL_SECONDS = Number(process.env.CLAIM_TTL_SECONDS ?? 300);

/** Slug of the event whose wallet pool the cashier hands out from. */
export const ACTIVE_EVENT_SLUG =
  process.env.ACTIVE_EVENT_SLUG ?? "chreschtmaart";

/** Largest single amount a cashier may issue at once, in euros. */
export const MAX_ISSUE_EUROS = Number(process.env.MAX_ISSUE_EUROS ?? 1000);

/**
 * Base URL the phone will use to reach this server when it scans the QR code.
 * On localhost the phone can't reach `localhost`, so set APP_BASE_URL to the
 * dev machine's LAN address (e.g. http://192.168.1.20:3000). When unset, callers
 * fall back to the request origin.
 */
export function resolveBaseUrl(requestUrl: string): string {
  const configured = process.env.APP_BASE_URL?.trim();
  if (configured) return configured.replace(/\/+$/, "");
  return new URL(requestUrl).origin;
}
