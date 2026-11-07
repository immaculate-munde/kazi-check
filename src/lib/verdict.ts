import type { Verdict } from "@/lib/types";

/** Human-facing verdict labels. Never returns "safe" or "legit". */
export function displayVerdict(verdict: Verdict): string {
  switch (verdict) {
    case "SCAM":
      return "SCAM";
    case "HIGH_RISK":
      return "High risk";
    case "CAUTION":
      return "Caution";
    case "UNSURE":
      return "Unsure";
    case "NO_RED_FLAGS":
      return "No red flags found";
  }
}

export function isBlockedVerdict(verdict: Verdict): boolean {
  return verdict === "SCAM" || verdict === "HIGH_RISK";
}

export const DEFAULT_CONFIRM_YOURSELF = [
  "Open the organisation's official careers page and confirm this role is listed.",
  "Apply only through the official portal or corporate email domain — not WhatsApp or Telegram.",
  "Do not pay a fee, deposit, or M-Pesa at any recruitment stage.",
  "Do not send your ID, KRA PIN, passport, or selfie until you have independently verified the employer.",
];
