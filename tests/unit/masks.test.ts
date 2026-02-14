import { describe, it, expect } from "vitest";
import {
  shouldMaskContactDetails,
  maskPhoneNumber,
  maskEmail,
} from "@/lib/chat/masks";

describe("shouldMaskContactDetails", () => {
  it("returns true when there is no project deposit (hasProjectDeposit = false)", () => {
    expect(shouldMaskContactDetails(false)).toBe(true);
  });

  it("returns false when deposit is funded (hasProjectDeposit = true)", () => {
    expect(shouldMaskContactDetails(true)).toBe(false);
  });
});

describe("maskPhoneNumber", () => {
  it("masks the middle digits of a phone number, keeping first 2 and last 2", () => {
    // "555-123-4567" has 12 chars, keeps first 2 ("55") and last 2 ("67"), masks 8 in between
    const result = maskPhoneNumber("555-123-4567");
    expect(result).toBe("55********67");
  });

  it("masks a 10-digit phone number without separators", () => {
    // "5551234567" has 10 chars, keeps first 2 ("55") and last 2 ("67"), masks 6 in between
    const result = maskPhoneNumber("5551234567");
    expect(result).toBe("55******67");
  });

  it("returns **** for very short strings (4 chars or fewer)", () => {
    expect(maskPhoneNumber("1234")).toBe("****");
    expect(maskPhoneNumber("12")).toBe("****");
    expect(maskPhoneNumber("1")).toBe("****");
  });

  it("handles a 5-character input by keeping first 2 and last 2", () => {
    // "12345" -> "12" + "*" + "45"
    const result = maskPhoneNumber("12345");
    expect(result).toBe("12*45");
  });

  it("masks a phone number with country code prefix", () => {
    const result = maskPhoneNumber("+1-555-123-4567");
    expect(result).toBe("+1***********67");
  });
});

describe("maskEmail", () => {
  it("masks an email keeping first char of local part and full domain", () => {
    const result = maskEmail("john@gmail.com");
    expect(result).toBe("j***@gmail.com");
  });

  it("masks another email correctly", () => {
    const result = maskEmail("alice@company.co");
    expect(result).toBe("a***@company.co");
  });

  it("handles single-char local part", () => {
    const result = maskEmail("a@test.com");
    expect(result).toBe("a***@test.com");
  });

  it("returns ***@*** for an email without a domain (no @ sign)", () => {
    const result = maskEmail("invalid-email");
    expect(result).toBe("***@***");
  });

  it("preserves the full domain including subdomains", () => {
    const result = maskEmail("user@mail.example.co.uk");
    expect(result).toBe("u***@mail.example.co.uk");
  });
});
