import type { EvidenceItem, Extracted, ExtractedOffer, OfficialListingMatch } from "@/lib/types";
import {
  findOrganisation,
  officialCoverageLabel,
  type OfficialListing,
} from "@/lib/orgs/directory";

export type { OfficialListing };
export { officialCoverageLabel, findOrganisation as listingForOrg };
export { loadOfficialListings } from "@/lib/orgs/directory";

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
  const row = findOrganisation(org ?? null);
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
