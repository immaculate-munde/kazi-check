import { readFileSync } from "fs";
import path from "path";

export type MasterProfile = {
  fullName: string;
  headline: string;
  location: string;
  skills: string[];
  experienceSummary: string;
  education: string;
  availability?: string;
};

export function loadMasterProfile(): MasterProfile {
  const file = path.join(process.cwd(), "data", "master_profile.json");
  const profile = JSON.parse(readFileSync(file, "utf8")) as MasterProfile;
  const blob = JSON.stringify(profile);
  if (/kra\s*pin|passport|idNumber|national id/i.test(blob)) {
    throw new Error("Master profile must not contain ID, KRA PIN or passport details.");
  }
  return profile;
}

/**
 * Copy-only cover message. Never sent to an employer.
 * Never claims skills that are not in the profile.
 */
export function draftApplication(adText: string, jobTitle?: string | null): string {
  const profile = loadMasterProfile();
  const title = jobTitle?.trim() || guessTitle(adText) || "the advertised role";
  const org = guessOrg(adText);

  return [
    `Hello${org ? ` ${org} team` : ""},`,
    "",
    `I am ${profile.fullName}, a ${profile.headline} based in ${profile.location}. I would like to be considered for ${title}.`,
    "",
    profile.experienceSummary,
    "",
    `Skills I can speak to from my own work: ${profile.skills.join(", ")}.`,
    `Education: ${profile.education}.`,
    profile.availability ? `Availability: ${profile.availability}.` : "",
    "",
    "I have not attached identity documents. Happy to share a CV through your official careers channel.",
    "",
    `Kind regards,`,
    profile.fullName,
  ]
    .filter((line) => line !== "")
    .join("\n");
}

function guessTitle(text: string): string | null {
  return (
    text.match(/(?:position|role|title|hiring)\s*[:\-]?\s*(.+)/i)?.[1]
      ?.split("\n")[0]
      ?.trim()
      .slice(0, 80) ?? null
  );
}

function guessOrg(text: string): string | null {
  return (
    text.match(
      /\b(KenGen|Safaricom|KRA|Equity Bank|KCB|Kenya Railways|KNEC|Central Bank of Kenya)\b/i,
    )?.[0] ?? null
  );
}
