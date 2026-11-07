import type {
  CheckDirection,
  EvidenceItem,
  Extracted,
  ExtractedApplicant,
  ExtractedOffer,
  Verdict,
} from "@/lib/types";
import { isFreeEmail } from "@/lib/subjects/normalize";
import { DOMAIN_WHITELIST, IMPERSONATIONS } from "@/lib/rules/whitelist";

export type RulesResult = {
  verdict: Verdict;
  score: number;
  evidence: EvidenceItem[];
};

/**
 * Deterministic rules engine scaffold.
 * BE-2: deepen WHOIS, thresholds, and Vitest coverage.
 */
export function runRules(
  direction: CheckDirection,
  extracted: Extracted,
  communityFlagCount = 0,
  rawText = "",
  communityReasons: string[] = [],
): RulesResult {
  const evidence: EvidenceItem[] =
    direction === "applicant"
      ? applicantRules(extracted as ExtractedApplicant, rawText)
      : offerRules(extracted as ExtractedOffer, rawText);

  if (communityFlagCount >= 3) {
    const reasonText =
      communityReasons.length > 0
        ? ` Reasons: ${communityReasons.slice(0, 3).join("; ")}`
        : "";
    evidence.push({
      ruleId: "community_flags",
      title: "Community flags",
      snippet: `${communityFlagCount} people flagged related subjects as scam.${reasonText}`,
      severity: communityFlagCount >= 10 ? "high" : "medium",
      sourceType: "community",
    });
  }

  const score = scoreEvidence(evidence);
  const verdict = toVerdict(direction, score, evidence);
  return { verdict, score, evidence };
}

function offerRules(extracted: ExtractedOffer, rawText: string): EvidenceItem[] {
  const evidence: EvidenceItem[] = [];
  const domain = extracted.domain?.toLowerCase();

  if (domain) {
    const imp = IMPERSONATIONS.find((i) => domain.includes(i.fake) || i.fake === domain);
    if (imp) {
      evidence.push({
        ruleId: "impersonation",
        title: "Lookalike / impersonation domain",
        snippet: `${domain} impersonates ${imp.org} (official ${imp.official})`,
        severity: "high",
      });
    } else if (DOMAIN_WHITELIST[domain]) {
      evidence.push({
        ruleId: "whitelist_match",
        title: "Official domain whitelist",
        snippet: `${domain} matches ${DOMAIN_WHITELIST[domain]}`,
        severity: "low",
      });
    }
  }

  const fee =
    extracted.paymentTerms ||
    rawText.match(
      /(?:interview|medical|visa|training|application)\s+(?:fee|fees|payment)/i,
    )?.[0];
  if (fee) {
    evidence.push({
      ruleId: "pay_to_apply",
      title: "Pay-to-apply language",
      snippet: String(fee),
      severity: "high",
    });
  }

  for (const email of extracted.emails) {
    if (isFreeEmail(email) && extracted.claimedOrg) {
      evidence.push({
        ruleId: "free_email_corporate",
        title: "Free email vs corporate claim",
        snippet: `${email} used while claiming ${extracted.claimedOrg}`,
        severity: "high",
      });
    }
  }

  if (/guaranteed job|no interview|send cv fee/i.test(rawText)) {
    evidence.push({
      ruleId: "high_risk_keyword",
      title: "High-risk keyword pattern",
      snippet: "Matched known scam phrasing",
      severity: "medium",
    });
  }

  // WHOIS stub; always skip unless BE wires API
  if (domain && process.env.WHOIS_API_KEY) {
    evidence.push({
      ruleId: "whois_age",
      title: "WHOIS age (stub)",
      snippet: "WHOIS integration pending",
      severity: "low",
    });
  }

  return evidence;
}

function applicantRules(
  extracted: ExtractedApplicant,
  rawText: string,
): EvidenceItem[] {
  const evidence: EvidenceItem[] = [];

  for (const email of extracted.emails) {
    if (isFreeEmail(email) && extracted.claimedEmployer) {
      evidence.push({
        ruleId: "free_email_employer",
        title: "Free email vs claimed employer",
        snippet: `${email} while claiming ${extracted.claimedEmployer}`,
        severity: "high",
      });
    }
  }

  if (extracted.feeAsks.length > 0 || /pay.*(fee|visa|training)/i.test(rawText)) {
    evidence.push({
      ruleId: "reverse_fee",
      title: "Reverse fee ask",
      snippet: extracted.feeAsks[0] ?? "Applicant asked employer to pay a fee",
      severity: "high",
    });
  }

  if (/crypto only|refuse video|guaranteed placement kickback/i.test(rawText)) {
    evidence.push({
      ruleId: "applicant_high_risk",
      title: "High-risk applicant phrase",
      snippet: "Matched risky applicant phrasing",
      severity: "medium",
    });
  }

  return evidence;
}

function scoreEvidence(evidence: EvidenceItem[]): number {
  let score = 0;
  for (const e of evidence) {
    if (e.ruleId === "whitelist_match") {
      score -= 0.3;
      continue;
    }
    if (e.severity === "high") score += 0.35;
    else if (e.severity === "medium") score += 0.2;
    else score += 0.05;
  }
  return Math.max(0, Math.min(1, score));
}

function toVerdict(
  direction: CheckDirection,
  score: number,
  evidence: EvidenceItem[],
): Verdict {
  const hasHigh = evidence.some((e) => e.severity === "high");
  if (direction === "applicant") {
    if (score >= 0.55 || (hasHigh && score >= 0.35)) return "HIGH_RISK";
    if (score >= 0.25) return "SUSPICIOUS";
    return "CREDIBLE";
  }
  if (score >= 0.55 || (hasHigh && score >= 0.35)) return "SCAM";
  if (score >= 0.25) return "SUSPICIOUS";
  return "SAFE";
}
