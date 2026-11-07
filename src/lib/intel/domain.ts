import { resolveMx } from "node:dns/promises";
import { DOMAIN_WHITELIST } from "@/lib/rules/whitelist";
import { isFreeEmail, normalizeDomain } from "@/lib/subjects/normalize";
import type { EvidenceItem, Extracted, ExtractedOffer, Finding } from "@/lib/types";
import { findingsFromIntel } from "@/lib/rules/findings";

export const RECENT_DOMAIN_DAYS = 180;
export const DOMAIN_AGE_POINTS = 10;

export type RdapResult =
  | { ok: true; registeredAt: Date | null; source: string }
  | { ok: false; reason: string; source: string };

export type MxResult = { ok: true; hasMx: boolean } | { ok: false };

export type DomainIntelLookups = {
  lookupRdap: (domain: string) => Promise<RdapResult>;
  lookupMx: (domain: string) => Promise<MxResult>;
};

const FREE_HOSTS = new Set([
  "gmail.com",
  "yahoo.com",
  "outlook.com",
  "hotmail.com",
  "icloud.com",
]);

export async function lookupRdap(domain: string): Promise<RdapResult> {
  const source = `https://rdap.org/domain/${domain}`;
  if (domain.endsWith(".example") || domain.endsWith(".test")) {
    return {
      ok: false,
      reason: "Reserved demonstration domain; no registry data exists.",
      source,
    };
  }
  try {
    const response = await fetch(source, {
      headers: { accept: "application/rdap+json" },
      signal: AbortSignal.timeout(6000),
      cache: "no-store",
    });
    if (response.status === 404) {
      return { ok: false, reason: "Domain not found in RDAP.", source };
    }
    if (!response.ok) {
      return { ok: false, reason: `RDAP responded with HTTP ${response.status}.`, source };
    }
    const data = (await response.json()) as {
      events?: { eventAction?: string; eventDate?: string }[];
    };
    const registration = data.events?.find((event) => event.eventAction === "registration")
      ?.eventDate;
    return {
      ok: true,
      registeredAt: registration ? new Date(registration) : null,
      source,
    };
  } catch {
    return {
      ok: false,
      reason: "RDAP lookup timed out or is unavailable for this TLD.",
      source,
    };
  }
}

export async function lookupMx(domain: string): Promise<MxResult> {
  try {
    const records = await resolveMx(domain);
    return { ok: true, hasMx: records.length > 0 };
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === "ENOTFOUND" || code === "ENODATA") return { ok: true, hasMx: false };
    return { ok: false };
  }
}

function hostFromEmail(email: string): string | null {
  const host = email.split("@")[1]?.toLowerCase().trim();
  return host || null;
}

function isOfficialHost(host: string): boolean {
  return Boolean(DOMAIN_WHITELIST[host]);
}

function isFreeHost(host: string): boolean {
  return FREE_HOSTS.has(host) || [...FREE_HOSTS].some((h) => host.endsWith(`.${h}`));
}

export function contactHosts(extracted: Extracted): {
  all: string[];
  email: string[];
  toAge: string[];
} {
  const offer = extracted as ExtractedOffer;
  const all = new Set<string>();
  const email = new Set<string>();
  if (offer.domain) all.add(normalizeDomain(offer.domain));
  for (const url of offer.urls ?? []) {
    try {
      const host = normalizeDomain(url.includes("://") ? new URL(url).hostname : url);
      if (host.includes(".")) all.add(host);
    } catch {
      const host = normalizeDomain(url);
      if (host.includes(".")) all.add(host);
    }
  }
  for (const addr of offer.emails ?? []) {
    const host = hostFromEmail(addr);
    if (!host) continue;
    email.add(host);
    if (!isFreeEmail(addr)) all.add(host);
  }
  const hosts = [...all].filter(Boolean);
  const toAge = hosts.filter((h) => !isFreeHost(h) && !isOfficialHost(h)).slice(0, 3);
  return { all: hosts, email: [...email], toAge };
}

function ageEvidence(input: {
  outcome: "flagged" | "passed" | "unknown";
  snippet: string;
  title?: string;
}): EvidenceItem {
  return {
    ruleId: "domain_age",
    title: input.title ?? "Domain registration age",
    snippet: input.snippet,
    severity: input.outcome === "flagged" ? "medium" : "low",
    source: "RDAP",
    sourceType: "heuristic",
    points: input.outcome === "flagged" ? DOMAIN_AGE_POINTS : 0,
    outcome: input.outcome,
  };
}

function mxEvidence(
  snippet: string,
  outcome: "flagged" | "passed" | "unknown",
): EvidenceItem {
  return {
    ruleId: "dns_mx",
    title: "Email domain DNS (informational)",
    snippet,
    severity: "low",
    source: "DNS",
    sourceType: "heuristic",
    points: 0,
    outcome,
  };
}

export type DomainIntelResult = {
  evidence: EvidenceItem[];
  findings: Finding[];
};

/**
 * RDAP + MX as extra evidence. Unknown and MX never stamp a verdict.
 * Live lookups are skipped under Vitest so engine tests stay offline.
 */
export async function collectDomainIntel(
  extracted: Extracted,
  lookups?: DomainIntelLookups,
): Promise<DomainIntelResult> {
  const hosts = contactHosts(extracted);
  const evidence: EvidenceItem[] = [];

  if (hosts.toAge.length === 0) {
    evidence.push(
      ageEvidence({
        outcome: hosts.all.length ? "passed" : "unknown",
        snippet: hosts.all.length
          ? hosts.all.join(", ")
          : "No website or email domain was found to check.",
      }),
    );
    return { evidence, findings: findingsFromIntel(evidence) };
  }

  const impl = lookups ?? (process.env.VITEST ? null : { lookupRdap, lookupMx });
  if (!impl) {
    evidence.push(
      ageEvidence({
        outcome: "unknown",
        snippet: `${hosts.toAge.join(", ")}: live RDAP skipped in tests.`,
      }),
    );
    return { evidence, findings: findingsFromIntel(evidence) };
  }

  const lookupsRdap = await Promise.all(
    hosts.toAge.map(async (domain) => ({ domain, result: await impl.lookupRdap(domain) })),
  );
  const now = Date.now();
  const recent = lookupsRdap.filter(
    (l) =>
      l.result.ok &&
      l.result.registeredAt &&
      now - l.result.registeredAt.getTime() < RECENT_DOMAIN_DAYS * 86_400_000,
  );
  const known = lookupsRdap.filter((l) => l.result.ok && l.result.registeredAt);
  const snippet = lookupsRdap
    .map((l) =>
      l.result.ok && l.result.registeredAt
        ? `${l.domain}: registered ${l.result.registeredAt.toISOString().slice(0, 10)}`
        : `${l.domain}: ${l.result.ok ? "no registration date published" : l.result.reason}`,
    )
    .join("\n");
  const outcome = recent.length
    ? "flagged"
    : known.length === lookupsRdap.length
      ? "passed"
      : "unknown";
  evidence.push(ageEvidence({ outcome, snippet }));

  const emailDomains = hosts.email.filter((d) => hosts.toAge.includes(d)).slice(0, 2);
  if (emailDomains.length) {
    const mx = await Promise.all(
      emailDomains.map(async (d) => ({ d, r: await impl.lookupMx(d) })),
    );
    const noMx = mx.filter((m) => m.r.ok && !m.r.hasMx);
    const mxUnknown = mx.some((m) => !m.r.ok);
    const mxOutcome = noMx.length
      ? "flagged"
      : mxUnknown
        ? "unknown"
        : "passed";
    evidence.push(
      mxEvidence(
        mx
          .map((m) => `${m.d}: ${m.r.ok ? (m.r.hasMx ? "MX present" : "no MX records") : "lookup failed"}`)
          .join("\n"),
        mxOutcome,
      ),
    );
  }

  return { evidence, findings: findingsFromIntel(evidence) };
}
