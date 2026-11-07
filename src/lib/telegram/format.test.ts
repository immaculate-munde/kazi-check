import { afterEach, describe, expect, it } from "vitest";
import { formatBatchReply, formatCheckReply, helpText } from "@/lib/telegram/format";
import type { BotQueueItem, CheckRecord } from "@/lib/types";

const ORIGINAL_URL = process.env.NEXT_PUBLIC_APP_URL;
const ORIGINAL_BOT = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME;

afterEach(() => {
  if (ORIGINAL_URL === undefined) delete process.env.NEXT_PUBLIC_APP_URL;
  else process.env.NEXT_PUBLIC_APP_URL = ORIGINAL_URL;
  if (ORIGINAL_BOT === undefined) delete process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME;
  else process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME = ORIGINAL_BOT;
});

describe("telegram format", () => {
  it("puts an absolute https check URL on its own line", () => {
    process.env.NEXT_PUBLIC_APP_URL = "https://kazi-check.rumptycloud.app";
    const check = {
      id: "cm_test_1",
      direction: "job_offer",
      verdict: "SCAM",
      riskBand: "HIGH",
      riskScore: 70,
      recommendedAction: "Do not pay.",
      evidence: [
        { ruleId: "fee", title: "Ask for interview fee", snippet: "fee", severity: "high" },
        { ruleId: "domain", title: "Lookalike domain", snippet: "fake", severity: "high" },
      ],
    } as CheckRecord;

    const body = formatCheckReply(check);
    expect(body).toContain("Kazi Check: SCAM · HIGH · 70/100");
    expect(body).toContain("• Ask for interview fee");
    expect(body).toMatch(
      /Open report:\nhttps:\/\/kazi-check\.rumptycloud\.app\/checks\/cm_test_1$/,
    );
  });

  it("summarizes a batch with per-item links when checkId is present", () => {
    process.env.NEXT_PUBLIC_APP_URL = "https://kazi-check.rumptycloud.app";
    const items = [
      {
        id: "bot_1",
        sourceType: "paste",
        status: "gated",
        gate: "BLOCKED",
        verdict: "SCAM",
        reason: "Fee ask",
        checkId: "chk_a",
        gaps: [],
        maskedText: "…",
        createdAt: "",
        updatedAt: "",
      },
    ] as BotQueueItem[];

    const body = formatBatchReply(items);
    expect(body).toContain("1 ad(s) checked: 1 blocked");
    expect(body).toContain("https://kazi-check.rumptycloud.app/checks/chk_a");
    expect(body).toContain("https://kazi-check.rumptycloud.app/bot");
  });

  it("mentions bot username in help when configured", () => {
    process.env.NEXT_PUBLIC_APP_URL = "https://kazi-check.rumptycloud.app";
    process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME = "KaziCheckBot";
    expect(helpText()).toContain("@KaziCheckBot");
    expect(helpText()).toContain("/check");
  });
});
