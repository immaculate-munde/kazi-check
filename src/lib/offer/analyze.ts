import { randomUUID } from "crypto";
import type { EvidenceItem, ExtractedOfferLetter, OfferAnalysisRecord } from "@/lib/types";
import { detectSubjectsFromText, isFreeEmail } from "@/lib/subjects/normalize";
import { DOMAIN_WHITELIST, IMPERSONATIONS } from "@/lib/rules/whitelist";
import { scoreToRiskBand, stampEvidence, toRiskScore } from "@/lib/risk";
import { runRules } from "@/lib/rules";

export function analyzeOfferLetter(rawText: string): OfferAnalysisRecord {
  const subjects = detectSubjectsFromText(rawText);
  const emails = subjects.filter((s) => s.kind === "email").map((s) => s.key);
  const phones = subjects.filter((s) => s.kind === "phone").map((s) => s.key);
  const domains = subjects.filter((s) => s.kind === "domain").map((s) => s.key);

  const extracted: ExtractedOfferLetter = {
    employer: rawText.match(/\b(KenGen|Safaricom|KRA|Equity Bank|KCB|Ministry of [\w\s]+)\b/i)?.[0] ?? null,
    jobTitle: rawText.match(/(?:position|role|title)\s*[:\-]\s*(.+)/i)?.[1]?.split("\n")[0]?.trim() ?? null,
    salary: rawText.match(/(?:KES|Ksh|USD)\s?[\d,]+/i)?.[0] ?? null,
    startDate: rawText.match(/(?:start|report(?:ing)?)\s*(?:date)?\s*[:\-]?\s*([A-Za-z0-9 ,\/-]+)/i)?.[1]?.trim() ?? null,
    workplace: rawText.match(/(?:location|workplace|office)\s*[:\-]\s*(.+)/i)?.[1]?.split("\n")[0]?.trim() ?? null,
    senderEmail: emails[0] ?? null,
    paymentInstructions:
      rawText.match(/(?:pay|mpesa|fee|deposit)[^\n.]{0,80}/i)?.[0] ?? null,
    emails,
    phones,
    urls: domains,
    rawSignals: [],
  };

  const greenFlags: EvidenceItem[] = [];
  const redFlags: EvidenceItem[] = [];
  const unresolved: string[] = [];

  if (extracted.salary) {
    greenFlags.push({
      ruleId: "salary_documented",
      title: "Salary documented",
      snippet: extracted.salary,
      severity: "low",
      sourceType: "content",
    });
  } else {
    unresolved.push("Salary and benefits are not clearly documented.");
  }

  if (extracted.startDate) {
    greenFlags.push({
      ruleId: "start_date",
      title: "Reporting / start date present",
      snippet: extracted.startDate,
      severity: "low",
      sourceType: "content",
    });
  } else {
    unresolved.push("Reporting date is missing.");
  }

  if (extracted.workplace) {
    greenFlags.push({
      ruleId: "workplace",
      title: "Workplace specified",
      snippet: extracted.workplace,
      severity: "low",
      sourceType: "content",
    });
  } else {
    unresolved.push("Official reporting location is unclear.");
  }

  const domain = domains[0];
  if (domain && DOMAIN_WHITELIST[domain]) {
    greenFlags.push({
      ruleId: "official_domain",
      title: "Domain matches whitelist",
      snippet: `${domain} (${DOMAIN_WHITELIST[domain]})`,
      severity: "low",
      sourceType: "whitelist",
    });
  }

  const imp = IMPERSONATIONS.find((i) => domain?.includes(i.fake));
  if (imp) {
    redFlags.push({
      ruleId: "impersonation",
      title: "Lookalike employer domain",
      snippet: `${domain} vs official ${imp.official}`,
      severity: "high",
      sourceType: "heuristic",
    });
  }

  if (extracted.paymentInstructions || /pay|fee|mpesa|deposit/i.test(rawText)) {
    redFlags.push({
      ruleId: "pre_employment_payment",
      title: "Payment requested before employment",
      snippet: extracted.paymentInstructions ?? "Payment language detected in offer",
      severity: "high",
      sourceType: "content",
    });
  }

  for (const email of emails) {
    if (isFreeEmail(email)) {
      redFlags.push({
        ruleId: "free_email_offer",
        title: "Unofficial sender email",
        snippet: email,
        severity: "high",
        sourceType: "content",
      });
    }
  }

  if (/urgent|immediately|within 24 hours|today only/i.test(rawText)) {
    redFlags.push({
      ruleId: "pressure",
      title: "Pressure to accept quickly",
      snippet: "Urgent acceptance language detected",
      severity: "medium",
      sourceType: "content",
    });
  }

  // Reuse job rules for extra payment/impersonation signals
  const jobRules = runRules(
    "job_offer",
    {
      domain: domain ?? null,
      salary: extracted.salary,
      contactMethod: emails[0] ? "email" : null,
      paymentTerms: extracted.paymentInstructions,
      claimedOrg: extracted.employer,
      emails,
      phones,
      urls: domains,
      rawSignals: [],
    },
    0,
    rawText,
  );
  for (const e of jobRules.evidence) {
    if (e.severity === "high" || e.severity === "medium") {
      if (!redFlags.some((r) => r.ruleId === e.ruleId)) redFlags.push(e);
    }
  }

  const combined = [...redFlags];
  const score01 = Math.min(
    1,
    redFlags.filter((r) => r.severity === "high").length * 0.35 +
      redFlags.filter((r) => r.severity === "medium").length * 0.2,
  );
  const riskScore = toRiskScore(score01, combined);
  const riskBand = scoreToRiskBand(riskScore, combined.length + greenFlags.length);
  const verdict =
    riskBand === "HIGH"
      ? "DO_NOT_PROCEED"
      : riskBand === "SUSPICIOUS" || riskBand === "MODERATE"
        ? "CAUTION"
        : "PROCEED";

  const questions = [
    "Can you confirm that this offer was issued by your HR department?",
    "Could you confirm the official reporting location?",
    "Is any payment required before commencing employment?",
    "Can you provide the official employment contract?",
    "Can I verify this offer through your published HR contact?",
  ];

  const employer = extracted.employer ?? "Hiring team";
  const emailDraft = {
    subject: `Clarification request regarding employment offer${extracted.jobTitle ? ` - ${extracted.jobTitle}` : ""}`,
    body: `Dear ${employer} team,\n\nThank you for the employment offer. Before I proceed, I would appreciate clarification on the following:\n\n${questions
      .map((q, i) => `${i + 1}. ${q}`)
      .join("\n")}\n\nPlease confirm the official channel I should use for verification.\n\nKind regards`,
  };

  return {
    id: `off_${randomUUID().slice(0, 10)}`,
    rawText,
    verdict,
    riskScore,
    riskBand,
    greenFlags: stampEvidence(greenFlags),
    redFlags: stampEvidence(redFlags),
    unresolved,
    questions,
    emailDraft,
    extracted,
    createdAt: new Date().toISOString(),
  };
}
