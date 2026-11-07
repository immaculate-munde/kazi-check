export type PatternMatch = { matched: boolean; snippets: string[] };

/** Fee / M-Pesa / till — WhatsApp-only is a separate rule in runRules. */
const PAYMENT_PATTERNS = [
  /\b(?:application|registration|processing|activation|interview|medical|training|uniform|clearance|booking|commitment|facilitation|placement|visa)\s+fees?\b/i,
  /\bpay(?:ment)?\s+(?:of\s+)?(?:ksh|kshs|kes|sh)\.?\s?[\d,]+/i,
  /\b(?:send|pay|deposit|transfer)\b[^.\n]{0,60}\b(?:m-?pesa|paybill|till\s*(?:no|number)?|airtel\s*money|bank\s*account)\b/i,
  /\b(?:m-?pesa|paybill|till\s*(?:no|number))\b[^.\n]{0,60}\b(?:fee|ksh|kshs|kes|pay|send)\b/i,
  /\b(?:pay|deposit|transfer|send)\b[^.\n]{0,80}\b(?:after|once|upon|when)\b[^.\n]{0,40}\b(?:shortlist|selection|offer|interview|training|approval|start)\b/i,
  /\bto\s+(?:secure|confirm|reserve)\s+(?:your\s+)?(?:slot|position|place|interview|job|chance)\b/i,
];

const URGENCY_PATTERNS = [
  /\b(?:urgent(?:ly)?|immediately|asap|right away)\b/i,
  /\b(?:limited|few)\s+(?:slots|positions|chances|vacancies)\b/i,
  /\bwithin\s+\d+\s*(?:hours|hrs|minutes|mins)\b/i,
  /\b(?:today\s+only|deadline\s+(?:is\s+)?today|before\s+(?:midnight|tomorrow)|last\s+chance|act\s+now)\b/i,
  /\b(?:you\s+have\s+been|you\s+are|you've\s+been)\s+(?:shortlisted|selected|hired)\b/i,
];

const SALARY_PATTERNS = [
  /\bearn\s+(?:up\s+to\s+)?(?:ksh|kshs|kes|\$|usd)?\.?\s?[\d,]+\s*(?:daily|per\s+day|a\s+day|weekly|per\s+week|per\s+hour)\b/i,
  /\bguaranteed\s+(?:job|employment|income|salary|visa|placement|earnings)\b/i,
  /\bno\s+(?:experience|qualifications|interview)\s+(?:needed|required)\b/i,
  /\b(?:\$|usd)\s?[3-9],?\d{3}\s*(?:\/|per\s+)?(?:month|monthly)\b/i,
];

const SENSITIVE_PATTERNS = [
  /\b(?:m-?pesa|atm|card|bank|sim)\s+pin\b/i,
  /\b(?:send|share|give|provide)\s+(?:us\s+)?(?:your\s+)?(?:pin|password)\b/i,
  /\b(?:email|account|mpesa|m-pesa)\s+password\b/i,
  /\b(?:copy|scan|photo|picture|selfie)\s+of\s+(?:your\s+)?(?:national\s+)?(?:id|identity\s+card|passport|selfie)\b/i,
  /\b(?:send|share|submit)\s+(?:your\s+)?(?:national\s+)?(?:id|passport|selfie|bank\s+details|card\s+number|otp)\b/i,
  /\b(?:otp|one[-\s]time\s+(?:code|password)|verification\s+code)\b/i,
  /\b(?:id\s+number|national\s+id|id\s+card|passport\s+photo|selfie)\s+(?:to|for|before|after)\s+(?:approval|processing|interview|screening)\b/i,
];

function snippetAround(text: string, index: number, length: number): string {
  const start = Math.max(0, index - 40);
  const end = Math.min(text.length, index + length + 40);
  return `${start > 0 ? "…" : ""}${text.slice(start, end).replace(/\s+/g, " ").trim()}${end < text.length ? "…" : ""}`;
}

function matchAny(text: string, patterns: RegExp[]): PatternMatch {
  const snippets: string[] = [];
  for (const pattern of patterns) {
    const match = pattern.exec(text);
    if (match) snippets.push(snippetAround(text, match.index, match[0].length));
  }
  return { matched: snippets.length > 0, snippets: [...new Set(snippets)].slice(0, 3) };
}

export const detectPaymentRequest = (text: string) => matchAny(text, PAYMENT_PATTERNS);
export const detectUrgency = (text: string) => matchAny(text, URGENCY_PATTERNS);
export const detectUnrealisticSalary = (text: string) => matchAny(text, SALARY_PATTERNS);
export const detectSensitiveRequest = (text: string) => matchAny(text, SENSITIVE_PATTERNS);
