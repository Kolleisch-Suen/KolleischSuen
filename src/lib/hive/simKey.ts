/**
 * Simulated Hive account name / active key generation for the v1 teaching build.
 *
 * IMPORTANT: these are NOT real Hive credentials. The active key is deliberately
 * prefixed with "SIM-" so it can never be confused with a real WIF key (which is
 * base58 and starts with 5/K/L). Do not wire these into any real broadcast path.
 */

import { randomBytes } from "node:crypto";
import { isValidHiveAccountName } from "./account";

export const SIM_KEY_PREFIX = "SIM-";

/** A "5Kxxx"-looking value must never appear; SIM- makes fakeness explicit. */
export function generateSimActiveKey(): string {
  return SIM_KEY_PREFIX + randomBytes(24).toString("hex");
}

/**
 * Generate a valid, pool-scoped Hive-style account name that fits the 16-char
 * column: "ksuen-" + 8 lowercase letters = 14 chars.
 */
export function generateSimAccountName(): string {
  const letters = "abcdefghijklmnopqrstuvwxyz";
  const bytes = randomBytes(8);
  let suffix = "";
  for (let i = 0; i < 8; i++) {
    suffix += letters[bytes[i] % letters.length];
  }
  const name = `ksuen-${suffix}`;
  // Defensive: the construction is always valid, but assert the invariant.
  if (!isValidHiveAccountName(name)) {
    throw new Error(`Generated invalid account name: ${name}`);
  }
  return name;
}
