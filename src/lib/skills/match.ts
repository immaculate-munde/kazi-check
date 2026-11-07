import type { SkillGapRow, SkillMatchRecord } from "@/lib/types";
import { randomUUID } from "crypto";

const SKILL_KEYWORDS: { skill: string; patterns: RegExp[]; requirementDefault: SkillGapRow["requirement"] }[] = [
  {
    skill: "Networking",
    patterns: [/network/i, /tcp\/?ip/i, /routing/i, /switching/i, /lan|wan/i],
    requirementDefault: "high",
  },
  {
    skill: "Windows administration",
    patterns: [/windows/i, /active directory/i, /powershell/i],
    requirementDefault: "high",
  },
  {
    skill: "Hardware troubleshooting",
    patterns: [/hardware/i, /troubleshoot/i, /repair/i, /desktop support/i],
    requirementDefault: "high",
  },
  {
    skill: "Database management",
    patterns: [/database/i, /sql/i, /postgres|mysql|mongo/i],
    requirementDefault: "medium",
  },
  {
    skill: "Programming",
    patterns: [/program/i, /python|javascript|java|typescript|react/i, /coding/i],
    requirementDefault: "low",
  },
  {
    skill: "Cybersecurity",
    patterns: [/cyber|security|firewall|threat|vulnerability/i],
    requirementDefault: "medium",
  },
  {
    skill: "Accounting",
    patterns: [/account/i, /bookkeep/i, /finance|ifrs|quickbooks/i],
    requirementDefault: "high",
  },
  {
    skill: "Human Resources",
    patterns: [/human resource|\bhr\b|recruitment|employee relations/i],
    requirementDefault: "high",
  },
  {
    skill: "Marketing",
    patterns: [/market/i, /campaign/i, /seo|social media/i],
    requirementDefault: "medium",
  },
];

function levelFromOverlap(jobHit: boolean, cvHit: boolean): SkillGapRow["assessment"] {
  if (jobHit && cvHit) return "strong";
  if (jobHit && !cvHit) return "missing";
  if (!jobHit && cvHit) return "developing";
  return "needs_improvement";
}

export function runSkillMatch(input: {
  jobText: string;
  cvText: string;
  jobTitle?: string;
  checkId?: string;
}): SkillMatchRecord {
  const gaps: SkillGapRow[] = [];

  for (const row of SKILL_KEYWORDS) {
    const jobHit = row.patterns.some((p) => p.test(input.jobText));
    const cvHit = row.patterns.some((p) => p.test(input.cvText));
    if (!jobHit && !cvHit) continue;

    const assessment = levelFromOverlap(jobHit, cvHit);
    gaps.push({
      skill: row.skill,
      requirement: jobHit ? row.requirementDefault : "low",
      assessment,
      note: jobHit
        ? cvHit
          ? "Appears in both the job description and your CV."
          : "Required or mentioned in the job, but not clearly present in your CV."
        : "Present on your CV but not emphasized in this job advert.",
    });
  }

  if (gaps.length === 0) {
    gaps.push({
      skill: "General fit",
      requirement: "medium",
      assessment: "developing",
      note: "Could not extract clear skill keywords. Add more detailed job and CV text.",
    });
  }

  const strongSkills = gaps.filter((g) => g.assessment === "strong").map((g) => g.skill);
  const missingSkills = gaps
    .filter((g) => g.assessment === "missing" || g.assessment === "needs_improvement")
    .map((g) => g.skill);

  const highGaps = gaps.filter((g) => g.requirement === "high");
  const strongHigh = highGaps.filter((g) => g.assessment === "strong").length;
  const compatibilityScore =
    highGaps.length === 0
      ? Math.round((strongSkills.length / Math.max(gaps.length, 1)) * 100)
      : Math.round((strongHigh / highGaps.length) * 100);

  const roadmap = [
    ...missingSkills.slice(0, 3).map((s) => `Practice ${s} with a small portfolio task this week.`),
    "Review free courses on OpenLearn, freeCodeCamp, or Coursera for your top gaps.",
    "Update your CV so matched skills use the same wording as the job advert.",
  ];

  return {
    id: `sk_${randomUUID().slice(0, 10)}`,
    checkId: input.checkId,
    jobTitle: input.jobTitle ?? guessTitle(input.jobText),
    jobText: input.jobText,
    cvText: input.cvText,
    compatibilityScore,
    gaps,
    strongSkills,
    missingSkills,
    roadmap,
    createdAt: new Date().toISOString(),
  };
}

function guessTitle(jobText: string): string {
  const m = jobText.match(/(?:position|role|title)\s*[:\-]\s*(.+)/i);
  if (m) return m[1].split("\n")[0].trim().slice(0, 80);
  return jobText.split("\n")[0]?.trim().slice(0, 80) || "Untitled role";
}
