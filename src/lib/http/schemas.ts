import { z } from "zod";

export const createCheckSchema = z.object({
  direction: z.enum(["job_offer", "applicant", "offer_letter"]),
  text: z.string().optional(),
  url: z.string().optional(),
  phone_for_sms: z.string().optional(),
});

export const flagSchema = z.object({
  kind: z.enum(["domain", "phone", "url", "handle", "email"]).optional(),
  key: z.string().optional(),
  checkId: z.string().optional(),
  reason: z.string().min(3).max(500),
});

export const smsSchema = z.object({
  phone: z.string().min(9),
});

export const skillMatchSchema = z.object({
  jobText: z.string().min(20),
  cvText: z.string().min(20),
  jobTitle: z.string().optional(),
  checkId: z.string().optional(),
});

export const quizSubmitSchema = z.object({
  domain: z.string().optional(),
  answers: z.array(
    z.object({
      questionId: z.string(),
      // -1 means unanswered; scored as incorrect
      selectedIndex: z.number().int().min(-1),
    }),
  ),
});

export const offerSchema = z.object({
  text: z.string().min(20),
});

export const trackerSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(2),
  employer: z.string().min(2),
  source: z.string().optional(),
  verificationResult: z.string().optional(),
  checkId: z.string().optional(),
  status: z
    .enum(["saved", "applied", "interview", "offer", "rejected", "withdrawn"])
    .optional(),
  notes: z.string().optional(),
  followUpDate: z.string().optional(),
});
