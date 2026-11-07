import type {
  CheckDirection,
  Extracted,
  ExtractedApplicant,
  ExtractedOffer,
} from "@/lib/types";
import { detectSubjectsFromText, isFreeEmail } from "@/lib/subjects/normalize";

/**
 * Scaffold extractor: heuristic parse now.
 * BE-3: replace with LLM JSON-schema extract (OpenAI/Gemini) + keep this as fallback.
 */
export async function extractFromText(
  direction: CheckDirection,
  text: string,
): Promise<Extracted> {
  if (process.env.LLM_API_KEY) {
    try {
      return await extractWithLlm(direction, text);
    } catch {
      // fall through to heuristics
    }
  }
  return heuristicExtract(direction, text);
}

async function extractWithLlm(
  direction: CheckDirection,
  text: string,
): Promise<Extracted> {
  // Scaffold stub; implement real provider call in issue work.
  void direction;
  void text;
  throw new Error("LLM extract not implemented yet");
}

function heuristicExtract(direction: CheckDirection, text: string): Extracted {
  const subjects = detectSubjectsFromText(text);
  const emails = subjects.filter((s) => s.kind === "email").map((s) => s.key);
  const phones = subjects.filter((s) => s.kind === "phone").map((s) => s.key);
  const domains = subjects.filter((s) => s.kind === "domain").map((s) => s.key);
  const urls = (text.match(/https?:\/\/\S+/gi) ?? []).map((u) => u.replace(/[),.;]+$/, ""));

  const feeHits =
    text.match(
      /(?:interview|medical|visa|training|background|application)\s+(?:fee|fees|payment|pay)/gi,
    ) ?? [];

  if (direction === "applicant") {
    const out: ExtractedApplicant = {
      claimedEmployer: guessClaimedOrg(text),
      claimedEducation: null,
      emails,
      phones,
      links: [...urls, ...domains],
      feeAsks: feeHits,
      rawSignals: collectSignals(text, emails),
    };
    return out;
  }

  const out: ExtractedOffer = {
    domain: domains[0] ?? null,
    jobTitle:
      text.match(/(?:position|role|title|hiring)\s*[:\-]?\s*(.+)/i)?.[1]
        ?.split("\n")[0]
        ?.trim()
        .slice(0, 100) ?? null,
    salary: text.match(/(?:KES|Ksh|USD)\s?[\d,]+/i)?.[0] ?? null,
    contactMethod: phones[0] ? "phone" : emails[0] ? "email" : null,
    paymentTerms: feeHits[0] ?? null,
    claimedOrg: guessClaimedOrg(text),
    emails,
    phones,
    urls: [...urls, ...domains],
    rawSignals: collectSignals(text, emails),
  };
  return out;
}

function guessClaimedOrg(text: string): string | null {
  const m = text.match(
    /\b(KenGen|Safaricom|KRA|Equity Bank|KCB|Ministry of|UN|WHO|Google|Microsoft)\b/i,
  );
  return m?.[0] ?? null;
}

function collectSignals(text: string, emails: string[]): string[] {
  const signals: string[] = [];
  if (/whatsapp|telegram/i.test(text)) signals.push("off_platform_chat");
  if (/urgent|immediately|today only/i.test(text)) signals.push("urgency");
  if (emails.some(isFreeEmail)) signals.push("free_email");
  if (/mpesa|m-pesa|send money/i.test(text)) signals.push("mobile_money");
  return signals;
}
