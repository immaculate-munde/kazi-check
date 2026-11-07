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
    topReasons: [
      "Asked for interview fee via M-Pesa",
      "Lookalike KenGen domain",
      "Used Gmail while claiming KenGen HR",
    ],
    status: "confirmed",
    isPublished: true,
    recentFlags: [
      {
        reason: "Asked for interview fee via M-Pesa",
        createdAt: "2026-11-05T10:00:00.000Z",
      },
      {
        reason: "Lookalike KenGen domain",
        createdAt: "2026-11-04T14:00:00.000Z",
      },
    ],
  },
  {
    id: "sub_tg_hrkenya",
    kind: "handle",
    key: "@hrkenyajobs_official",
    direction: "job_offer",
    flagCount: 12,
    summary: "Telegram recruiter pushing visa processing fees for overseas roles.",
    lastFlaggedAt: "2026-11-06",
    topReasons: [
      "Visa processing fee before interview",
      "Pressure to pay same day",
    ],
    recentFlags: [
      {
        reason: "Visa processing fee before interview",
        createdAt: "2026-11-06T09:00:00.000Z",
      },
    ],
    status: "confirmed",
    isPublished: true,
  },
  {
    id: "sub_gmail_applicant",
    kind: "email",
    key: "ceo.safaricom.hr@gmail.com",
    direction: "applicant",
    flagCount: 8,
    summary: "Claims Safaricom employment from a free inbox; reverse fee asks.",
    lastFlaggedAt: "2026-11-04",
    topReasons: [
      "Free email while claiming Safaricom",
      "Asked employer to pay background fee",
    ],
    recentFlags: [
      {
        reason: "Free email while claiming Safaricom",
        createdAt: "2026-11-04T11:00:00.000Z",
      },
    ],
    status: "confirmed",
    isPublished: true,
  },
  {
    id: "sub_phone",
    kind: "phone",
    key: "+254700000111",
    direction: "job_offer",
    flagCount: 5,
    summary: "Calls candidates demanding M-Pesa for background check.",
    lastFlaggedAt: "2026-11-03",
    topReasons: ["Demanded M-Pesa for background check"],
    recentFlags: [
      {
        reason: "Demanded M-Pesa for background check",
        createdAt: "2026-11-03T16:00:00.000Z",
      },
    ],
    status: "confirmed",
    isPublished: true,
  },
];
