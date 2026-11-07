import { findOfficialOrganization, IMPERSONATIONS } from "@/lib/rules/whitelist";
import type { CheckRecord } from "@/lib/types";

export function resolveOfficialEmployer(check: CheckRecord) {
  const extracted = check.extracted;
  const claimedOrg =
    "claimedOrg" in extracted
      ? extracted.claimedOrg
      : "claimedEmployer" in extracted
        ? extracted.claimedEmployer
        : null;
  const domain = "domain" in extracted ? extracted.domain : null;
  const impersonation = domain
    ? IMPERSONATIONS.find((item) =>
        domain.toLowerCase().includes(item.fake.toLowerCase()),
      )
    : null;
  return (
    findOfficialOrganization(claimedOrg) ??
    findOfficialOrganization(check.officialListing?.listing?.orgName) ??
    findOfficialOrganization(impersonation?.org) ??
    findOfficialOrganization(domain)
  );
}
