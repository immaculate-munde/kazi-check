# Prepare-only CV + Fit Score Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Ship prepare-only: phone-linked profile, fit score, tailored PDF CV, Telegram + web delivery, no auto-apply.

**Architecture:** Extend Prisma with User/Profile/OTP/Fit/CV. After `runCheckPipeline`, if verdict allows and user is linked, run `scoreFit` + `renderCvPdf`, persist, send via Telegram `sendDocument` and expose web download + official apply link.

**Tech Stack:** Existing Next.js App Router, Prisma/Neon, ThriveWave SMS, Telegram Bot API, `pdfkit` for PDF, vitest.

## File map

| File | Responsibility |
|------|----------------|
| `prisma/schema.prisma` | User, Profile, PhoneOtp, FitAssessment, TailoredCv |
| `src/lib/profile/*` | Types, OTP, CRUD, CV text parse into profile |
| `src/lib/fit/*` | Fit scoring + copy |
| `src/lib/cv/*` | PDF template render |
| `src/lib/telegram/client.ts` | `sendDocument` |
| `src/lib/telegram/handlers.ts` | Onboard, /profile, post-check prepare flow |
| `src/lib/telegram/format.ts` | Prepare-only buttons/copy |
| `src/app/api/auth/otp/*` | Request / verify OTP |
| `src/app/api/profile/*` | Get/update profile, upload CV text |
| `src/app/api/checks/[id]/fit/*` | Fit + CV download |
| `src/app/profile/page.tsx` | Onboarding UI |
| `src/app/checks/[id]/page.tsx` | Fit block + CTAs |

## Tasks

### Task 1: Schema + migrate
Add models; `prisma db push` / migrate.

### Task 2: OTP + profile library
`normalizeKenyaPhone`, create/verify OTP (hash), upsert user/profile. Tests.

### Task 3: Fit + PDF
`scoreFit(profile, check)` heuristic (+ optional LLM); `renderCvPdf(profile, roleTitle)`. Tests.

### Task 4: APIs + web pages
OTP routes, profile routes, fit/CV download, `/profile` page, check report CTAs.

### Task 5: Telegram
`sendDocument`; session onboard states; after check hook; `/profile` `/cv`; update apply copy to prepare-only.

### Task 6: Wire + verify
Update format/handlers tests; run vitest + lint.
