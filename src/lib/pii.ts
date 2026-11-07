/**
 * Mask victim identifiers before anything is stored or logged.
 * Phones, emails, domains, and pay numbers are kept — they are registry keys.
 */

const KRA_PIN = /\b[A-Z]\d{9}[A-Z]\b/gi;
const PASSPORT =
  /\b(?:passport(?:\s*(?:no|number|num|#))?)[:\s#-]*([A-Z]{1,2}\d{6,8})\b/gi;
const ID_LABELLED =
  /\b(?:national\s+id|id\s*(?:no|number|num|#)|huduma(?:\s*namba)?)[:\s#-]*(\d{7,8})\b/gi;
const NAME_CLAIM =
  /\b((?:my name is|i am|i'm|full name[:\s]+|candidate[:\s]+)\s*)([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3})\b/gi;

export type MaskResult = {
  masked: string;
  redacted: number;
};

export function maskPii(text: string): MaskResult {
  let redacted = 0;

  let masked = text.replace(KRA_PIN, () => {
    redacted += 1;
    return "[KRA_PIN]";
  });
  masked = masked.replace(PASSPORT, () => {
    redacted += 1;
    return "[PASSPORT]";
  });
  masked = masked.replace(ID_LABELLED, () => {
    redacted += 1;
    return "[ID_NUMBER]";
  });
  masked = masked.replace(NAME_CLAIM, (_m, lead: string) => {
    redacted += 1;
    return `${lead}[NAME]`;
  });

  return { masked, redacted };
}

export function stillContainsSensitivePii(text: string): boolean {
  return (
    /\b[A-Z]\d{9}[A-Z]\b/.test(text) ||
    /passport[:\s#]*[A-Z]{1,2}\d{6,8}/i.test(text) ||
    /(?:id\s*(?:no|number|#)[:\s#]*)\d{7,8}/i.test(text)
  );
}
