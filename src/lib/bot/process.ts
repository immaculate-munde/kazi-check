import { randomUUID } from "crypto";
import { gate } from "@/lib/bot/gate";
import { maskPii } from "@/lib/pii";
import { runCheckPipeline } from "@/lib/pipeline/run-check";
import { memorySaveBotItem } from "@/lib/store/memory";
import type { BotQueueItem } from "@/lib/types";
import type { RawAd } from "@/lib/bot/source";

/** Run one ad through the existing verifier. Fail this item, continue the batch. */
export async function processAd(
  ad: RawAd,
  opts: { notifyPhone?: string } = {},
): Promise<BotQueueItem> {
  const now = new Date().toISOString();
  const { masked } = maskPii(ad.text || "");
  const extra: string[] = [];
  if (ad.unreadableReason) extra.push(ad.unreadableReason);
  let item: BotQueueItem = {
    id: `bot_${randomUUID().slice(0, 10)}`,
    sourceType: ad.sourceType,
    filename: ad.filename,
    status: "queued",
    maskedText: masked,
    notifyPhone: opts.notifyPhone,
    gaps: extra,
    createdAt: now,
    updatedAt: now,
  };
  memorySaveBotItem(item);

  try {
    if (ad.unreadable && !ad.text.trim()) {
      item = {
        ...item,
        status: "gated",
        verdict: "UNSURE",
        gate: "NEEDS_CONFIRMATION",
        reason: ad.unreadableReason ?? "Unreadable upload",
        gaps: [
          ad.unreadableReason ?? "Could not read this file.",
          "Phone number was unreadable — not guessed.",
        ],
        updatedAt: new Date().toISOString(),
      };
      memorySaveBotItem(item);
      return item;
    }

    item = { ...item, status: "extracted", updatedAt: new Date().toISOString() };
    memorySaveBotItem(item);

    const check = await runCheckPipeline({
      direction: "job_offer",
      text: ad.text,
      notifyPhone: opts.notifyPhone,
    });

    const extraGaps = [...item.gaps, ...check.gaps];
    const gateResult = gate(check.verdict, check.evidence, extraGaps);

    item = {
      ...item,
      status: "gated",
      checkId: check.id,
      verdict: check.verdict,
      gate: gateResult,
      reason: check.evidence[0]?.title ?? check.recommendedAction,
      gaps: [...new Set(extraGaps)],
      updatedAt: new Date().toISOString(),
    };
    memorySaveBotItem(item);
    return item;
  } catch (err) {
    item = {
      ...item,
      status: "failed",
      error: err instanceof Error ? err.message : "Processing failed",
      reason: err instanceof Error ? err.message : "Processing failed",
      updatedAt: new Date().toISOString(),
    };
    memorySaveBotItem(item);
    return item;
  }
}

export async function processBatch(
  ads: RawAd[],
  opts: { notifyPhone?: string } = {},
): Promise<BotQueueItem[]> {
  const out: BotQueueItem[] = [];
  for (const ad of ads) {
    out.push(await processAd(ad, opts));
  }
  return out;
}

export function queueTable(items: BotQueueItem[]): {
  ad: string;
  verdict: string;
  gate: string;
  reason: string;
}[] {
  return items.map((i) => ({
    ad: i.filename ?? i.id,
    verdict: i.verdict ?? i.status,
    gate: i.gate ?? i.status,
    reason: i.reason ?? i.error ?? "",
  }));
}
