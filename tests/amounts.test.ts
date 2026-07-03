import { describe, expect, it } from "vitest";
import {
  eurosToKiss,
  formatEuros,
  formatKissAsEuros,
  kissToEuros,
  parseEuroAmount,
} from "../src/lib/payments/amounts";

describe("parseEuroAmount", () => {
  it("parses a plain integer", () => {
    const r = parseEuroAmount("20");
    expect(r).toEqual({ ok: true, euros: 20, cents: 2000, canonical: "20.00" });
  });

  it("parses two decimals", () => {
    const r = parseEuroAmount("20.50");
    expect(r.ok && r.cents).toBe(2050);
  });

  it("accepts a comma decimal separator", () => {
    const r = parseEuroAmount("20,50");
    expect(r.ok && r.canonical).toBe("20.50");
  });

  it("trims surrounding whitespace", () => {
    expect(parseEuroAmount("  5 ").ok).toBe(true);
  });

  it.each(["", "   ", "abc", "20.", "1.234", "-5", "0", "1e3", "20,5,0"])(
    "rejects invalid input %j",
    (input) => {
      expect(parseEuroAmount(input).ok).toBe(false);
    },
  );

  it("rejects amounts above the max", () => {
    expect(parseEuroAmount("1000.01").ok).toBe(false);
  });

  it("accepts exactly the max", () => {
    expect(parseEuroAmount("1000").ok).toBe(true);
  });
});

describe("conversion and formatting", () => {
  it("converts 1:1 between euros and KISS", () => {
    expect(eurosToKiss(20)).toBe(20);
    expect(kissToEuros(20)).toBe(20);
  });

  it("formats euros with two decimals and a symbol", () => {
    expect(formatEuros(20)).toBe("20.00 €");
    expect(formatEuros(7.5)).toBe("7.50 €");
  });

  it("formats a KISS quantity (number or string) as euros", () => {
    expect(formatKissAsEuros(20)).toBe("20.00 €");
    expect(formatKissAsEuros("13.00")).toBe("13.00 €");
  });
});
