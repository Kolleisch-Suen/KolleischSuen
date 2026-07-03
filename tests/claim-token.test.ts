import { describe, expect, it } from "vitest";
import {
  computeExpiry,
  evaluateClaim,
  generateClaimSecret,
  isConsumed,
  isExpired,
} from "../src/lib/claim/token";

describe("generateClaimSecret", () => {
  it("produces a 64-char hex string", () => {
    const secret = generateClaimSecret();
    expect(secret).toMatch(/^[0-9a-f]{64}$/);
  });

  it("is unique across calls", () => {
    const set = new Set(Array.from({ length: 100 }, () => generateClaimSecret()));
    expect(set.size).toBe(100);
  });
});

describe("computeExpiry / isExpired", () => {
  const now = new Date("2026-07-03T12:00:00.000Z");

  it("adds the TTL in seconds", () => {
    expect(computeExpiry(now, 300).toISOString()).toBe(
      "2026-07-03T12:05:00.000Z",
    );
  });

  it("is not expired before the deadline", () => {
    const exp = computeExpiry(now, 300);
    expect(isExpired(exp, new Date("2026-07-03T12:04:59.000Z"))).toBe(false);
  });

  it("is expired exactly at the deadline", () => {
    const exp = computeExpiry(now, 300);
    expect(isExpired(exp, new Date("2026-07-03T12:05:00.000Z"))).toBe(true);
  });
});

describe("isConsumed", () => {
  it("is false for null/undefined", () => {
    expect(isConsumed(null)).toBe(false);
    expect(isConsumed(undefined)).toBe(false);
  });

  it("is true once a used timestamp exists", () => {
    expect(isConsumed(new Date())).toBe(true);
  });
});

describe("evaluateClaim", () => {
  const now = new Date("2026-07-03T12:00:00.000Z");
  const future = new Date("2026-07-03T12:05:00.000Z");
  const past = new Date("2026-07-03T11:55:00.000Z");

  it("allows a fresh, unexpired token", () => {
    expect(evaluateClaim({ usedAt: null, expiresAt: future, now })).toEqual({
      ok: true,
    });
  });

  it("rejects an already-used token (used takes priority)", () => {
    expect(
      evaluateClaim({ usedAt: past, expiresAt: past, now }),
    ).toEqual({ ok: false, reason: "used" });
  });

  it("rejects an expired token", () => {
    expect(evaluateClaim({ usedAt: null, expiresAt: past, now })).toEqual({
      ok: false,
      reason: "expired",
    });
  });
});
