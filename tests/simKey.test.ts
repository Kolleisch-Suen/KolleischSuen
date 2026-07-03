import { describe, expect, it } from "vitest";
import {
  SIM_KEY_PREFIX,
  generateSimAccountName,
  generateSimActiveKey,
} from "../src/lib/hive/simKey";
import { isValidHiveAccountName } from "../src/lib/hive/account";

describe("generateSimActiveKey", () => {
  it("is prefixed so it can never be mistaken for a real WIF key", () => {
    const key = generateSimActiveKey();
    expect(key.startsWith(SIM_KEY_PREFIX)).toBe(true);
    expect(key).toMatch(/^SIM-[0-9a-f]{48}$/);
  });

  it("is unique across calls", () => {
    const set = new Set(Array.from({ length: 100 }, () => generateSimActiveKey()));
    expect(set.size).toBe(100);
  });
});

describe("generateSimAccountName", () => {
  it("always produces a valid, <=16-char Hive account name", () => {
    for (let i = 0; i < 200; i++) {
      const name = generateSimAccountName();
      expect(name.length).toBeLessThanOrEqual(16);
      expect(isValidHiveAccountName(name)).toBe(true);
      expect(name.startsWith("ksuen-")).toBe(true);
    }
  });
});
