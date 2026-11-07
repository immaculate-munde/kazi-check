import { describe, expect, it } from "vitest";
import { runRules } from "@/lib/rules";

describe("runRules job_offer", () => {
  it("flags pay-to-apply and impersonation domain", () => {
    const result = runRules(
      "job_offer",
      {
        domain: "kencareers-apply.com",
        salary: null,
        contactMethod: "email",
        paymentTerms: "interview fee",
        claimedOrg: "KenGen",
        emails: ["hr@gmail.com"],
        phones: [],
        urls: ["kencareers-apply.com"],
        rawSignals: ["free_email"],
      },
      12,
      "Pay interview fee via M-Pesa before joining KenGen",
    );

    expect(result.verdict).toBe("SCAM");
    expect(result.evidence.some((e) => e.ruleId === "pay_to_apply")).toBe(true);
    expect(result.evidence.some((e) => e.ruleId === "impersonation")).toBe(true);
    expect(result.evidence.some((e) => e.ruleId === "community_flags")).toBe(true);
  });
});

describe("runRules applicant", () => {
  it("flags free email vs claimed employer", () => {
    const result = runRules(
      "applicant",
      {
        claimedEmployer: "Safaricom",
        claimedEducation: null,
        emails: ["ceo.safaricom.hr@gmail.com"],
        phones: [],
        links: [],
        feeAsks: ["background fee"],
        rawSignals: [],
      },
      0,
      "I work at Safaricom please pay background fee",
    );

    expect(result.verdict).toBe("HIGH_RISK");
    expect(result.evidence.some((e) => e.ruleId === "free_email_employer")).toBe(
      true,
    );
  });
});
