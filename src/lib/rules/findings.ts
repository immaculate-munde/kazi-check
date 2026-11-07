import type {
  CheckDirection,
  EvidenceItem,
  Extracted,
  ExtractedApplicant,
  ExtractedOffer,
  Finding,
  FindingOutcome,
} from "@/lib/types";

const TEXT = "Kazi Check text rules";
const ORG = "Kazi Check organisation directory";
const COMMUNITY = "community registry";
const LISTING = "Kazi Check official listings";

function hit(evidence: EvidenceItem[], ruleId: string): EvidenceItem | undefined {
  return evidence.find((e) => e.ruleId === ruleId);
}

function row(
  checkKey: string,
  title: string,
  outcome: FindingOutcome,
  points: number,
  explanation: string,
  evidence: string | null,
  source: string,
): Finding {
  return {
    checkKey,
    title,
    outcome,
    points: outcome === "flagged" ? points : 0,
    explanation,
    evidence,
    source,
  };
}

export function findingsFromEvidence(
  direction: CheckDirection,
  extracted: Extracted,
  evidence: EvidenceItem[],
  communityFlagCount: number,
): Finding[] {
  if (direction === "applicant") {
    return applicantFindings(extracted as ExtractedApplicant, evidence, communityFlagCount);
  }
  return offerFindings(extracted as ExtractedOffer, evidence, communityFlagCount);
}

function offerFindings(
  extracted: ExtractedOffer,
  evidence: EvidenceItem[],
  communityFlagCount: number,
): Finding[] {
  const payment = hit(evidence, "pay_to_apply") ?? hit(evidence, "deferred_fee");
  const impersonation = hit(evidence, "impersonation");
  const whitelist = hit(evidence, "whitelist_match");
  const idAsked = hit(evidence, "id_asked_early");
  const chat = hit(evidence, "whatsapp_only");
  const scale = hit(evidence, "implausible_scale");
  const freeEmail = hit(evidence, "free_email_corporate");
  const community = hit(evidence, "community_flags");
  const injection = hit(evidence, "prompt_injection");
  const urgency = hit(evidence, "urgency");
  const salary = hit(evidence, "unrealistic_salary");
  const keyword = hit(evidence, "high_risk_keyword");

  let orgOutcome: FindingOutcome = "unknown";
  let orgTitle = "Organisation identity";
  let orgExplanation =
    "We could not match this advertisement to an organisation in our trusted directory, so impersonation could not be assessed.";
  let orgEvidence: string | null = null;
  let orgPoints = 30;
  if (impersonation) {
    orgOutcome = "flagged";
    orgTitle = impersonation.title;
    orgExplanation =
      "The message uses a lookalike or mismatched domain for a claimed organisation.";
    orgEvidence = impersonation.snippet;
    orgPoints = impersonation.points ?? orgPoints;
  } else if (whitelist) {
    orgOutcome = "passed";
    orgTitle = whitelist.title;
    orgExplanation =
      "Contact domain matches a verified organisation domain. This does not prove the recruiter is authorised.";
    orgEvidence = whitelist.snippet;
  } else if (!extracted.claimedOrg && !extracted.domain) {
    orgOutcome = "unknown";
  }

  const emailOutcome: FindingOutcome = freeEmail
    ? "flagged"
    : extracted.emails.length === 0
      ? "unknown"
      : "passed";

  const findings: Finding[] = [
    row(
      payment?.ruleId ?? "pay_to_apply",
      payment?.title ?? "Payment requested to secure employment",
      payment ? "flagged" : "passed",
      payment?.points ?? 40,
      payment
        ? "The message asks for money as a condition of recruitment. Legitimate employers in Kenya do not charge application, interview or processing fees."
        : "No request for an application, processing or similar fee was detected in the text.",
      payment?.snippet ?? null,
      TEXT,
    ),
    row(
      impersonation?.ruleId ?? whitelist?.ruleId ?? "impersonation",
      orgTitle,
      orgOutcome,
      orgPoints,
      orgExplanation,
      orgEvidence,
      ORG,
    ),
    row(
      "id_asked_early",
      "Request for sensitive information",
      idAsked ? "flagged" : "passed",
      idAsked?.points ?? 25,
      idAsked
        ? "The message requests PINs, passwords, one-time codes or identity documents early in the process."
        : "No request for PINs, passwords, OTPs or identity documents was detected.",
      idAsked?.snippet ?? null,
      TEXT,
    ),
    row(
      "whatsapp_only",
      "WhatsApp or Telegram only",
      chat ? "flagged" : "passed",
      chat?.points ?? 15,
      chat
        ? "Application is via WhatsApp or Telegram with no official portal."
        : "No WhatsApp-only or Telegram-only apply route was detected.",
      chat?.snippet ?? null,
      TEXT,
    ),
    row(
      "implausible_scale",
      "Implausible scale",
      scale ? "flagged" : "passed",
      scale?.points ?? 20,
      scale
        ? scale.snippet
        : "No implausible mass-hire claim was detected.",
      scale?.snippet ?? null,
      TEXT,
    ),
    row(
      "free_email_corporate",
      "Recruiter email domain",
      emailOutcome,
      freeEmail?.points ?? 15,
      freeEmail
        ? "The recruiter uses a free webmail address while claiming a large organisation."
        : emailOutcome === "unknown"
          ? "No recruiter email address was provided or found, so the sender domain could not be checked."
          : "No free-email-for-corporate mismatch was detected.",
      freeEmail?.snippet ?? (extracted.emails.join(", ") || null),
      ORG,
    ),
    row(
      "community_flags",
      "Match in the scam registry",
      community ? "flagged" : "passed",
      community?.points ?? 50,
      community
        ? `Identifier already reported ${communityFlagCount} time${communityFlagCount === 1 ? "" : "s"}.`
        : "No email, phone number or domain in this message matches a published registry record.",
      community?.snippet ?? null,
      COMMUNITY,
    ),
    row(
      "prompt_injection",
      "Ad tried to instruct the system",
      injection ? "flagged" : "passed",
      injection?.points ?? 20,
      injection
        ? "Untrusted text attempted to override scoring. Ignored; risk raised."
        : "No attempt to instruct the verifier was detected.",
      injection?.snippet ?? null,
      TEXT,
    ),
    row(
      "unrealistic_salary",
      "Unrealistic or guaranteed earnings",
      salary ? "flagged" : "passed",
      salary?.points ?? 10,
      salary
        ? "The offer promises unusually high, daily or guaranteed earnings, a common lure in fake job offers."
        : "No unusual or guaranteed earnings claims were detected.",
      salary?.snippet ?? null,
      TEXT,
    ),
    row(
      "urgency",
      "Pressure to act immediately",
      urgency ? "flagged" : "passed",
      urgency?.points ?? 5,
      urgency
        ? "The message uses pressure tactics such as tight deadlines or claims that you are already shortlisted."
        : "No pressure or artificial-deadline language was detected.",
      urgency?.snippet ?? null,
      TEXT,
    ),
  ];

  if (keyword) {
    findings.push(
      row(
        "high_risk_keyword",
        keyword.title,
        "flagged",
        keyword.points ?? 15,
        "Matched known scam phrasing.",
        keyword.snippet,
        TEXT,
      ),
    );
  }

  return findings;
}

function applicantFindings(
  extracted: ExtractedApplicant,
  evidence: EvidenceItem[],
  communityFlagCount: number,
): Finding[] {
  const freeEmail = hit(evidence, "free_email_employer");
  const fee = hit(evidence, "reverse_fee");
  const phrase = hit(evidence, "applicant_high_risk");
  const community = hit(evidence, "community_flags");
  const injection = hit(evidence, "prompt_injection");

  return [
    row(
      "reverse_fee",
      "Reverse fee ask",
      fee ? "flagged" : "passed",
      fee?.points ?? 40,
      fee
        ? "Applicant asked the employer to pay a fee."
        : "No reverse fee ask was detected.",
      fee?.snippet ?? extracted.feeAsks[0] ?? null,
      TEXT,
    ),
    row(
      "free_email_employer",
      "Free email vs claimed employer",
      freeEmail ? "flagged" : extracted.emails.length ? "passed" : "unknown",
      freeEmail?.points ?? 15,
      freeEmail
        ? "Free webmail used while claiming a named employer."
        : extracted.emails.length
          ? "No free-email-vs-employer mismatch was detected."
          : "No applicant email was found, so the sender domain could not be checked.",
      freeEmail?.snippet ?? (extracted.emails.join(", ") || null),
      ORG,
    ),
    row(
      "applicant_high_risk",
      "High-risk applicant phrase",
      phrase ? "flagged" : "passed",
      phrase?.points ?? 15,
      phrase
        ? "Matched risky applicant phrasing."
        : "No high-risk applicant phrasing was detected.",
      phrase?.snippet ?? null,
      TEXT,
    ),
    row(
      "community_flags",
      "Match in the scam registry",
      community ? "flagged" : "passed",
      community?.points ?? 50,
      community
        ? `Identifier already reported ${communityFlagCount} time${communityFlagCount === 1 ? "" : "s"}.`
        : "No published registry record matched this applicant.",
      community?.snippet ?? null,
      COMMUNITY,
    ),
    row(
      "prompt_injection",
      "Ad tried to instruct the system",
      injection ? "flagged" : "passed",
      injection?.points ?? 20,
      injection
        ? "Untrusted text attempted to override scoring. Ignored; risk raised."
        : "No attempt to instruct the verifier was detected.",
      injection?.snippet ?? null,
      TEXT,
    ),
  ];
}

export function mergeListingFinding(
  findings: Finding[],
  extra: EvidenceItem[],
): Finding[] {
  const next = findings.filter(
    (f) =>
      f.checkKey !== "official_listing_match" &&
      f.checkKey !== "official_route_mismatch" &&
      f.checkKey !== "official_listing",
  );
  const match = extra.find((e) => e.ruleId === "official_listing_match");
  const mismatch = extra.find((e) => e.ruleId === "official_route_mismatch");
  if (mismatch) {
    next.push(
      row(
        "official_route_mismatch",
        mismatch.title,
        "flagged",
        mismatch.points ?? 30,
        "Apply route does not match the organisation's official listing.",
        mismatch.snippet,
        LISTING,
      ),
    );
  } else if (match) {
    next.push(
      row(
        "official_listing_match",
        match.title,
        "passed",
        0,
        "This ad matches a listing in the official index. Confirm the role on the careers page before you apply.",
        match.snippet,
        LISTING,
      ),
    );
  } else {
    next.push(
      row(
        "official_listing",
        "Official listings index",
        "unknown",
        0,
        "Could not confirm this ad against the official listings index.",
        null,
        LISTING,
      ),
    );
  }
  return next;
}
