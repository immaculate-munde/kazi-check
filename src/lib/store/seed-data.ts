import type { RegistrySubject } from "@/lib/types";

export const MOCK_SEED_SUBJECTS: RegistrySubject[] = [
  {
    id: "sub_kencareers",
    kind: "domain",
    key: "kencareers-apply.com",
    direction: "job_offer",
    flagCount: 23,
    summary: "Impersonates KenGen careers; asks for interview / medical fees.",
    lastFlaggedAt: "2026-11-05",
  },
  {
    id: "sub_tg_hrkenya",
    kind: "handle",
    key: "@hrkenyajobs_official",
    direction: "job_offer",
    flagCount: 12,
    summary: "Telegram recruiter pushing visa processing fees for overseas roles.",
    lastFlaggedAt: "2026-11-06",
  },
  {
    id: "sub_gmail_applicant",
    kind: "email",
    key: "ceo.safaricom.hr@gmail.com",
    direction: "applicant",
    flagCount: 8,
    summary: "Claims Safaricom employment from a free inbox; reverse fee asks.",
    lastFlaggedAt: "2026-11-04",
  },
  {
    id: "sub_phone",
    kind: "phone",
    key: "+254700000111",
    direction: "job_offer",
    flagCount: 5,
    summary: "Calls candidates demanding M-Pesa for background check.",
    lastFlaggedAt: "2026-11-03",
  },
];
