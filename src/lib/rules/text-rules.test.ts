import { describe, expect, it } from "vitest";
import {
  detectPaymentRequest,
  detectSensitiveRequest,
  detectUnrealisticSalary,
  detectUrgency,
} from "@/lib/rules/text-rules";

const KDF =
  "Congratulations, you have been shortlisted for KDF recruitment. Pay KSh 3,500 processing fee via M-Pesa to secure your slot before Friday.";

describe("text-rules from kazicheck", () => {
  it("flags the KDF processing-fee sample for payment and urgency", () => {
    const payment = detectPaymentRequest(KDF);
    const urgency = detectUrgency(KDF);
    expect(payment.matched).toBe(true);
    expect(payment.snippets.join(" ")).toMatch(/processing fee|m-?pesa|secure your slot/i);
    expect(urgency.matched).toBe(true);
    expect(urgency.snippets.join(" ")).toMatch(/shortlisted/i);
  });

  it("does not treat a clean portal ad as a fee or PIN ask", () => {
    const text =
      "Safaricom PLC careers update: roles are posted only on https://www.safaricom.co.ke/careers. Never pay to apply. Create a profile on the portal.";
    expect(detectPaymentRequest(text).matched).toBe(false);
    expect(detectSensitiveRequest(text).matched).toBe(false);
    expect(detectUrgency(text).matched).toBe(false);
    expect(detectUnrealisticSalary(text).matched).toBe(false);
  });
});
