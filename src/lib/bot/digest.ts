import { absoluteAppUrl } from "@/lib/app-url";
import type { BotQueueItem } from "@/lib/types";
import { formatVerdictSms, sendSms } from "@/lib/thrivewave";

export function formatBatchDigest(items: BotQueueItem[]): string {
  const blocked = items.filter((i) => i.gate === "BLOCKED").length;
  const confirm = items.filter((i) => i.gate === "NEEDS_CONFIRMATION").length;
  const eligible = items.filter((i) => i.gate === "ELIGIBLE").length;
  const failed = items.filter((i) => i.status === "failed").length;
  const botUrl = absoluteAppUrl("/bot");
  return [
    `${items.length} ads checked: ${blocked} blocked, ${confirm} need confirmation, ${eligible} eligible${failed ? `, ${failed} failed` : ""}.`,
    "Open Job Bot:",
    botUrl,
  ].join("\n");
}

export async function sendBatchDigest(opts: {
  phone: string;
  items: BotQueueItem[];
  dryRun?: boolean;
}) {
  const message = formatBatchDigest(opts.items);
  if (opts.dryRun) {
    return { ok: true, stub: true, dryRun: true, message };
  }
  const result = await sendSms({ phone: opts.phone, message });
  return { ...result, dryRun: false, message };
}

export { formatVerdictSms };
