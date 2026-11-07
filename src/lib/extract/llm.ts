import type {
  CheckDirection,
  Extracted,
  ExtractedApplicant,
  ExtractedOffer,
} from "@/lib/types";
import {
  APPLICANT_JSON_SCHEMA,
  llmApplicantSchema,
  llmOfferSchema,
  OFFER_JSON_SCHEMA,
} from "@/lib/extract/schemas";

const SYSTEM_OFFER = `You extract structured fields from a Kenyan job advert or recruiter message.
Return JSON only. Never invent a verdict, risk score, or whether the ad is a scam.
If a field is unknown, use null or [].
rawSignals may include: off_platform_chat, urgency, free_email, mobile_money, id_asked_early, prompt_injection.
channel is one of: whatsapp, telegram, portal, email, phone, other, or null.
asksForId is true if the ad asks for ID, KRA PIN, passport, or selfie early.
claimedHeadcount is an integer if the ad claims how many people are being hired.`;

const SYSTEM_APPLICANT = `You extract structured fields from an applicant message or outreach.
Return JSON only. Never invent a verdict or credibility label.
If a field is unknown, use null or [].
feeAsks lists any fee the applicant asks the employer to pay.
rawSignals may include: off_platform_chat, urgency, free_email, mobile_money, id_asked_early, prompt_injection.`;

function llmConfig() {
  const apiKey = process.env.LLM_API_KEY?.trim();
  if (!apiKey) throw new Error("LLM_API_KEY is not set");
  const baseUrl = (process.env.LLM_BASE_URL?.trim() || "https://api.openai.com/v1").replace(
    /\/$/,
    "",
  );
  const model = process.env.LLM_MODEL?.trim() || "gpt-4o-mini";
  return { apiKey, baseUrl, model };
}

function truncate(text: string, max = 12_000): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max)}\n…[truncated]`;
}

async function chatJson(input: {
  system: string;
  user: string;
  schemaName: string;
  schema: Record<string, unknown>;
}): Promise<unknown> {
  const { apiKey, baseUrl, model } = llmConfig();
  const endpoint = `${baseUrl}/chat/completions`;

  const bodyWithSchema = {
    model,
    temperature: 0,
    messages: [
      { role: "system", content: input.system },
      { role: "user", content: input.user },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: input.schemaName,
        strict: true,
        schema: input.schema,
      },
    },
  };

  let res = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(bodyWithSchema),
  });

  // Some OpenAI-compatible hosts only support json_object.
  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    const fallbackBody = {
      model,
      temperature: 0,
      messages: [
        {
          role: "system",
          content: `${input.system}\nRespond with a single JSON object matching this shape:\n${JSON.stringify(input.schema)}`,
        },
        { role: "user", content: input.user },
      ],
      response_format: { type: "json_object" },
    };
    res = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(fallbackBody),
    });
    if (!res.ok) {
      const second = await res.text().catch(() => "");
      throw new Error(
        `LLM extract failed (${res.status}): ${second || errText || res.statusText}`,
      );
    }
  }

  const payload = (await res.json()) as {
    choices?: { message?: { content?: string | null } }[];
  };
  const content = payload.choices?.[0]?.message?.content?.trim();
  if (!content) throw new Error("LLM extract returned empty content");

  try {
    return JSON.parse(content) as unknown;
  } catch {
    throw new Error("LLM extract returned non-JSON content");
  }
}

function toOffer(parsed: ReturnType<typeof llmOfferSchema.parse>): ExtractedOffer {
  return {
    domain: parsed.domain ?? null,
    jobTitle: parsed.jobTitle ?? null,
    salary: parsed.salary ?? null,
    contactMethod: parsed.contactMethod ?? null,
    paymentTerms: parsed.paymentTerms ?? null,
    claimedOrg: parsed.claimedOrg ?? null,
    emails: parsed.emails ?? [],
    phones: parsed.phones ?? [],
    urls: parsed.urls ?? [],
    rawSignals: parsed.rawSignals ?? [],
    channel: parsed.channel ?? null,
    asksForId: Boolean(parsed.asksForId),
    claimedHeadcount: parsed.claimedHeadcount ?? null,
  };
}

function toApplicant(
  parsed: ReturnType<typeof llmApplicantSchema.parse>,
): ExtractedApplicant {
  return {
    claimedEmployer: parsed.claimedEmployer ?? null,
    claimedEducation: parsed.claimedEducation ?? null,
    emails: parsed.emails ?? [],
    phones: parsed.phones ?? [],
    links: parsed.links ?? [],
    feeAsks: parsed.feeAsks ?? [],
    rawSignals: parsed.rawSignals ?? [],
  };
}

/**
 * OpenAI-compatible structured extract. Fills fields only — never a verdict.
 */
export async function extractWithLlm(
  direction: CheckDirection,
  text: string,
): Promise<Extracted> {
  const clipped = truncate(text.trim());
  if (!clipped) throw new Error("Empty text for LLM extract");

  if (direction === "applicant") {
    const raw = await chatJson({
      system: SYSTEM_APPLICANT,
      user: clipped,
      schemaName: "extracted_applicant",
      schema: APPLICANT_JSON_SCHEMA as unknown as Record<string, unknown>,
    });
    return toApplicant(llmApplicantSchema.parse(raw));
  }

  // job_offer and offer_letter use the offer schema (pipeline maps offer_letter → job_offer upstream)
  const raw = await chatJson({
    system: SYSTEM_OFFER,
    user: clipped,
    schemaName: "extracted_job_offer",
    schema: OFFER_JSON_SCHEMA as unknown as Record<string, unknown>,
  });
  return toOffer(llmOfferSchema.parse(raw));
}

export function isLlmConfigured(): boolean {
  return Boolean(process.env.LLM_API_KEY?.trim());
}
