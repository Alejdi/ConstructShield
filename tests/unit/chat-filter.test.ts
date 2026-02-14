import { describe, it, expect } from "vitest";
import { filterMessage } from "@/lib/chat/filter";

describe("filterMessage", () => {
  describe("plain text", () => {
    it("passes through unflagged when no violations are present", () => {
      const result = filterMessage("Hello, how are you doing today?");
      expect(result.isFlagged).toBe(false);
      expect(result.flagReason).toBeNull();
      expect(result.filteredContent).toBe("Hello, how are you doing today?");
    });

    it("passes through a normal project-related message", () => {
      const result = filterMessage(
        "The foundation work should be completed by Friday."
      );
      expect(result.isFlagged).toBe(false);
      expect(result.flagReason).toBeNull();
      expect(result.filteredContent).toBe(
        "The foundation work should be completed by Friday."
      );
    });
  });

  describe("phone number detection", () => {
    it("detects and flags a phone number like 555-123-4567", () => {
      const result = filterMessage("call me at 555-123-4567");
      expect(result.isFlagged).toBe(true);
      expect(result.flagReason).toContain("phone_number");
      expect(result.filteredContent).toContain("[PHONE REMOVED]");
      expect(result.filteredContent).not.toContain("555-123-4567");
    });

    it("detects phone numbers with dots as separators", () => {
      const result = filterMessage("reach me at 555.123.4567");
      expect(result.isFlagged).toBe(true);
      expect(result.flagReason).toContain("phone_number");
      expect(result.filteredContent).toContain("[PHONE REMOVED]");
    });

    it("detects phone numbers with parentheses", () => {
      const result = filterMessage("my number is (555) 123-4567");
      expect(result.isFlagged).toBe(true);
      expect(result.flagReason).toContain("phone_number");
    });
  });

  describe("email detection", () => {
    it("detects and flags an email address", () => {
      const result = filterMessage("email me at john@gmail.com");
      expect(result.isFlagged).toBe(true);
      expect(result.flagReason).toContain("email");
      expect(result.filteredContent).toContain("[EMAIL REMOVED]");
      expect(result.filteredContent).not.toContain("john@gmail.com");
    });

    it("detects emails with subdomains", () => {
      const result = filterMessage("contact user@mail.company.co.uk");
      expect(result.isFlagged).toBe(true);
      expect(result.flagReason).toContain("email");
      expect(result.filteredContent).toContain("[EMAIL REMOVED]");
    });
  });

  describe("URL detection", () => {
    it("detects and flags an https URL", () => {
      const result = filterMessage("check out https://www.example.com");
      expect(result.isFlagged).toBe(true);
      expect(result.flagReason).toContain("url");
      expect(result.filteredContent).toContain("[LINK REMOVED]");
      expect(result.filteredContent).not.toContain("https://www.example.com");
    });

    it("detects and flags an http URL", () => {
      const result = filterMessage("visit http://example.com/page");
      expect(result.isFlagged).toBe(true);
      expect(result.flagReason).toContain("url");
      expect(result.filteredContent).toContain("[LINK REMOVED]");
    });
  });

  describe("payment/leakage keyword detection", () => {
    it("flags venmo keyword", () => {
      const result = filterMessage("pay me via venmo");
      expect(result.isFlagged).toBe(true);
      expect(result.flagReason).toContain("keyword:venmo");
    });

    it("flags zelle keyword", () => {
      const result = filterMessage("let's use zelle");
      expect(result.isFlagged).toBe(true);
      expect(result.flagReason).toContain("keyword:zelle");
    });

    it("flags cash keyword", () => {
      const result = filterMessage("send cash please");
      expect(result.isFlagged).toBe(true);
      expect(result.flagReason).toContain("keyword:cash");
    });

    it("flags whatsapp keyword", () => {
      const result = filterMessage("text me on whatsapp");
      expect(result.isFlagged).toBe(true);
      expect(result.flagReason).toContain("keyword:whatsapp");
    });

    it("flags keywords case-insensitively", () => {
      const result = filterMessage("Send it via VENMO");
      expect(result.isFlagged).toBe(true);
      expect(result.flagReason).toContain("keyword:venmo");
    });

    it("does not replace keyword text in filteredContent (only contact info is replaced)", () => {
      const result = filterMessage("pay me via venmo");
      expect(result.filteredContent).toBe("pay me via venmo");
    });
  });

  describe("obfuscated numbers", () => {
    it("detects numeric sequences even without dashes", () => {
      const result = filterMessage("call 5551234567");
      expect(result.isFlagged).toBe(true);
      expect(result.flagReason).toContain("phone_number");
      expect(result.filteredContent).toContain("[PHONE REMOVED]");
    });
  });

  describe("multiple violations in one message", () => {
    it("flags and replaces both phone number and email in the same message", () => {
      const result = filterMessage(
        "call me at 555-123-4567 or email john@gmail.com"
      );
      expect(result.isFlagged).toBe(true);
      expect(result.flagReason).toContain("phone_number");
      expect(result.flagReason).toContain("email");
      expect(result.filteredContent).toContain("[PHONE REMOVED]");
      expect(result.filteredContent).toContain("[EMAIL REMOVED]");
      expect(result.filteredContent).not.toContain("555-123-4567");
      expect(result.filteredContent).not.toContain("john@gmail.com");
    });

    it("flags phone number, email, and keyword together", () => {
      const result = filterMessage(
        "email john@gmail.com or call 555-123-4567, pay via venmo"
      );
      expect(result.isFlagged).toBe(true);
      expect(result.flagReason).toContain("phone_number");
      expect(result.flagReason).toContain("email");
      expect(result.flagReason).toContain("keyword:venmo");
    });

    it("comma-separates multiple flag reasons", () => {
      const result = filterMessage(
        "email john@gmail.com and visit https://site.com"
      );
      expect(result.isFlagged).toBe(true);
      // flagReason should contain both "email" and "url" separated by comma
      const reasons = result.flagReason!.split(",");
      expect(reasons.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe("filtered content masking", () => {
    it("replaces phone numbers with [PHONE REMOVED]", () => {
      const result = filterMessage("My number: 123-456-7890");
      expect(result.filteredContent).toContain("[PHONE REMOVED]");
      expect(result.filteredContent).not.toContain("123-456-7890");
    });

    it("replaces emails with [EMAIL REMOVED]", () => {
      const result = filterMessage("Write to test@example.com");
      expect(result.filteredContent).toBe("Write to [EMAIL REMOVED]");
    });

    it("replaces URLs with [LINK REMOVED]", () => {
      const result = filterMessage("Go to https://evil.com/steal");
      expect(result.filteredContent).toBe("Go to [LINK REMOVED]");
    });

    it("preserves surrounding text when masking", () => {
      const result = filterMessage(
        "Before john@test.com after"
      );
      expect(result.filteredContent).toBe("Before [EMAIL REMOVED] after");
    });
  });
});
