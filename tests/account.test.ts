import { describe, expect, it } from "vitest";
import { isValidHiveAccountName } from "../src/lib/hive/account";

describe("isValidHiveAccountName", () => {
  it.each(["abc", "ksuen-cashier", "ksuen-abcdefgh", "good-1", "a.b.c", "hive.io"])(
    "accepts %j",
    (name) => {
      expect(isValidHiveAccountName(name)).toBe(true);
    },
  );

  it.each([
    "ab", // too short
    "this-name-is-too-long", // > 16 chars
    "-lead", // starts with hyphen
    "trail-", // ends with hyphen
    "UPPER", // uppercase not allowed
    "1abc", // starts with a digit
    "has space", // space not allowed
    "double--hyphen", // consecutive hyphens
    ".dotstart",
  ])("rejects %j", (name) => {
    expect(isValidHiveAccountName(name)).toBe(false);
  });
});
