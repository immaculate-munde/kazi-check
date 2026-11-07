import { extractFromText } from "@/lib/extract";
import { runRules, withExtraEvidence } from "@/lib/rules";
import {
  confirmYourselfList,
  recommendedAction,
  scoreToRiskBand,
  stampEvidence,
  toRiskScore,
} from "@/lib/risk";
import { detectSubjectsFromText } from "@/lib/subjects/normalize";
import {
  createCheck,
  getOrCreateSubject,
  lookupFlagCounts,
} from "@/lib/store";
import {
  listingToEvidence,
  matchOfficialListing,
  officialCoverageLabel,
} from "@/lib/official";
import { collectDomainIntel } from "@/lib/intel/domain";
import { maskPii } from "@/lib/pii";
import type { CheckDirection, CheckRecord, SubjectRef } from "@/lib/types";

export async function runCheckPipeline(input: {
  direction: CheckDirection;
  text: string;
  url?: string;
  notifyPhone?: string;
}): Promise<CheckRecord> {
  const direction = input.direction === "offer_letter" ? "job_offer" : input.direction;
  const rawText = input.text.trim() || input.url || "";
  if (!rawText) {
    throw new Error("text or url is required");
  }

  const extracted = await extractFromText(direction, rawText);
  const detected = detectSubjectsFromText(rawText);
  const community = await lookupFlagCounts(detected);

  let result = runRules(
    direction,
    extracted,
    community.count,
    rawText,
    community.reasons,
    community.status,
    community.published,
  );

  const listing = matchOfficialListing(extracted, rawText);
  const listingEvidence = listingToEvidence(listing);
  const listingGaps =
    listing.result === "NO_LISTING_INDEXED"
      ? [listing.detail, officialCoverageLabel()]
      : [officialCoverageLabel()];
  const intel = await collectDomainIntel(extracted);
  result = withExtraEvidence(
    result,
    [...(listingEvidence ? [listingEvidence] : []), ...intel.evidence],
    rawText,
    listingGaps,
  );

  const evidence = stampEvidence(result.evidence);
  const riskScore = toRiskScore(result.score, evidence);
  const riskBand = scoreToRiskBand(riskScore, evidence.length);
  const verdict = result.verdict;
  const { masked } = maskPii(rawText);

  const subjects: SubjectRef[] = [];
  for (const d of detected) {
    const summary =
      verdict === "SCAM" || verdict === "HIGH_RISK"
        ? `Auto-linked from ${verdict} check`
        : "";
    const row = await getOrCreateSubject(d.kind, d.key, direction, summary);
    subjects.push({
      id: row.id,
      kind: row.kind,
      key: row.key,
      flagCount: row.flagCount,
      topReasons: row.topReasons,
    });
  }

  if ((verdict === "SCAM" || verdict === "HIGH_RISK") && subjects.length === 0) {
    const fallback = await getOrCreateSubject(
      "url",
      `check:${masked.slice(0, 48).replace(/\s+/g, "_")}`,
      direction,
      "Unstructured high-risk text",
    );
    subjects.push({
      id: fallback.id,
      kind: fallback.kind,
      key: fallback.key,
      flagCount: fallback.flagCount,
      topReasons: fallback.topReasons,
    });
  }

  return createCheck({
    direction: input.direction,
    rawText: masked,
    url: input.url,
    verdict,
    score: result.score,
    riskScore,
    riskBand,
    recommendedAction: recommendedAction(verdict),
    extracted,
    evidence,
    findings: result.findings,
    subjects,
    gaps: result.gaps,
    confirmYourself: confirmYourselfList(verdict),
    officialListing: listing,
    notifyPhone: input.notifyPhone?.trim() || null,
  });
}
