import { readFileSync } from "fs";
import path from "path";

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

/** Snapshot used by the matcher. Seed copies this into Postgres. */
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

export function findOrganisation(org: string | null | undefined): OfficialListing | null {
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

export function listingToDirectoryRow(row: OfficialListing) {
  return {
    orgName: row.orgName,
    applyUrl: row.applyUrl,
    dateIndexed: row.dateIndexed,
  };
}
