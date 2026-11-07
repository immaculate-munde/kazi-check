import type { EvidenceItem, RiskBand, Verdict, CheckDirection } from "@/lib/types";

export function scoreToRiskBand(riskScore: number, evidenceCount: number): RiskBand {
  if (evidenceCount === 0 && riskScore < 15) return "INSUFFICIENT_INFORMATION";
  if (riskScore <= 24) return "LOW";
  if (riskScore <= 49) return "MODERATE";
  if (riskScore <= 74) return "SUSPICIOUS";
  return "HIGH";
}

export function recommendedAction(band: RiskBand): string {
  switch (band) {
    case "LOW":
      return "Proceed cautiously. Absence of red flags is not proof of legitimacy.";
    case "MODERATE":
      return "Investigate unresolved details before applying or sharing documents.";
    case "SUSPICIOUS":
      return "Avoid payment and sensitive disclosures. Consider flagging this recruiter.";
    case "HIGH":
      return "Strong warning. Do not proceed until independently verified.";
    case "INSUFFICIENT_INFORMATION":
      return "Not enough evidence yet. Add more advert text, a URL, or contact details.";
  }
}

/** Convert 0-1 engine score + evidence into 0-100 risk score. */
export function toRiskScore(score01: number, evidence: EvidenceItem[]): number {
  let points = Math.round(score01 * 100);
  for (const e of evidence) {
    if (e.severity === "high") points = Math.max(points, points);
  }
  return Math.max(0, Math.min(100, points));
}

export function verdictFromBand(
  direction: CheckDirection,
  band: RiskBand,
): Verdict {
  if (direction === "applicant") {
    if (band === "HIGH") return "HIGH_RISK";
    if (band === "SUSPICIOUS" || band === "MODERATE") return "SUSPICIOUS";
    return "CREDIBLE";
  }
  if (direction === "offer_letter") {
    if (band === "HIGH") return "DO_NOT_PROCEED";
    if (band === "SUSPICIOUS" || band === "MODERATE") return "CAUTION";
    return "PROCEED";
  }
  if (band === "HIGH") return "SCAM";
  if (band === "SUSPICIOUS" || band === "MODERATE") return "SUSPICIOUS";
  return "SAFE";
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
