import { z } from "zod";

export const createCheckSchema = z.object({
  direction: z.enum(["job_offer", "applicant"]),
  text: z.string().optional(),
  url: z.string().optional(),
  phone_for_sms: z.string().optional(),
});

export const flagSchema = z.object({
  kind: z.enum(["domain", "phone", "url", "handle", "email"]).optional(),
  key: z.string().optional(),
  checkId: z.string().optional(),
  reason: z.string().max(500).optional(),
});

export const smsSchema = z.object({
  phone: z.string().min(9),
});
