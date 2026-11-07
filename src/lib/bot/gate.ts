import type { EvidenceItem, GateResult, Verdict } from "@/lib/types";

/**
 * Trust gate — separate from skill match.
 * BLOCKED ads never get a draft.
 */
export function gate(
  verdict: Verdict,
  _evidence: EvidenceItem[],
  _gaps: string[],
): GateResult {
  if (verdict === "SCAM" || verdict === "HIGH_RISK") return "BLOCKED";
  if (verdict === "CAUTION" || verdict === "UNSURE") return "NEEDS_CONFIRMATION";
  return "ELIGIBLE";
}

export function canDraft(gateResult: GateResult, confirmed: boolean): boolean {
  if (gateResult === "BLOCKED") return false;
  if (gateResult === "ELIGIBLE") return true;
  return confirmed;
}
