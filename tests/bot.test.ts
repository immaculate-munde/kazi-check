import { describe, expect, it } from "vitest";
import { readFileSync } from "fs";
import path from "path";
import { gate, canDraft } from "@/lib/bot/gate";
import {
  enforceBatchCap,
  MAX_ADS_PER_BATCH,
  parseCsvAds,
  validateUpload,
} from "@/lib/bot/parse-upload";
import { extractImagePlaceholder, unreadablePhoneGap } from "@/lib/bot/ocr";
import { buildApplyPacket } from "@/lib/bot/apply";
import { dispatchRetroAlerts } from "@/lib/bot/retro";
import { addFlag, getCheck } from "@/lib/store";
import { formatBatchDigest } from "@/lib/bot/digest";
import { processAd } from "@/lib/bot/process";
import { heuristicExtract } from "@/lib/extract";
import { matchOfficialListing } from "@/lib/official";
import { maskPii, stillContainsSensitivePii } from "@/lib/pii";
import { runRules } from "@/lib/rules";
import { displayVerdict } from "@/lib/verdict";
import { draftApplication } from "@/lib/bot/draft";
import type { BotQueueItem, Verdict } from "@/lib/types";

const fixtures = JSON.parse(
  readFileSync(path.join(process.cwd(), "tests/fixtures/ads.json"), "utf8"),
) as { id: string; label: string; text: string }[];

function fixture(id: string) {
  const row = fixtures.find((f) => f.id === id);
  if (!row) throw new Error(`missing fixture ${id}`);
  return row;
}

describe("upload validation", () => {
  it("rejects disallowed types", () => {
    expect(validateUpload("ad.docx", 100)).toMatch(/Rejected type/i);
    expect(validateUpload("ad.exe", 100)).toMatch(/Rejected type/i);
  });

  it("rejects oversized files", () => {
    expect(validateUpload("ad.txt", 6 * 1024 * 1024)).toMatch(/exceeds/i);
  });

  it("caps a batch at 20 ads", () => {
    const ads = Array.from({ length: 25 }, (_, i) => ({
      sourceType: "csv" as const,
      text: `Ad number ${i} with enough characters to process`,
    }));
    const { ads: kept, truncated } = enforceBatchCap(ads);
    expect(kept).toHaveLength(MAX_ADS_PER_BATCH);
    expect(truncated).toBe(5);
  });

  it("parses csv one ad per row", () => {
    const ads = parseCsvAds("text\nHello role in Nairobi apply via portal\nSecond row clerk needed", "a.csv");
    expect(ads).toHaveLength(2);
  });
});

describe("PII masking before storage", () => {
  it("redacts PIN, ID and names", () => {
    const { masked } = maskPii(
      "My name is Jane Doe ID number 12345678 KRA PIN A123456789Z",
    );
    expect(masked).toContain("[KRA_PIN]");
    expect(masked).toContain("[ID_NUMBER]");
    expect(masked).toContain("[NAME]");
    expect(stillContainsSensitivePii(masked)).toBe(false);
  });
});

describe("raw files", () => {
  it("never writes uploads to disk — processAd only keeps masked text", async () => {
    const item = await processAd({
      sourceType: "paste",
      text: fixture("acme_roads").text,
    });
    expect(item.maskedText.length).toBeGreaterThan(10);
    expect(item.status === "gated" || item.status === "failed").toBe(true);
  });
});

describe("gate", () => {
  it("BLOCKED for SCAM and High risk", () => {
    expect(gate("SCAM", [], [])).toBe("BLOCKED");
    expect(gate("HIGH_RISK", [], [])).toBe("BLOCKED");
    expect(canDraft("BLOCKED", true)).toBe(false);
  });

  it("NEEDS_CONFIRMATION for Caution and Unsure", () => {
    expect(gate("CAUTION", [], ["gap"])).toBe("NEEDS_CONFIRMATION");
    expect(gate("UNSURE", [], [])).toBe("NEEDS_CONFIRMATION");
    expect(canDraft("NEEDS_CONFIRMATION", false)).toBe(false);
    expect(canDraft("NEEDS_CONFIRMATION", true)).toBe(true);
  });

  it("ELIGIBLE for no red flags found", () => {
    expect(gate("NO_RED_FLAGS", [], [])).toBe("ELIGIBLE");
    expect(canDraft("ELIGIBLE", false)).toBe(true);
  });
});

describe("official listing matching", () => {
  it("MATCHES_LISTING for official Safaricom portal URL", () => {
    const text = fixture("safaricom_official").text;
    const extracted = heuristicExtract("job_offer", text);
    expect(matchOfficialListing(extracted, text).result).toBe("MATCHES_LISTING");
  });

  it("ROUTE_MISMATCH when listing says portal but ad says WhatsApp", () => {
    const text = fixture("safaricom_whatsapp").text;
    const extracted = heuristicExtract("job_offer", text);
    expect(matchOfficialListing(extracted, text).result).toBe("ROUTE_MISMATCH");
  });

  it("NO_LISTING_INDEXED is not a flag", () => {
    const text = fixture("unknown_coop").text;
    const extracted = heuristicExtract("job_offer", text);
    expect(matchOfficialListing(extracted, text).result).toBe("NO_LISTING_INDEXED");
  });
});

describe("Acme Roads acceptance", () => {
  it("returns SCAM or High risk and is BLOCKED", async () => {
    const item = await processAd({
      sourceType: "paste",
      text: fixture("acme_roads").text,
    });
    expect(["SCAM", "HIGH_RISK"]).toContain(item.verdict);
    expect(item.gate).toBe("BLOCKED");
  });
});

describe("unreadable screenshot", () => {
  it("shows a gap and does not guess a phone", () => {
    const ocr = extractImagePlaceholder();
    expect(ocr.text).toBe("");
    expect(ocr.unreadable).toBe(true);
    expect(ocr.reason).toMatch(/not guessed|unreadable/i);
  });

  it("adds a phone gap when a number was mentioned but not read", () => {
    expect(unreadablePhoneGap("Apply on WhatsApp call me")).toMatch(/not guessed/i);
    expect(unreadablePhoneGap("Call 0712345678 for the role")).toBeNull();
  });
});

describe("apply", () => {
  it("opens the official portal for an eligible Safaricom listing", async () => {
    const item = await processAd({
      sourceType: "paste",
      text: fixture("safaricom_official").text,
    });
    expect(item.gate).toBe("ELIGIBLE");
    const check = item.checkId ? await getCheck(item.checkId) : null;
    const built = buildApplyPacket(item, check);
    expect(built.ok).toBe(true);
    if (built.ok) {
      expect(built.packet.mode).toBe("official_portal");
      expect(built.packet.applyUrl).toContain("safaricom.co.ke/careers");
    }
  });

  it("refuses apply on a blocked scam ad", async () => {
    const item = await processAd({
      sourceType: "paste",
      text: fixture("acme_roads").text,
    });
    const check = item.checkId ? await getCheck(item.checkId) : null;
    const built = buildApplyPacket(item, check);
    expect(built.ok).toBe(false);
  });
});

describe("retro-alerts", () => {
  it("notifies a prior check when a matching identifier is flagged", async () => {
    const item = await processAd(
      {
        sourceType: "paste",
        text: "Sunrise Tea Cooperative needs one clerk in Kericho. Call 0799887766. Email hr@sunrisetea.co.ke",
      },
      { notifyPhone: "0711111111" },
    );
    expect(item.checkId).toBeTruthy();
    const flagged = await addFlag({
      kind: "phone",
      key: "+254799887766",
      reason: "Same number used in a later fake ad",
      fingerprintHash: `retro_test_fp_${Date.now()}`,
    });
    const alerts = await dispatchRetroAlerts({
      subjectId: flagged.subjectId,
      reason: flagged.reason,
      dryRun: true,
    });
    expect(alerts.some((a) => a.checkId === item.checkId && a.dryRun)).toBe(true);
    expect(alerts[0]?.message).toMatch(/retro-alert/i);
  });
});

describe("prompt injection fixture", () => {
  it("does not change a stacked scam verdict", () => {
    const text = fixture("injection").text;
    const extracted = heuristicExtract("job_offer", text);
    const result = runRules("job_offer", extracted, 0, text);
    expect(result.verdict).toBe("SCAM");
  });
});

describe("confidence language", () => {
  it("no displayed verdict contains safe or legit", () => {
    const verdicts: Verdict[] = ["SCAM", "HIGH_RISK", "CAUTION", "UNSURE", "NO_RED_FLAGS"];
    for (const v of verdicts) {
      const label = displayVerdict(v);
      expect(label).not.toMatch(/\bsafe\b/i);
      expect(label).not.toMatch(/\blegit\b/i);
    }
  });
});

describe("digest dry-run copy", () => {
  it("summarises gate counts", () => {
    const items = [
      { gate: "BLOCKED" },
      { gate: "BLOCKED" },
      { gate: "NEEDS_CONFIRMATION" },
      { gate: "NEEDS_CONFIRMATION" },
      { gate: "ELIGIBLE" },
    ] as BotQueueItem[];
    const msg = formatBatchDigest(items);
    expect(msg).toContain("2 blocked");
    expect(msg).toContain("2 need confirmation");
    expect(msg).toContain("1 eligible");
  });
});

describe("application draft", () => {
  it("does not include ID or PIN and does not send", () => {
    const text = draftApplication(fixture("cbk_portal").text, "Internship");
    expect(text).toMatch(/Amina Wanjiku/);
    expect(text).not.toMatch(/\b[A-Z]\d{9}[A-Z]\b/);
    expect(text).not.toMatch(/passport/i);
  });
});
