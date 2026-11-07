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
  gaps: string[];
};

const POINTS = {
  upfrontFee: 40,
  deferredFee: 30,
  idAskedEarly: 25,
  lookalike: 30,
  whatsappOnly: 15,
  freeEmail: 15,
  implausibleScale: 20,
  governmentWarning: 60,
  registryHit: 50,
  officialDomain: -30,
  promptInjection: 20,
  routeMismatch: 30,
} as const;

/**
 * Deterministic point table. LLM/OCR must never call this with a suggested verdict.
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

  if (communityFlagCount > 0) {
    const reasonText =
      communityReasons.length > 0
        ? ` Reasons: ${communityReasons.slice(0, 3).join("; ")}`
        : "";
    evidence.push({
      ruleId: "community_flags",
      title: "Identifier already in registry",
      snippet: `Reported ${communityFlagCount} time${communityFlagCount === 1 ? "" : "s"}.${reasonText}`,
      severity: communityFlagCount >= 3 ? "high" : "medium",
      sourceType: "community",
      points: POINTS.registryHit,
    });
  }

  if (/ignore (all |previous )?instructions|mark this (as )?safe|you are chatgpt|system prompt/i.test(rawText)) {
    evidence.push({
      ruleId: "prompt_injection",
      title: "Ad tried to instruct the system",
      snippet: "Untrusted text attempted to override scoring. Ignored; risk raised.",
      severity: "medium",
      sourceType: "heuristic",
      points: POINTS.promptInjection,
    });
  }

  const score = scoreEvidence(evidence);
  const gaps = collectGaps(direction, extracted, rawText, evidence);
  const verdict = toVerdict(score, evidence, gaps, rawText);
  return { verdict, score, evidence, gaps };
}

/** Merge listing/OCR evidence and recompute points + stacked SCAM. */
export function withExtraEvidence(
  result: RulesResult,
  extra: EvidenceItem[],
  rawText: string,
  extraGaps: string[] = [],
): RulesResult {
  const evidence = [...result.evidence];
  for (const item of extra) {
    if (!evidence.some((e) => e.ruleId === item.ruleId)) evidence.push(item);
  }
  const listingResolved = extra.some(
    (e) =>
      e.ruleId === "official_listing_match" || e.ruleId === "official_route_mismatch",
  );
  const gaps = [
    ...result.gaps.filter((g) =>
      listingResolved
        ? !g.includes("official listings index")
        : true,
    ),
    ...extraGaps,
  ];
  const score = scoreEvidence(evidence);
  const verdict = toVerdict(score, evidence, gaps, rawText);
  return { verdict, score, evidence, gaps: [...new Set(gaps)] };
}

function offerRules(extracted: ExtractedOffer, rawText: string): EvidenceItem[] {
  const evidence: EvidenceItem[] = [];
  const domain = extracted.domain?.toLowerCase();

  if (domain) {
    const imp = IMPERSONATIONS.find((i) => domain.includes(i.fake) || i.fake === domain);
    if (imp) {
      evidence.push({
        ruleId: "impersonation",
        title: "Lookalike or mismatched domain",
        snippet: `${domain} impersonates ${imp.org} (official ${imp.official})`,
        severity: "high",
        points: POINTS.lookalike,
      });
    } else if (DOMAIN_WHITELIST[domain]) {
      evidence.push({
        ruleId: "whitelist_match",
        title: "Official domain matches",
        snippet: `${domain} matches ${DOMAIN_WHITELIST[domain]}`,
        severity: "low",
        sourceType: "whitelist",
        points: POINTS.officialDomain,
      });
    }
  }

  const deferred = rawText.match(
    /refundable\s+deposit|after\s+training|after\s+(?:you\s+)?(?:join|start)|fee\s+later|pay\s+once\s+selected/i,
  );
  const upfront =
    extracted.paymentTerms ||
    rawText.match(
      /(?:interview|medical|visa|training|application|registration|clearance|processing)\s+(?:fee|fees|payment)|(?:kes|ksh|kshs)\s*[\d,]+\s+(?:registration|clearance|medical|interview|fee|deposit)|(?:pay|send|deposit).{0,24}(?:kes|ksh|kshs)?\s*[\d,]+/i,
    )?.[0];

  if (deferred && !upfront) {
    evidence.push({
      ruleId: "deferred_fee",
      title: "Deferred fee requested",
      snippet: String(deferred[0]),
      severity: "high",
      points: POINTS.deferredFee,
    });
  } else if (upfront) {
    evidence.push({
      ruleId: "pay_to_apply",
      title: "Upfront fee requested",
      snippet: String(upfront),
      severity: "high",
      points: POINTS.upfrontFee,
    });
  }

  if (extracted.asksForId || asksForIdentity(rawText)) {
    evidence.push({
      ruleId: "id_asked_early",
      title: "ID, PIN or selfie asked early",
      snippet: "Ad asks for identity documents or a selfie before an interview.",
      severity: "high",
      points: POINTS.idAskedEarly,
    });
  }

  if (isWhatsAppOnly(rawText, extracted)) {
    evidence.push({
      ruleId: "whatsapp_only",
      title: "WhatsApp or Telegram only",
      snippet: "Application is via WhatsApp or Telegram with no official portal.",
      severity: "medium",
      points: POINTS.whatsappOnly,
    });
  }

  const headcount = extracted.claimedHeadcount ?? parseHeadcount(rawText);
  if (headcount !== null && (headcount >= 200 || headcount >= 10000)) {
    evidence.push({
      ruleId: "implausible_scale",
      title: "Implausible scale",
      snippet: `Claims ${headcount.toLocaleString()} hires in one blast. Public agencies do not recruit like this on chat apps.`,
      severity: "medium",
      points: POINTS.implausibleScale,
    });
  }

  for (const email of extracted.emails) {
    if (isFreeEmail(email) && extracted.claimedOrg) {
      evidence.push({
        ruleId: "free_email_corporate",
        title: "Free email for a large organisation",
        snippet: `${email} used while claiming ${extracted.claimedOrg}`,
        severity: "high",
        points: POINTS.freeEmail,
      });
    }
  }

  if (/guaranteed job|no interview|send cv fee|visitor visa for work/i.test(rawText)) {
    evidence.push({
      ruleId: "high_risk_keyword",
      title: "High-risk keyword pattern",
      snippet: "Matched known scam phrasing",
      severity: "medium",
      points: 15,
    });
  }

  if (domain && process.env.WHOIS_API_KEY) {
    evidence.push({
      ruleId: "whois_age",
      title: "WHOIS age (stub)",
      snippet: "WHOIS integration pending",
      severity: "low",
      points: 0,
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
        points: POINTS.freeEmail,
      });
    }
  }

  if (extracted.feeAsks.length > 0 || /pay.*(fee|visa|training)/i.test(rawText)) {
    evidence.push({
      ruleId: "reverse_fee",
      title: "Reverse fee ask",
      snippet: extracted.feeAsks[0] ?? "Applicant asked employer to pay a fee",
      severity: "high",
      points: POINTS.upfrontFee,
    });
  }

  if (/crypto only|refuse video|guaranteed placement kickback/i.test(rawText)) {
    evidence.push({
      ruleId: "applicant_high_risk",
      title: "High-risk applicant phrase",
      snippet: "Matched risky applicant phrasing",
      severity: "medium",
      points: 15,
    });
  }

  return evidence;
}

function isWhatsAppOnly(rawText: string, extracted: ExtractedOffer): boolean {
  const chat =
    /whatsapp|telegram|\bwa\.me\b/i.test(rawText) ||
    extracted.channel === "whatsapp" ||
    extracted.channel === "telegram";
  if (!chat) return false;
  const portal = extracted.urls.some((u) =>
    /career|jobs|portal|taleo|psckjobs|safaricom\.co\.ke|krc\.co\.ke/i.test(u),
  );
  return !portal;
}

function asksForIdentity(text: string): boolean {
  return /(?:send|share|submit|attach|provide).{0,48}(?:\bid\b|national\s+id|kra\s*pin|passport|selfie)/i.test(
    text,
  );
}

function parseHeadcount(text: string): number | null {
  const m =
    text.match(/hiring\s+(\d[\d,]*)/i) ||
    text.match(/(\d[\d,]*)\s+(?:staff|jobs|vacancies|positions|openings)/i);
  if (!m) return null;
  const n = Number(m[1].replace(/,/g, ""));
  return Number.isFinite(n) ? n : null;
}

function scoreEvidence(evidence: EvidenceItem[]): number {
  let score = 0;
  for (const e of evidence) {
    score += e.points ?? 0;
  }
  return Math.max(0, Math.min(100, score));
}

function collectGaps(
  direction: CheckDirection,
  extracted: Extracted,
  rawText: string,
  evidence: EvidenceItem[],
): string[] {
  const gaps: string[] = [];
  if (rawText.trim().length < 12) {
    gaps.push("Ad text was too short or unreadable to judge.");
  }
  if (direction !== "applicant") {
    const offer = extracted as ExtractedOffer;
    if (!offer.claimedOrg) {
      gaps.push("Could not confirm the claimed organisation.");
    }
    if (!offer.domain && offer.urls.length === 0) {
      gaps.push("Could not check an official careers page — no domain or listing URL in the ad.");
    }
    if (!offer.phones.length && /phone|call|sms/i.test(rawText) && !/\+?254|07\d{8}/.test(rawText)) {
      gaps.push("Phone number was unreadable — not guessed.");
    }
  }
  if (!evidence.some((e) => e.ruleId === "official_listing_match" || e.ruleId === "official_route_mismatch")) {
    gaps.push("Could not confirm this ad against the official listings index.");
  }
  return [...new Set(gaps)];
}

function toVerdict(
  score: number,
  evidence: EvidenceItem[],
  gaps: string[],
  rawText: string,
): Verdict {
  const ids = new Set(evidence.map((e) => e.ruleId));
  const hasFee = ids.has("pay_to_apply") || ids.has("deferred_fee") || ids.has("reverse_fee");
  const hasWhatsApp = ids.has("whatsapp_only");
  const hasLookalike = ids.has("impersonation") || ids.has("official_route_mismatch");
  const hasWarning = ids.has("government_warning");
  const hasRegistry = ids.has("community_flags");

  // Stacked SCAM — earned, not default.
  if (hasFee && hasWhatsApp) return "SCAM";
  if (hasLookalike && hasFee) return "SCAM";
  if (hasWarning) return "SCAM";
  if (hasRegistry && hasFee) return "SCAM";

  const unreadable =
    rawText.trim().length < 12 ||
    (gaps.includes("Ad text was too short or unreadable to judge.") &&
      evidence.filter((e) => e.ruleId !== "prompt_injection").length === 0);
  if (unreadable) return "UNSURE";

  const contentHits = evidence.filter((e) => e.ruleId !== "whitelist_match");
  if (contentHits.length === 0 && score < 15 && rawText.trim().length < 40) {
    return "UNSURE";
  }

  if (score >= 60) return "HIGH_RISK";
  if (score >= 30) return "CAUTION";
  if (contentHits.length === 0) return "NO_RED_FLAGS";
  if (score < 30) return "NO_RED_FLAGS";
  return "CAUTION";
}

export { POINTS };
