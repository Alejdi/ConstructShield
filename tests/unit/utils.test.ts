import { describe, it, expect } from "vitest";
import { formatCurrency, formatDate, cn } from "@/lib/utils";

describe("formatCurrency", () => {
  it("formats 10000 cents as 100,00 €", () => {
    expect(formatCurrency(10000)).toBe("100,00\u00a0€");
  });

  it("formats 0 cents as 0,00 €", () => {
    expect(formatCurrency(0)).toBe("0,00\u00a0€");
  });

  it("formats 99 cents as 0,99 €", () => {
    expect(formatCurrency(99)).toBe("0,99\u00a0€");
  });

  it("formats 1 cent as 0,01 €", () => {
    expect(formatCurrency(1)).toBe("0,01\u00a0€");
  });

  it("formats large amounts correctly", () => {
    expect(formatCurrency(1000000)).toBe("10.000,00\u00a0€");
  });

  it("formats 50 cents as 0,50 €", () => {
    expect(formatCurrency(50)).toBe("0,50\u00a0€");
  });

  it("formats 999 cents as 9,99 €", () => {
    expect(formatCurrency(999)).toBe("9,99\u00a0€");
  });
});

describe("formatDate", () => {
  it("formats a date string into short month, day, year", () => {
    const result = formatDate("2024-01-15");
    expect(result).toBe("Jan 15, 2024");
  });

  it("formats a Date object", () => {
    const result = formatDate(new Date("2024-12-25T00:00:00"));
    expect(result).toBe("Dec 25, 2024");
  });

  it("formats another date correctly", () => {
    const result = formatDate("2023-07-04");
    expect(result).toBe("Jul 4, 2023");
  });

  it("returns a string", () => {
    const result = formatDate("2024-06-01");
    expect(typeof result).toBe("string");
  });
});

describe("cn", () => {
  it("merges class names correctly", () => {
    const result = cn("px-4", "py-2");
    expect(result).toBe("px-4 py-2");
  });

  it("handles conditional class names", () => {
    const result = cn("base", false && "hidden", "visible");
    expect(result).toBe("base visible");
  });

  it("resolves conflicting tailwind classes by keeping the last one", () => {
    const result = cn("px-4", "px-2");
    expect(result).toBe("px-2");
  });

  it("handles undefined and null values", () => {
    const result = cn("foo", undefined, null, "bar");
    expect(result).toBe("foo bar");
  });

  it("returns empty string for no arguments", () => {
    const result = cn();
    expect(result).toBe("");
  });

  it("handles array inputs", () => {
    const result = cn(["px-4", "py-2"]);
    expect(result).toBe("px-4 py-2");
  });
});
