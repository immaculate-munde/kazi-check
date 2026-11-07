import { afterEach, describe, expect, it } from "vitest";
import {
  applyHelpText,
  formatBatchReply,
  formatCheckReply,
  helpText,
  wantsApplyHelp,
} from "@/lib/telegram/format";
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
  it("uses plain language and a clickable https report URL", () => {
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
      ],
    } as CheckRecord;

    const body = formatCheckReply(check);
    expect(body).toContain("Looks like a SCAM");
    expect(body).toContain("We never auto-apply");
    expect(body).toContain("Do not apply to this ad");
    expect(body).toContain("https://kazi-check.rumptycloud.app/checks/cm_test_1");
  });

  it("summarizes a batch in simple words", () => {
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
    expect(body).toContain("blocked (do not apply)");
    expect(body).toContain("We prepare CVs");
    expect(body).toContain("https://kazi-check.rumptycloud.app/checks/chk_a");
  });

  it("answers apply help without a prior check", () => {
    const body = applyHelpText(null);
    expect(body).toContain("Can Kazi Check apply for you?");
    expect(body).toContain("No.");
    expect(body).toContain("First send a job ad");
  });

  it("detects natural-language apply questions", () => {
    expect(wantsApplyHelp("can you apply for me?")).toBe(true);
    expect(wantsApplyHelp("apply for me please")).toBe(true);
    expect(wantsApplyHelp("KenGen is hiring")).toBe(false);
  });

  it("mentions bot username in help when configured", () => {
    process.env.NEXT_PUBLIC_APP_URL = "https://kazi-check.rumptycloud.app";
    process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME = "kazicheck_Bot";
    expect(helpText()).toContain("@kazicheck_Bot");
    expect(helpText()).toContain("What I cannot do");
  });
});
