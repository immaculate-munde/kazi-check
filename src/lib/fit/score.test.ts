import { describe, expect, it } from "vitest";
import { canPrepareForCheck, scoreFit } from "@/lib/fit/score";
import { emptyProfile } from "@/lib/profile/types";
import type { CheckRecord } from "@/lib/types";

function fakeCheck(over: Partial<CheckRecord> = {}): CheckRecord {
  return {
    id: "c1",
    direction: "job_offer",
    rawText:
      "Safaricom Customer Care Agent. Need Excel, call centre, Kiswahili and English. Nairobi.",
    verdict: "UNSURE",
    score: 0.4,
    riskScore: 40,
    riskBand: "MODERATE",
    recommendedAction: "Confirm on careers site",
    extracted: {
      jobTitle: "Customer Care Agent",
      emails: [],
      phones: [],
      urls: [],
      rawSignals: [],
    },
    evidence: [],
    findings: [],
    subjects: [],
    gaps: [],
    confirmYourself: [],
    createdAt: new Date().toISOString(),
    ...over,
  };
}

describe("scoreFit", () => {
  it("blocks prepare for scam / high risk", () => {
    expect(canPrepareForCheck(fakeCheck({ verdict: "SCAM" }))).toBe(false);
    expect(canPrepareForCheck(fakeCheck({ verdict: "HIGH_RISK" }))).toBe(false);
    expect(canPrepareForCheck(fakeCheck({ verdict: "CAUTION" }))).toBe(true);
  });

  it("scores higher when skills overlap", () => {
    const weak = emptyProfile();
    weak.fullName = "Amina Otieno";
    weak.skills = ["cooking"];

    const strong = emptyProfile();
    strong.fullName = "Amina Otieno";
    strong.headline = "Customer care agent";
    strong.skills = ["Excel", "call centre", "Kiswahili", "English"];
    strong.experience = [
      {
        title: "Customer Care Agent",
        company: "Retail Co",
        bullets: ["Handled calls in English and Kiswahili"],
      },
    ];

    const check = fakeCheck();
    const a = scoreFit(weak, check);
    const b = scoreFit(strong, check);
    expect(b.score).toBeGreaterThan(a.score);
    expect(b.matchBullets.length).toBeGreaterThan(0);
    expect(b.roleTitle).toContain("Customer");
  });
});
