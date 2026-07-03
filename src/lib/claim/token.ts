/**
 * Short-lived, single-use claim tokens.
 *
 * A cashier "issue" mints one of these and encodes it in a QR code. A phone that
 * reads the QR posts the secret back exactly once to retrieve wallet credentials.
 * The expiry / single-use rules below are pure so they can be unit-tested; the
 * atomic "mark used" enforcement lives in the API route's DB transaction.
 */

import { randomBytes } from "node:crypto";

/** URL-safe random secret carried in the QR code (32 bytes → 64 hex chars). */
export function generateClaimSecret(): string {
  return randomBytes(32).toString("hex");
}

/** Expiry instant for a token minted at `now` with the given TTL. */
export function computeExpiry(now: Date, ttlSeconds: number): Date {
  return new Date(now.getTime() + ttlSeconds * 1000);
}

export function isExpired(expiresAt: Date, now: Date): boolean {
  return expiresAt.getTime() <= now.getTime();
}

export function isConsumed(usedAt: Date | null | undefined): boolean {
  return usedAt != null;
}

export type ClaimEvaluation =
  | { ok: true }
  | { ok: false; reason: "used" | "expired" };

/**
 * Decide whether a claim may proceed, given its stored state and the current
 * time. Pure: no DB access. The caller still performs the atomic consume.
 */
export function evaluateClaim(input: {
  usedAt: Date | null | undefined;
  expiresAt: Date;
  now: Date;
}): ClaimEvaluation {
  if (isConsumed(input.usedAt)) return { ok: false, reason: "used" };
  if (isExpired(input.expiresAt, input.now)) return { ok: false, reason: "expired" };
  return { ok: true };
}
