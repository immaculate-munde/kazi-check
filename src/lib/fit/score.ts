import type { SeekerProfile } from "@/lib/profile/types";
import type { CheckRecord } from "@/lib/types";

export type FitResult = {
  score: number;
  label: "Strong match" | "Fair match" | "Weak match";
  matchBullets: string[];
  gapBullets: string[];
  roleTitle: string;
};

const STOP = new Set([
  "the",
  "and",
  "for",
  "with",
  "you",
  "your",
  "are",
  "our",
  "job",
  "role",
  "will",
  "this",
  "that",
  "from",
  "have",
  "been",
  "kenya",
  "nairobi",
  "please",
  "apply",
  "application",
  "position",
  "company",
  "team",
  "work",
  "working",
  "experience",
  "years",
  "must",
  "should",
  "able",
  "using",
  "including",
]);

function tokens(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9+#.\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 2 && !STOP.has(t));
}

function uniq(list: string[]): string[] {
  return [...new Set(list)];
}

export function extractRoleTitle(check: CheckRecord): string {
  const extracted = check.extracted as {
    roleTitle?: string;
    jobTitle?: string;
    claimedOrg?: string;
  };
  const title = extracted.roleTitle?.trim() || extracted.jobTitle?.trim();
  if (title) return title;
  const line = check.rawText.split("\n").map((l) => l.trim()).find(Boolean);
  return (line ?? "This role").slice(0, 80);
}

export function canPrepareForCheck(check: CheckRecord): boolean {
  return check.verdict !== "SCAM" && check.verdict !== "HIGH_RISK";
}

/** Heuristic fit score — no invented biography. */
export function scoreFit(profile: SeekerProfile, check: CheckRecord): FitResult {
  const roleTitle = extractRoleTitle(check);
  const jobTokens = uniq(tokens(`${roleTitle} ${check.rawText}`));
  const profileBlob = [
    profile.fullName,
    profile.headline,
    profile.summary,
    profile.skills.join(" "),
    profile.experience.map((e) => `${e.title} ${e.company} ${(e.bullets ?? []).join(" ")}`).join(" "),
    profile.education.map((e) => `${e.school} ${e.credential}`).join(" "),
    profile.rawCvText ?? "",
  ].join(" ");
  const profileTokens = new Set(tokens(profileBlob));
  const skillSet = new Set(profile.skills.map((s) => s.toLowerCase()));

  const matchedSkills = profile.skills.filter((s) =>
    jobTokens.some(
      (t) => s.toLowerCase().includes(t) || t.includes(s.toLowerCase().split(/\s+/)[0] ?? ""),
    ),
  );

  let hit = 0;
  for (const t of jobTokens) {
    if (profileTokens.has(t) || skillSet.has(t)) hit += 1;
  }
  const overlap = jobTokens.length ? hit / jobTokens.length : 0;
  const skillBoost = Math.min(0.25, matchedSkills.length * 0.05);
  const expBoost = Math.min(0.15, profile.experience.length * 0.04);
  const raw = Math.round(Math.min(0.95, overlap * 0.7 + skillBoost + expBoost) * 100);
  const score = Math.max(8, Math.min(96, raw));

  const label: FitResult["label"] =
    score >= 70 ? "Strong match" : score >= 45 ? "Fair match" : "Weak match";

  const matchBullets: string[] = [];
  if (matchedSkills.length) {
    matchBullets.push(`Overlapping skills: ${matchedSkills.slice(0, 5).join(", ")}`);
  }
  if (profile.experience[0]?.title) {
    matchBullets.push(
      `Recent role: ${profile.experience[0].title}${
        profile.experience[0].company ? ` at ${profile.experience[0].company}` : ""
      }`,
    );
  }
  if (profile.headline) {
    matchBullets.push(`Headline aligns with “${profile.headline}”`);
  }
  if (matchBullets.length === 0) {
    matchBullets.push("Some words from your profile appear in this job ad");
  }

  const missing = jobTokens
    .filter((t) => !profileTokens.has(t) && !skillSet.has(t))
    .filter((t) => t.length > 3)
    .slice(0, 8);
  const gapBullets: string[] = [];
  if (missing.length) {
    gapBullets.push(`Job mentions terms not clear on your CV: ${missing.slice(0, 5).join(", ")}`);
  }
  if (profile.experience.length === 0) {
    gapBullets.push("Add work experience so we can tailor bullets for this role");
  }
  if (profile.skills.length < 3) {
    gapBullets.push("Add more skills so the match score can improve");
  }
  if (gapBullets.length === 0) {
    gapBullets.push("Double-check the official careers page for must-have qualifications");
  }

  return {
    score,
    label,
    matchBullets: matchBullets.slice(0, 4).map((b) => b.replace(/^\s+/, "")),
    gapBullets: gapBullets.slice(0, 4),
    roleTitle,
  };
}
