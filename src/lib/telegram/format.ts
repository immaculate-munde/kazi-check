import { absoluteAppUrl } from "@/lib/app-url";
import type { FitResult } from "@/lib/fit/score";
import type { BotQueueItem, CheckRecord } from "@/lib/types";

function plainVerdict(verdict: string): string {
  switch (verdict) {
    case "SCAM":
      return "Looks like a SCAM";
    case "HIGH_RISK":
      return "HIGH RISK — be careful";
    case "CAUTION":
      return "Caution — double-check first";
    case "UNSURE":
      return "Not sure yet — confirm yourself";
    case "NO_RED_FLAGS":
      return "No red flags on our checks (still verify on the official site)";
    default:
      return verdict.replaceAll("_", " ");
  }
}

function plainGate(gate: string | undefined): string {
  switch (gate) {
    case "BLOCKED":
      return "Blocked — do not apply";
    case "NEEDS_CONFIRMATION":
      return "Needs your confirmation first";
    case "ELIGIBLE":
      return "OK to proceed on the official site only";
    default:
      return gate ?? "pending";
  }
}

export function officialApplyUrl(check: CheckRecord): string | null {
  const listing = check.officialListing;
  if (listing?.result === "MATCHES_LISTING" && listing.listing?.applyUrl) {
    return listing.listing.applyUrl;
  }
  return null;
}

/** Format a single check result for Telegram (URL alone on last lines). */
export function formatCheckReply(check: CheckRecord): string {
  const bullets = check.evidence.slice(0, 2).map((e) => `• ${e.title}`);
  const lines = [
    plainVerdict(check.verdict),
    `Risk score: ${check.riskScore}/100`,
    ...bullets,
    "",
    check.recommendedAction ||
      "Do not pay anyone. Open the company careers page yourself and confirm.",
    "",
    "We never auto-apply or pay fees for you.",
    "",
    "Full report:",
    absoluteAppUrl(`/checks/${check.id}`),
  ];

  if (check.verdict === "SCAM" || check.verdict === "HIGH_RISK") {
    lines.push("", "Do not apply to this ad.");
  } else {
    lines.push(
      "",
      "Next: /profile for your CV match, or /apply for safe next steps.",
    );
  }
  return lines.join("\n");
}

export function formatFitReply(
  check: CheckRecord,
  fit: FitResult,
): string {
  const apply = officialApplyUrl(check);
  const lines = [
    `Your match for “${fit.roleTitle}”: ${fit.score}/100 — ${fit.label}`,
    "",
    "Why you match:",
    ...fit.matchBullets.map((b) => `• ${b}`),
    "",
    "Gaps to watch:",
    ...fit.gapBullets.map((b) => `• ${b}`),
    "",
    "I’m sending your tailored CV (PDF) next.",
    "We prepare the CV — we do not submit the application for you.",
    "",
    "Full report:",
    absoluteAppUrl(`/checks/${check.id}`),
  ];
  if (apply) {
    lines.push("", "Open official apply page:", apply);
  } else {
    lines.push(
      "",
      "No verified official apply link yet — find the employer’s real careers page yourself.",
    );
  }
  return lines.join("\n");
}

/** Format a Job Bot batch summary for Telegram. */
export function formatBatchReply(items: BotQueueItem[]): string {
  const blocked = items.filter((i) => i.gate === "BLOCKED").length;
  const confirm = items.filter((i) => i.gate === "NEEDS_CONFIRMATION").length;
  const eligible = items.filter((i) => i.gate === "ELIGIBLE").length;
  const failed = items.filter((i) => i.status === "failed").length;

  const lines = [
    `Checked ${items.length} job(s):`,
    `• ${blocked} blocked (do not apply)`,
    `• ${confirm} need you to confirm details first`,
    `• ${eligible} look OK for the official site only`,
  ];
  if (failed) lines.push(`• ${failed} failed to read`);

  lines.push("");

  for (const item of items.slice(0, 5)) {
    const verdict = item.verdict ? plainVerdict(item.verdict) : "No verdict";
    lines.push(`• ${verdict} — ${plainGate(item.gate)}`);
    if (item.reason) lines.push(`  Why: ${item.reason.slice(0, 80)}`);
    if (item.checkId) lines.push(absoluteAppUrl(`/checks/${item.checkId}`));
  }

  if (items.length > 5) {
    lines.push(`…and ${items.length - 5} more.`);
  }

  lines.push(
    "",
    "We prepare CVs — we do not apply on WhatsApp or pay fees for you.",
    "Open the inbox on the website:",
    absoluteAppUrl("/bot"),
  );
  return lines.join("\n");
}

export function helpText(): string {
  const botHint = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME?.trim();
  const lines = [
    "Hi — I'm Kazi Check.",
    "I help you spot fake job ads, see your match score, and download a tailored CV.",
    "",
    "What I can do:",
    "• Check a job ad you paste or upload (photo / PDF / txt)",
    "• Tell you if it looks like a scam and why",
    "• Score how you fit (after /profile)",
    "• Send a tailored ATS CV PDF you can download",
    "",
    "What I cannot do:",
    "• Submit the application for you",
    "• Pay interview or 'training' fees",
    "• Message recruiters on WhatsApp for you",
    "",
    "Commands:",
    "/check — check a job advert",
    "/profile — set up or update your CV profile",
    "/cv — re-send your last tailored CV",
    "/applicant — check a message about an applicant",
    "/apply — download CV / open official apply page",
    "/help — this message",
    "",
    "Tip: just paste the job text, or send a screenshot.",
    "",
    "Website profile:",
    absoluteAppUrl("/profile"),
  ];
  if (botHint) {
    lines.splice(1, 0, `@${botHint.replace(/^@/, "")}`);
  }
  return lines.join("\n");
}

export function applyHelpText(check?: CheckRecord | null): string {
  const lines = [
    "Can Kazi Check apply for you?",
    "No. We prepare your CV and point you to the official page — we never auto-submit.",
    "",
  ];

  if (!check) {
    lines.push(
      "First send a job ad (or /check), then type /apply again.",
      "",
      "Safe way to apply:",
      "1. Only use the company's official careers website",
      "2. Never pay for an interview or 'training slot'",
      "3. Use /profile so we can score you and send a tailored CV",
      "4. Open your report:",
      absoluteAppUrl("/profile"),
    );
    return lines.join("\n");
  }

  if (check.verdict === "SCAM" || check.verdict === "HIGH_RISK") {
    lines.push(
      `Your last check: ${plainVerdict(check.verdict)}.`,
      "Do not apply. Do not pay. Do not send your ID to that contact.",
      "",
      "Report:",
      absoluteAppUrl(`/checks/${check.id}`),
    );
    return lines.join("\n");
  }

  const apply = officialApplyUrl(check);
  lines.push(
    `Your last check: ${plainVerdict(check.verdict)}.`,
    "Download CV for this role: use /cv after /profile, or open the report.",
    "",
    "Full report:",
    absoluteAppUrl(`/checks/${check.id}`),
  );
  if (apply) {
    lines.push("", "Open official apply page:", apply);
  } else {
    lines.push(
      "",
      "We did not find a verified official apply link for this ad.",
      "Find the employer on Google yourself and use their real careers page — not links inside a WhatsApp message.",
    );
  }
  return lines.join("\n");
}

export function wantsApplyHelp(text: string): boolean {
  const t = text.toLowerCase();
  return (
    (/\bapply\b/.test(t) &&
      /\b(for me|help me|can you|can u|can it|please|pls)\b/.test(t)) ||
    /^(can you |can u |can it )?apply\b/.test(t) ||
    t === "apply"
  );
}
