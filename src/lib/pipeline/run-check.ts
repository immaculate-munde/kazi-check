import { extractFromText } from "@/lib/extract";
import { runRules } from "@/lib/rules";
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
  const rawText = input.text.trim() || input.url || "";
  if (!rawText) {
    throw new Error("text or url is required");
  }

  const extracted = await extractFromText(input.direction, rawText);
  const detected = detectSubjectsFromText(rawText);

  const communityFlagCount = memoryLookupFlagCounts(detected);
  const { verdict, score, evidence } = runRules(
    input.direction,
    extracted,
    communityFlagCount,
    rawText,
  );

  const subjects: SubjectRef[] = detected.map((d) => {
    const summary =
      verdict === "SCAM" || verdict === "HIGH_RISK"
        ? `Auto-linked from ${verdict} check`
        : "";
    const row = memoryGetOrCreateSubject(
      d.kind,
      d.key,
      input.direction,
      summary,
    );
    return {
      id: row.id,
      kind: row.kind,
      key: row.key,
      flagCount: row.flagCount,
    };
  });

  // Ensure high-risk checks bump visibility even without manual flag
  if (
    (verdict === "SCAM" || verdict === "HIGH_RISK") &&
    subjects.length === 0
  ) {
    const fallback = memoryGetOrCreateSubject(
      "url",
      `check:${rawText.slice(0, 48).replace(/\s+/g, "_")}`,
      input.direction,
      "Unstructured scam text",
    );
    subjects.push({
      id: fallback.id,
      kind: fallback.kind,
      key: fallback.key,
      flagCount: fallback.flagCount,
    });
  }

  return memoryCreateCheck({
    direction: input.direction,
    rawText,
    url: input.url,
    verdict,
    score,
    extracted,
    evidence,
    subjects,
  });
}
