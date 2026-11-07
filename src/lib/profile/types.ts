export type ProfileExperience = {
  title: string;
  company: string;
  start?: string;
  end?: string;
  bullets?: string[];
};

export type ProfileEducation = {
  school: string;
  credential: string;
  year?: string;
};

export type SeekerProfile = {
  fullName: string;
  headline: string;
  location: string;
  summary: string;
  skills: string[];
  experience: ProfileExperience[];
  education: ProfileEducation[];
  languages: string[];
  links: string[];
  source: "cv_upload" | "telegram_qa" | "web_form" | "mixed";
  rawCvText?: string | null;
};

export type SeekerUser = {
  id: string;
  phone: string;
  phoneVerifiedAt: string | null;
  telegramChatId: string | null;
  telegramUserId: string | null;
  profile: SeekerProfile | null;
};

export function emptyProfile(
  source: SeekerProfile["source"] = "web_form",
): SeekerProfile {
  return {
    fullName: "",
    headline: "",
    location: "",
    summary: "",
    skills: [],
    experience: [],
    education: [],
    languages: [],
    links: [],
    source,
    rawCvText: null,
  };
}

export function profileIsUsable(p: SeekerProfile | null | undefined): boolean {
  if (!p) return false;
  return Boolean(
    p.fullName.trim() ||
      p.skills.length > 0 ||
      p.experience.length > 0 ||
      (p.summary && p.summary.trim().length > 40) ||
      (p.rawCvText && p.rawCvText.trim().length > 80),
  );
}
