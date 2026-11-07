import type {
  CheckDirection,
  Extracted,
  ExtractedApplicant,
  ExtractedOffer,
} from "@/lib/types";
import { extractWithLlm, isLlmConfigured } from "@/lib/extract/llm";
import { detectSubjectsFromText, isFreeEmail } from "@/lib/subjects/normalize";

const KNOWN_ORGS =
  /\b(KenGen|Safaricom|KRA|Kenya Revenue Authority|Equity Bank|KCB|Kenya Railways|KNEC|Kenya National Examinations Council|Central Bank of Kenya|CBK|Public Service Commission|PSC|Kenya Defence Forces|KDF|Ministry of Defence|Ministry of [\w\s]+|UN|WHO|Google|Microsoft)\b/i;

const ORG_SHAPE =
  /\b([A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z]+){0,4}\s+(?:Authority|Commission|Corporation|Council|PLC))\b/;

const UPFRONT_FEE =
  /(?:interview|medical|visa|training|background|application|registration|clearance|processing)\s+(?:fee|fees|payment)|(?:pay|send|deposit)\s+(?:kes|ksh|kshs)?\s*[\d,]+|(?:kes|ksh|kshs)\s*[\d,]+\s+(?:registration|clearance|medical|interview|fee|deposit)/i;

/**
 * Prefer LLM schema fill when configured; heuristics otherwise.
 * LLM must never pick a verdict — rules engine owns that.
 */
export async function extractFromText(
  direction: CheckDirection,
  text: string,
): Promise<Extracted> {
  if (isLlmConfigured()) {
    try {
      return await extractWithLlm(direction, text);
    } catch {
      // fall through to heuristics
    }
  }
  return heuristicExtract(direction, text);
}

export { extractWithLlm, isLlmConfigured };

export function heuristicExtract(direction: CheckDirection, text: string): Extracted {
  const subjects = detectSubjectsFromText(text);
  const emails = subjects.filter((s) => s.kind === "email").map((s) => s.key);
  const phones = subjects.filter((s) => s.kind === "phone").map((s) => s.key);
  const domains = subjects.filter((s) => s.kind === "domain").map((s) => s.key);
  const urls = (text.match(/https?:\/\/\S+/gi) ?? []).map((u) => u.replace(/[),.;]+$/, ""));

  const feeHits: string[] =
    text.match(
      /(?:interview|medical|visa|training|background|application|registration|clearance|processing)\s+(?:fee|fees|payment|pay)/gi,
    ) ?? [];
  if (UPFRONT_FEE.test(text) && feeHits.length === 0) {
    const money = text.match(/(?:kes|ksh|kshs)\s*[\d,]+[^.\n]{0,40}/i);
    if (money) feeHits.push(money[0]);
  }

  const headcount = parseHeadcount(text);
  const asksForId = asksForIdentity(text);
  const channel = detectChannel(text, urls);

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
    contactMethod: channel ?? (phones[0] ? "phone" : emails[0] ? "email" : null),
    paymentTerms: feeHits[0] ?? null,
    claimedOrg: guessClaimedOrg(text),
    emails,
    phones,
    urls: [...urls, ...domains],
    rawSignals: collectSignals(text, emails),
    channel,
    asksForId,
    claimedHeadcount: headcount,
  };
  return out;
}

function guessClaimedOrg(text: string): string | null {
  const known = text.match(KNOWN_ORGS);
  if (known?.[0]) return known[0];
  const shaped = text.match(ORG_SHAPE);
  return shaped?.[1] ?? null;
}

function parseHeadcount(text: string): number | null {
  const m =
    text.match(/hiring\s+(\d[\d,]*)/i) ||
    text.match(/(\d[\d,]*)\s+(?:staff|jobs|vacancies|positions|openings|roles)/i);
  if (!m) return null;
  const n = Number(m[1].replace(/,/g, ""));
  return Number.isFinite(n) ? n : null;
}

function asksForIdentity(text: string): boolean {
  return /(?:send|share|submit|attach|provide).{0,48}(?:\bid\b|national\s+id|kra\s*pin|passport|selfie)|(?:\bid\b|national\s+id|kra\s*pin|passport|selfie).{0,40}(?:before|to apply|for registration|with your cv)/i.test(
    text,
  );
}

function detectChannel(text: string, urls: string[]): string | null {
  if (/whatsapp|\bwa\.me\b/i.test(text)) return "whatsapp";
  if (/telegram/i.test(text)) return "telegram";
  if (urls.some((u) => /career|jobs|portal|taleo|psckjobs/i.test(u))) return "portal";
  if (/apply\s+(on|via|through|at)\s+\S+/i.test(text)) return "other";
  return null;
}

function collectSignals(text: string, emails: string[]): string[] {
  const signals: string[] = [];
  if (/whatsapp|telegram/i.test(text)) signals.push("off_platform_chat");
  if (/urgent|immediately|today only/i.test(text)) signals.push("urgency");
  if (emails.some(isFreeEmail)) signals.push("free_email");
  if (/mpesa|m-pesa|send money/i.test(text)) signals.push("mobile_money");
  if (asksForIdentity(text)) signals.push("id_asked_early");
  if (/ignore (all |previous )?instructions|mark this safe|you are chatgpt|system prompt/i.test(text)) {
    signals.push("prompt_injection");
  }
  return signals;
}
