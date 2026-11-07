import { readFileSync } from "fs";
import path from "path";
import type { EvidenceItem, Extracted, ExtractedOffer, OfficialListingMatch } from "@/lib/types";

export type OfficialListing = {
  orgName: string;
  aliases: string[];
  officialDomain: string;
  officialApplyRoute: "portal" | "email";
  applyUrl: string;
  emailDomain: string;
  listingTitle: string;
  listingUrl: string;
  dateIndexed: string;
  chargesFee: boolean;
};

let cached: OfficialListing[] | null = null;

export function loadOfficialListings(): OfficialListing[] {
  if (cached) return cached;
  const file = path.join(process.cwd(), "data", "official_listings.json");
  cached = JSON.parse(readFileSync(file, "utf8")) as OfficialListing[];
  return cached;
}

export function officialCoverageLabel(): string {
  const n = loadOfficialListings().length;
  return `Official listings indexed for ${n} organisations (snapshot, not a live feed).`;
}

function listingForOrg(org: string | null | undefined): OfficialListing | null {
  if (!org) return null;
  const needle = org.trim().toLowerCase();
  for (const row of loadOfficialListings()) {
    const names = [row.orgName, ...row.aliases].map((n) => n.toLowerCase());
    if (names.some((n) => needle === n || needle.includes(n) || n.includes(needle))) {
      return row;
    }
  }
  return null;
}

function adUsesOffPlatform(text: string, extracted: ExtractedOffer): boolean {
  if (/whatsapp|telegram|\bwa\.me\b/i.test(text)) return true;
  if (extracted.emails.some((e) => /@(gmail|yahoo|outlook|hotmail|icloud)\./i.test(e))) {
    return true;
  }
  return false;
}

function adUsesOfficialRoute(text: string, extracted: ExtractedOffer, row: OfficialListing): boolean {
  const blob = `${text} ${extracted.urls.join(" ")} ${extracted.emails.join(" ")} ${extracted.domain ?? ""}`.toLowerCase();
  if (blob.includes(row.officialDomain.toLowerCase())) return true;
  if (blob.includes(row.applyUrl.toLowerCase().replace(/^https?:\/\//, ""))) return true;
  if (extracted.emails.some((e) => e.toLowerCase().endsWith(`@${row.emailDomain.toLowerCase()}`))) {
    return true;
  }
  return false;
}

/**
 * Compare an extracted ad to the hand-seeded official careers index.
 * NO_LISTING_INDEXED is a gap only — never a red flag.
 */
export function matchOfficialListing(
  extracted: Extracted,
  rawText: string,
): OfficialListingMatch {
  const org =
    "claimedOrg" in extracted
      ? extracted.claimedOrg
      : "claimedEmployer" in extracted
        ? extracted.claimedEmployer
        : "employer" in extracted
          ? extracted.employer
          : null;

  const offer = extracted as ExtractedOffer;
  const row = listingForOrg(org ?? null);
  if (!row) {
    return {
      result: "NO_LISTING_INDEXED",
      detail: org
        ? `No official listing indexed for ${org}. Absence from this snapshot is not a flag — verify on the organisation's own site.`
        : "Could not match this ad to an indexed official careers listing.",
      listing: null,
    };
  }

  const officialRoute = adUsesOfficialRoute(rawText, offer, row);
  const offPlatform = adUsesOffPlatform(rawText, offer);

  if (offPlatform && !officialRoute) {
    return {
      result: "ROUTE_MISMATCH",
      detail: `${row.orgName} listings are applied via ${row.applyUrl} (indexed ${row.dateIndexed}). This ad uses WhatsApp, Telegram, or a free email instead.`,
      listing: row,
    };
  }

  if (officialRoute) {
    return {
      result: "MATCHES_LISTING",
      detail: `Apply route is consistent with ${row.orgName} official listing (${row.listingUrl}, indexed ${row.dateIndexed}).`,
      listing: row,
    };
  }

  return {
    result: "NO_LISTING_INDEXED",
    detail: `${row.orgName} is indexed, but this ad does not cite the official apply route. Treat as a gap: confirm at ${row.applyUrl}.`,
    listing: row,
  };
}

export function listingToEvidence(match: OfficialListingMatch): EvidenceItem | null {
  if (match.result === "MATCHES_LISTING") {
    return {
      ruleId: "official_listing_match",
      title: "Official listing match",
      snippet: match.detail,
      severity: "low",
      sourceType: "whitelist",
      points: 0,
    };
  }
  if (match.result === "ROUTE_MISMATCH") {
    return {
      ruleId: "official_route_mismatch",
      title: "Apply route does not match official listing",
      snippet: match.detail,
      severity: "high",
      sourceType: "heuristic",
      points: 30,
    };
  }
  return null;
}
