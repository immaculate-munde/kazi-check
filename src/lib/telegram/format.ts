import { absoluteAppUrl } from "@/lib/app-url";
import type { BotQueueItem, CheckRecord } from "@/lib/types";

/** Format a single check result for Telegram (URL alone on last lines). */
export function formatCheckReply(check: CheckRecord): string {
  const band = check.riskBand.replaceAll("_", " ");
  const bullets = check.evidence
    .slice(0, 2)
    .map((e) => `• ${e.title}`);
  const lines = [
    `Kazi Check: ${check.verdict} · ${band} · ${check.riskScore}/100`,
    ...bullets,
    check.recommendedAction || "Don't pay. Confirm on the official careers page.",
    "",
    "Open report:",
    absoluteAppUrl(`/checks/${check.id}`),
  ];
  return lines.join("\n");
}

/** Format a Job Bot batch summary for Telegram. */
export function formatBatchReply(items: BotQueueItem[]): string {
  const blocked = items.filter((i) => i.gate === "BLOCKED").length;
  const confirm = items.filter((i) => i.gate === "NEEDS_CONFIRMATION").length;
  const eligible = items.filter((i) => i.gate === "ELIGIBLE").length;
  const failed = items.filter((i) => i.status === "failed").length;

  const lines = [
    `${items.length} ad(s) checked: ${blocked} blocked, ${confirm} need confirmation, ${eligible} eligible${failed ? `, ${failed} failed` : ""}.`,
  ];

  for (const item of items.slice(0, 5)) {
    const label = item.gate ?? item.status;
    const verdict = item.verdict ?? "—";
    const link = item.checkId
      ? absoluteAppUrl(`/checks/${item.checkId}`)
      : null;
    lines.push(`• ${verdict} · ${label}${item.reason ? ` — ${item.reason.slice(0, 60)}` : ""}`);
    if (link) lines.push(link);
  }

  if (items.length > 5) {
    lines.push(`…and ${items.length - 5} more.`);
  }

  lines.push("", "Job Bot inbox:", absoluteAppUrl("/bot"));
  return lines.join("\n");
}

export function helpText(): string {
  const botHint = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME?.trim();
  const lines = [
    "Kazi Check Telegram bot",
    "Verify · Match · Proceed — never pay interview fees.",
    "",
    "Commands:",
    "/check — check a job advert (paste text or send a file)",
    "/applicant — check applicant claims",
    "/help — this menu",
    "",
    "You can also paste a job ad or upload .txt / .csv / .pdf / photo anytime.",
    "",
    "Web app:",
    absoluteAppUrl("/check"),
  ];
  if (botHint) {
    lines.splice(1, 0, `@${botHint.replace(/^@/, "")}`);
  }
  return lines.join("\n");
}
