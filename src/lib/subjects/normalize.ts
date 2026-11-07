import type { SubjectKind } from "@/lib/types";

const FREE_EMAIL = /@(gmail|yahoo|outlook|hotmail|icloud)\./i;
const DOMAIN_RE = /\b(?:https?:\/\/)?(?:www\.)?([a-z0-9-]+(?:\.[a-z0-9-]+)+)\b/gi;
const EMAIL_RE = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi;
const PHONE_RE = /(?:\+?254|0)(7\d{8})\b/g;
const HANDLE_RE = /@[a-z0-9_]{3,}/gi;

export function normalizeDomain(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .split("/")[0]
    .trim();
}

export function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.startsWith("254") && digits.length === 12) return `+${digits}`;
  if (digits.startsWith("0") && digits.length === 10) return `+254${digits.slice(1)}`;
  if (digits.length === 9 && digits.startsWith("7")) return `+254${digits}`;
  return raw.trim();
}

export function normalizeEmail(raw: string): string {
  return raw.trim().toLowerCase();
}

export function normalizeHandle(raw: string): string {
  const h = raw.trim().toLowerCase();
  return h.startsWith("@") ? h : `@${h}`;
}

export type DetectedSubject = { kind: SubjectKind; key: string };

/** Pull candidate subject keys from free text for community flagging / rules. */
export function detectSubjectsFromText(text: string): DetectedSubject[] {
  const found: DetectedSubject[] = [];
  const seen = new Set<string>();

  const push = (kind: SubjectKind, key: string) => {
    const id = `${kind}:${key}`;
    if (seen.has(id) || !key) return;
    seen.add(id);
    found.push({ kind, key });
  };

  for (const m of text.matchAll(EMAIL_RE)) {
    push("email", normalizeEmail(m[0]));
  }
  for (const m of text.matchAll(PHONE_RE)) {
    push("phone", normalizePhone(m[0]));
  }
  for (const m of text.matchAll(HANDLE_RE)) {
    push("handle", normalizeHandle(m[0]));
  }
  for (const m of text.matchAll(DOMAIN_RE)) {
    const domain = normalizeDomain(m[1] ?? m[0]);
    if (!domain.includes("@") && domain.includes(".")) {
      push("domain", domain);
    }
  }

  return found;
}

export function isFreeEmail(email: string): boolean {
  return FREE_EMAIL.test(email);
}
