import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/telegram/client", () => ({
  sendMessage: vi.fn(async () => ({})),
  getFileBuffer: vi.fn(),
}));

vi.mock("@/lib/pipeline/run-check", () => ({
  runCheckPipeline: vi.fn(async () => ({
    id: "cm_mock",
    direction: "job_offer",
    verdict: "SCAM",
    riskBand: "HIGH",
    riskScore: 80,
    recommendedAction: "Do not pay.",
    evidence: [
      { ruleId: "fee", title: "Interview fee", snippet: "pay", severity: "high" },
    ],
  })),
}));

import { sendMessage } from "@/lib/telegram/client";
import { handleTelegramMessage } from "@/lib/telegram/handlers";
import { runCheckPipeline } from "@/lib/pipeline/run-check";
import { resetTelegramSessionsForTests } from "@/lib/telegram/session";

const ORIGINAL_URL = process.env.NEXT_PUBLIC_APP_URL;

afterEach(() => {
  resetTelegramSessionsForTests();
  vi.clearAllMocks();
  if (ORIGINAL_URL === undefined) delete process.env.NEXT_PUBLIC_APP_URL;
  else process.env.NEXT_PUBLIC_APP_URL = ORIGINAL_URL;
});

describe("handleTelegramMessage", () => {
  it("runs a check on pasted text and replies with absolute report URL", async () => {
    process.env.NEXT_PUBLIC_APP_URL = "https://kazi-check.rumptycloud.app";

    await handleTelegramMessage({
      chatId: 42,
      text: "KenGen hiring. Pay interview fee KSh 2000 via kencareers-apply.com",
    });

    expect(runCheckPipeline).toHaveBeenCalledWith(
      expect.objectContaining({
        direction: "job_offer",
        text: expect.stringContaining("KenGen"),
      }),
    );

    const calls = vi.mocked(sendMessage).mock.calls;
    const last = calls[calls.length - 1]?.[1] as string;
    expect(last).toContain("SCAM");
    expect(last).toContain("https://kazi-check.rumptycloud.app/checks/cm_mock");
  });

  it("answers /start with help", async () => {
    process.env.NEXT_PUBLIC_APP_URL = "https://kazi-check.rumptycloud.app";
    await handleTelegramMessage({ chatId: 7, text: "/start" });
    expect(vi.mocked(sendMessage).mock.calls[0]?.[1]).toContain("/check");
  });
});
