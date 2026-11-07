import type { BotQueueItem, CheckRecord, Finding } from "@/lib/types";

export function countFindings(findings: Finding[] | undefined) {
  const list = findings ?? [];
  return {
    flagged: list.filter((f) => f.outcome === "flagged").length,
    unknown: list.filter((f) => f.outcome === "unknown").length,
    passed: list.filter((f) => f.outcome === "passed").length,
  };
}

/** Queue row copy: SCAM · 100 · 4 flagged · 1 unknown · BLOCKED */
export function formatQueueLine(input: {
  verdict: string;
  riskScore: number;
  flagged: number;
  unknown: number;
  gate: string;
}): string {
  return `${input.verdict} · ${input.riskScore} · ${input.flagged} flagged · ${input.unknown} unknown · ${input.gate}`;
}

export function queueLineForCheck(
  check: CheckRecord,
  gate = "CHECKED",
): string {
  const counts = countFindings(check.findings);
  return formatQueueLine({
    verdict: check.verdict,
    riskScore: check.riskScore,
    flagged: counts.flagged,
    unknown: counts.unknown,
    gate,
  });
}

export function queueLineForBot(item: BotQueueItem): string {
  return formatQueueLine({
    verdict: item.verdict ?? item.status,
    riskScore: item.riskScore ?? 0,
    flagged: item.flaggedCount ?? 0,
    unknown: item.unknownCount ?? 0,
    gate: item.gate ?? item.status,
  });
}
