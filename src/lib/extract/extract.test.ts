import { afterEach, describe, expect, it, vi } from "vitest";
import { extractFromText, heuristicExtract, isLlmConfigured } from "@/lib/extract";
import { llmApplicantSchema, llmOfferSchema } from "@/lib/extract/schemas";

const ACME =
  "Acme Roads Authority hiring 800 staff. Apply on WhatsApp. Send ID and Ksh 1,500 registration.";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("heuristicExtract", () => {
  it("pulls fee, org, whatsapp, and id ask from a scam ad", () => {
    const extracted = heuristicExtract("job_offer", ACME);
    expect(extracted).toMatchObject({
      claimedOrg: expect.stringMatching(/Acme Roads Authority/i),
      channel: "whatsapp",
      asksForId: true,
      claimedHeadcount: 800,
    });
    expect("paymentTerms" in extracted && extracted.paymentTerms).toBeTruthy();
  });

  it("extracts applicant fee asks and free-email style signals", () => {
    const text =
      "I am CEO of Safaricom. Pay background fee to ceo.safaricom.hr@gmail.com via M-Pesa.";
    const extracted = heuristicExtract("applicant", text);
    expect(extracted).toMatchObject({
      claimedEmployer: "Safaricom",
    });
    if ("feeAsks" in extracted) {
      expect(extracted.emails.some((e) => e.includes("gmail"))).toBe(true);
    }
  });
});

describe("extractFromText fallback", () => {
  it("uses heuristics when LLM_API_KEY is missing", async () => {
    vi.stubEnv("LLM_API_KEY", "");
    expect(isLlmConfigured()).toBe(false);
    const extracted = await extractFromText("job_offer", ACME);
    expect(extracted).toEqual(heuristicExtract("job_offer", ACME));
  });

  it("falls back to heuristics when the LLM request fails", async () => {
    vi.stubEnv("LLM_API_KEY", "test-key");
    vi.stubEnv("LLM_BASE_URL", "https://example.invalid/v1");
    vi.stubEnv("LLM_MODEL", "gpt-test");
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("boom", { status: 500 })),
    );

    const extracted = await extractFromText("job_offer", ACME);
    expect(extracted).toEqual(heuristicExtract("job_offer", ACME));
    expect(fetch).toHaveBeenCalled();
  });

  it("returns LLM JSON when the provider responds with a valid offer schema", async () => {
    vi.stubEnv("LLM_API_KEY", "test-key");
    vi.stubEnv("LLM_BASE_URL", "https://api.example.com/v1");
    vi.stubEnv("LLM_MODEL", "gpt-test");

    const llmPayload = {
      domain: "kencareers-apply.com",
      jobTitle: "Clerk",
      salary: null,
      contactMethod: "whatsapp",
      paymentTerms: "Ksh 1,500 registration",
      claimedOrg: "Acme Roads Authority",
      emails: ["hr.acmeroads@gmail.com"],
      phones: ["+254700000111"],
      urls: ["https://wa.me/254700000111"],
      rawSignals: ["off_platform_chat", "id_asked_early", "mobile_money"],
      channel: "whatsapp",
      asksForId: true,
      claimedHeadcount: 800,
    };

    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Response.json({
          choices: [{ message: { content: JSON.stringify(llmPayload) } }],
        }),
      ),
    );

    const extracted = await extractFromText("job_offer", ACME);
    expect(extracted).toMatchObject({
      claimedOrg: "Acme Roads Authority",
      channel: "whatsapp",
      asksForId: true,
      claimedHeadcount: 800,
      emails: ["hr.acmeroads@gmail.com"],
    });
  });
});

describe("LLM zod schemas", () => {
  it("accepts sparse offer payloads with defaults", () => {
    const parsed = llmOfferSchema.parse({
      claimedOrg: "Safaricom",
      emails: [],
      phones: [],
      urls: [],
      rawSignals: [],
    });
    expect(parsed.claimedOrg).toBe("Safaricom");
    expect(parsed.emails).toEqual([]);
  });

  it("accepts applicant payloads", () => {
    const parsed = llmApplicantSchema.parse({
      claimedEmployer: "Safaricom",
      emails: ["a@gmail.com"],
      phones: [],
      links: [],
      feeAsks: ["background fee"],
      rawSignals: ["free_email"],
    });
    expect(parsed.feeAsks).toContain("background fee");
  });
});
