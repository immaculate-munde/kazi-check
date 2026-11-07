import { extractFromText } from "@/lib/extract";
import { runRules } from "@/lib/rules";
import {
  recommendedAction,
  scoreToRiskBand,
  stampEvidence,
  toRiskScore,
  verdictFromBand,
} from "@/lib/risk";
import { detectSubjectsFromText } from "@/lib/subjects/normalize";
import {
  memoryCreateCheck,
  memoryGetOrCreateSubject,
  memoryLookupFlagCounts,
} from "@/lib/store/memory";
import type { CheckDirection, CheckRecord, SubjectRef } from "@/lib/types";

export async function runCheckPipeline(input: {
  direction: CheckDirection;
  text: string;
  url?: string;
}): Promise<CheckRecord> {
  const direction = input.direction === "offer_letter" ? "job_offer" : input.direction;
  const rawText = input.text.trim() || input.url || "";
  if (!rawText) {
    throw new Error("text or url is required");
  }

  const extracted = await extractFromText(direction, rawText);
  const detected = detectSubjectsFromText(rawText);

  const community = memoryLookupFlagCounts(detected);
  const { score, evidence: rawEvidence } = runRules(
    direction,
    extracted,
    community.count,
    rawText,
    community.reasons,
  );

  const evidence = stampEvidence(rawEvidence);
  const riskScore = toRiskScore(score, evidence);
  const riskBand = scoreToRiskBand(riskScore, evidence.length);
  const verdict = verdictFromBand(input.direction, riskBand);

  const subjects: SubjectRef[] = detected.map((d) => {
    const summary =
      verdict === "SCAM" || verdict === "HIGH_RISK" || verdict === "DO_NOT_PROCEED"
        ? `Auto-linked from ${verdict} check`
        : "";
    const row = memoryGetOrCreateSubject(
      d.kind,
      d.key,
      direction,
      summary,
    );
    return {
      id: row.id,
      kind: row.kind,
      key: row.key,
      flagCount: row.flagCount,
      topReasons: row.topReasons,
    };
  });

  if (
    (verdict === "SCAM" || verdict === "HIGH_RISK") &&
    subjects.length === 0
  ) {
    const fallback = memoryGetOrCreateSubject(
      "url",
      `check:${rawText.slice(0, 48).replace(/\s+/g, "_")}`,
      direction,
      "Unstructured scam text",
    );
    subjects.push({
      id: fallback.id,
      kind: fallback.kind,
      key: fallback.key,
      flagCount: fallback.flagCount,
      topReasons: fallback.topReasons,
    });
  }

  return memoryCreateCheck({
    direction: input.direction,
    rawText,
    url: input.url,
    verdict,
    score,
    riskScore,
    riskBand,
    recommendedAction: recommendedAction(riskBand),
    extracted,
    evidence,
    subjects,
  });
}
