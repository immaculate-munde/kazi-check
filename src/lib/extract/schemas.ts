import { z } from "zod";

const stringList = z.array(z.string()).default([]);

export const llmOfferSchema = z.object({
  domain: z.string().nullable().optional(),
  jobTitle: z.string().nullable().optional(),
  salary: z.string().nullable().optional(),
  contactMethod: z.string().nullable().optional(),
  paymentTerms: z.string().nullable().optional(),
  claimedOrg: z.string().nullable().optional(),
  emails: stringList,
  phones: stringList,
  urls: stringList,
  rawSignals: stringList,
  channel: z.string().nullable().optional(),
  asksForId: z.boolean().optional(),
  claimedHeadcount: z.number().int().nullable().optional(),
});

export const llmApplicantSchema = z.object({
  claimedEmployer: z.string().nullable().optional(),
  claimedEducation: z.string().nullable().optional(),
  emails: stringList,
  phones: stringList,
  links: stringList,
  feeAsks: stringList,
  rawSignals: stringList,
});

export type LlmOfferParsed = z.infer<typeof llmOfferSchema>;
export type LlmApplicantParsed = z.infer<typeof llmApplicantSchema>;

/** JSON Schema (draft-ish) for providers that support response_format.json_schema. */
export const OFFER_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    domain: { type: ["string", "null"] },
    jobTitle: { type: ["string", "null"] },
    salary: { type: ["string", "null"] },
    contactMethod: { type: ["string", "null"] },
    paymentTerms: { type: ["string", "null"] },
    claimedOrg: { type: ["string", "null"] },
    emails: { type: "array", items: { type: "string" } },
    phones: { type: "array", items: { type: "string" } },
    urls: { type: "array", items: { type: "string" } },
    rawSignals: { type: "array", items: { type: "string" } },
    channel: { type: ["string", "null"] },
    asksForId: { type: "boolean" },
    claimedHeadcount: { type: ["integer", "null"] },
  },
  required: [
    "domain",
    "jobTitle",
    "salary",
    "contactMethod",
    "paymentTerms",
    "claimedOrg",
    "emails",
    "phones",
    "urls",
    "rawSignals",
    "channel",
    "asksForId",
    "claimedHeadcount",
  ],
} as const;

export const APPLICANT_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    claimedEmployer: { type: ["string", "null"] },
    claimedEducation: { type: ["string", "null"] },
    emails: { type: "array", items: { type: "string" } },
    phones: { type: "array", items: { type: "string" } },
    links: { type: "array", items: { type: "string" } },
    feeAsks: { type: "array", items: { type: "string" } },
    rawSignals: { type: "array", items: { type: "string" } },
  },
  required: [
    "claimedEmployer",
    "claimedEducation",
    "emails",
    "phones",
    "links",
    "feeAsks",
    "rawSignals",
  ],
} as const;
