import {
  emptyProfile,
  type ProfileEducation,
  type ProfileExperience,
  type SeekerProfile,
} from "@/lib/profile/types";

/** Lightweight heuristic parse of pasted CV / resume text into a profile. */
export function parseCvTextToProfile(raw: string): SeekerProfile {
  const text = raw.replace(/\r\n/g, "\n").trim();
  const profile = emptyProfile("cv_upload");
  profile.rawCvText = text;

  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines[0] && lines[0].length < 80 && !/curriculum|resume|cv/i.test(lines[0])) {
    profile.fullName = lines[0];
  }

  const email = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0];
  const phone = text.match(/(?:\+254|0)[17]\d{8}/)?.[0];
  if (email) profile.links.push(`mailto:${email}`);
  if (phone) profile.links.push(`tel:${phone}`);

  const skillsBlock = sectionBody(text, /skills|competenc/i);
  if (skillsBlock) {
    profile.skills = skillsBlock
      .split(/[,•|\n]/)
      .map((s) => s.trim())
      .filter((s) => s.length > 1 && s.length < 40)
      .slice(0, 24);
  }

  const summaryBlock = sectionBody(text, /summary|profile|about me|objective/i);
  if (summaryBlock) {
    profile.summary = summaryBlock.slice(0, 600);
  } else if (lines.length > 1) {
    profile.summary = lines.slice(1, 4).join(" ").slice(0, 400);
  }

  const expBlock = sectionBody(text, /experience|employment|work history/i);
  if (expBlock) {
    profile.experience = parseExperience(expBlock);
  }

  const eduBlock = sectionBody(text, /education|academic/i);
  if (eduBlock) {
    profile.education = parseEducation(eduBlock);
  }

  if (!profile.headline && profile.experience[0]?.title) {
    profile.headline = profile.experience[0].title;
  }

  return profile;
}

function sectionBody(text: string, heading: RegExp): string | null {
  const lines = text.split("\n");
  let start = -1;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]?.trim() ?? "";
    if (heading.test(line) && line.length < 48) {
      start = i + 1;
      break;
    }
  }
  if (start < 0) return null;

  const nextHeading =
    /^(skills|experience|education|employment|projects|certifications|languages|references|contact)\b/i;
  const body: string[] = [];
  for (let i = start; i < lines.length; i++) {
    const line = lines[i]?.trim() ?? "";
    if (nextHeading.test(line) && line.length < 48) break;
    if (line) body.push(line);
  }
  return body.join("\n").trim() || null;
}

function parseExperience(block: string): ProfileExperience[] {
  const chunks = block.split(/\n(?=[A-Z])/).slice(0, 6);
  const out: ProfileExperience[] = [];
  for (const chunk of chunks) {
    const lines = chunk.split("\n").map((l) => l.trim()).filter(Boolean);
    if (!lines[0]) continue;
    const titleCompany = lines[0].split(/\s[-–|@]\s/);
    out.push({
      title: (titleCompany[0] ?? lines[0]).slice(0, 80),
      company: (titleCompany[1] ?? "").slice(0, 80),
      bullets: lines.slice(1, 5).map((l) => l.replace(/^[-•*]\s*/, "").slice(0, 160)),
    });
  }
  return out;
}

function parseEducation(block: string): ProfileEducation[] {
  const lines = block.split("\n").map((l) => l.trim()).filter(Boolean).slice(0, 4);
  return lines.map((line) => {
    const parts = line.split(/\s[-–,|]\s/);
    return {
      school: (parts[0] ?? line).slice(0, 100),
      credential: (parts[1] ?? "").slice(0, 100),
      year: line.match(/(20\d{2}|19\d{2})/)?.[0],
    };
  });
}
