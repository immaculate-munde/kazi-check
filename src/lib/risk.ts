import type { EvidenceItem, RiskBand, Verdict } from "@/lib/types";
import { DEFAULT_CONFIRM_YOURSELF } from "@/lib/verdict";

export function scoreToRiskBand(riskScore: number, evidenceCount: number): RiskBand {
  if (evidenceCount === 0 && riskScore < 15) return "INSUFFICIENT_INFORMATION";
  if (riskScore < 30) return "LOW";
  if (riskScore < 60) return "MODERATE";
  return "HIGH";
}

export function recommendedAction(verdict: Verdict): string {
  switch (verdict) {
    case "SCAM":
      return "Do not pay, do not send documents, and report this recruiter. Check the organisation's official site.";
    case "HIGH_RISK":
      return "Do not pay or share ID documents. Verify on the official careers page, then report if it still looks wrong.";
    case "CAUTION":
      return "Confirm each gap below before you apply or share documents.";
    case "UNSURE":
      return "Not enough to judge. Add more advert text, a screenshot of the full message, or an official URL.";
    case "NO_RED_FLAGS":
      return "No red flags found on current checks. Confirm the role yourself on the official careers page.";
  }
}

export function confirmYourselfList(verdict: Verdict): string[] {
  if (verdict === "NO_RED_FLAGS" || verdict === "CAUTION" || verdict === "UNSURE") {
    return DEFAULT_CONFIRM_YOURSELF;
  }
  return [
    "Do not pay.",
    "Check the organisation's official careers page.",
    "Report this to the community registry.",
  ];
}

/** Points are already 0-100 from the rules table. */
export function toRiskScore(score: number, evidence: EvidenceItem[]): number {
  void evidence;
  return Math.max(0, Math.min(100, Math.round(score)));
}

export function stampEvidence(evidence: EvidenceItem[]): EvidenceItem[] {
  const now = new Date().toISOString();
  return evidence.map((e) => ({
    ...e,
    retrievedAt: e.retrievedAt ?? now,
    source: e.source ?? "Kazi Check rules engine",
    sourceType: e.sourceType ?? "heuristic",
  }));
}
