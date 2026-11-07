import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const sendMessage = vi.fn(async () => ({}));

vi.mock("@/lib/telegram/client", () => ({
  sendMessage: (...args: unknown[]) => sendMessage(...args),
  sendDocument: vi.fn(async () => ({})),
  getFileBuffer: vi.fn(),
}));

vi.mock("@/lib/pipeline/run-check", () => ({
  runCheckPipeline: vi.fn(async ({ direction, text }: { direction: string; text: string }) => ({
    id: `check_${direction}`,
    direction,
    verdict: text.includes("fee") ? "SCAM" : "UNSURE",
    riskBand: text.includes("fee") ? "HIGH" : "MEDIUM",
    riskScore: text.includes("fee") ? 75 : 40,
    recommendedAction: "Do not pay.",
    evidence: [{ ruleId: "fee", title: "Interview fee asked", snippet: "fee", severity: "high" }],
    officialListing: null,
  })),
}));

vi.mock("@/lib/store", async () => {
  const actual = await vi.importActual<typeof import("@/lib/store")>("@/lib/store");
  return {
    ...actual,
    getCheck: vi.fn(async (id: string) => ({
      id,
      direction: "job_offer",
      verdict: "SCAM",
      riskBand: "HIGH",
      riskScore: 75,
      recommendedAction: "Do not pay.",
      evidence: [],
      officialListing: null,
    })),
  };
});

import { handleTelegramMessage } from "@/lib/telegram/handlers";
import { resetTelegramSessionsForTests } from "@/lib/telegram/session";

function lastReply(): string {
  const calls = sendMessage.mock.calls;
  return String(calls[calls.length - 1]?.[1] ?? "");
}

function replies(): string[] {
  return sendMessage.mock.calls.map((c) => String(c[1]));
}

describe("telegram command e2e (handler flow)", () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_APP_URL = "https://kazi-check.rumptycloud.app";
    process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME = "kazicheck_Bot";
    resetTelegramSessionsForTests();
    sendMessage.mockClear();
  });

  afterEach(() => {
    resetTelegramSessionsForTests();
  });

  it("covers /start /help /check /applicant /apply and paste check", async () => {
    await handleTelegramMessage({ chatId: 1, text: "/start" });
    expect(lastReply()).toContain("Hi — I'm Kazi Check");
    expect(lastReply()).toContain("What I cannot do");

    await handleTelegramMessage({ chatId: 1, text: "/help" });
    expect(lastReply()).toContain("/apply");

    await handleTelegramMessage({ chatId: 1, text: "/check" });
    expect(lastReply()).toContain("Send the job advert now");

    await handleTelegramMessage({
      chatId: 1,
      text: "KenGen hiring. Pay interview fee KSh 2000 at kencareers-apply.com",
    });
    expect(replies().some((r) => r.includes("Checking this job message"))).toBe(true);
    expect(lastReply()).toContain("Looks like a SCAM");
    expect(lastReply()).toContain("https://kazi-check.rumptycloud.app/checks/check_job_offer");
    expect(lastReply()).toContain("Do not apply to this ad");

    await handleTelegramMessage({ chatId: 1, text: "/apply" });
    expect(lastReply()).toContain("Do not apply");
    expect(lastReply()).toContain("https://kazi-check.rumptycloud.app/checks/check_job_offer");

    await handleTelegramMessage({ chatId: 1, text: "/applicant" });
    expect(lastReply()).toContain("Paste the applicant message");

    await handleTelegramMessage({
      chatId: 1,
      text: "I work at Safaricom HR, send fee to confirm interview",
    });
    expect(lastReply()).toContain("checks/check_applicant");

    await handleTelegramMessage({ chatId: 1, text: "can you apply for me?" });
    expect(lastReply()).toContain("Can Kazi Check apply for you?");

    await handleTelegramMessage({ chatId: 1, text: "/unknowncmd" });
    expect(lastReply()).toContain("I don't know that command");
  });
});
