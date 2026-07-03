/**
 * Hive account-name validation.
 *
 * Hive rules: 3–16 characters, one or more dot-separated segments; each segment
 * starts with a lowercase letter, contains only lowercase letters, digits and
 * single hyphens, and does not start or end with a hyphen. The overall length
 * (including dots) must be 3–16 to fit the `account.hive_account` column.
 */

const SEGMENT = /^[a-z][a-z0-9-]*[a-z0-9]$|^[a-z]$/;

export function isValidHiveAccountName(name: string): boolean {
  if (typeof name !== "string") return false;
  if (name.length < 3 || name.length > 16) return false;

  const segments = name.split(".");
  for (const segment of segments) {
    if (!SEGMENT.test(segment)) return false;
    if (segment.includes("--")) return false;
  }
  return true;
}
