# Prepare-only: verify + fit score + tailored CV

**Date:** 2026-11-07  
**Status:** Approved  
**Product:** Kazi Check

## Goal

After a job check, help the user prepare to apply safely: show how they match the role, give a tailored ATS-friendly CV (PDF), and deep-link to a verified official apply page when available. **Never auto-submit applications.**

## Decisions

| Topic | Choice |
|--------|--------|
| Mode | Prepare-only (v1); assisted apply later only on controlled official integrations |
| Profile intake | Web (CV upload + edit) **or** Telegram first-run onboarding |
| Identity link | Phone number (+254…), SMS OTP (ThriveWave) |
| Delivery | Telegram sends PDF **and** web report link |
| SCAM / HIGH_RISK | No fit score, no CV, no apply CTAs — warn only |
| CV generation | Structured profile → one ATS template → PDF (no invented facts) |
| Fit score | Hybrid keyword overlap + short LLM bullets |

## User flow

1. Onboard once (web or Telegram) → phone OTP → profile (CV parse and/or Q&A).
2. Check job (existing pipeline).
3. If SCAM / HIGH_RISK → verification reply only.
4. Else if profile linked → fit score + tailored PDF + web link + **Download CV** / **Open official apply** (URL only if verified listing).
5. Else → prompt to set up / link profile, then generate for that check.

## Data

- `User` (phone unique, optional telegram ids, phoneVerifiedAt)
- `Profile` (structured JSON fields + source)
- `PhoneOtp` (hash, expiry, attempts)
- `FitAssessment` (checkId, userId, score, bullets)
- `TailoredCv` (fitAssessmentId, pdf bytes or storage key, templateVersion)

Ephemeral disk: store PDF in DB (`Bytes`) or regenerate on demand — do not rely on local files on Render.

## Out of scope (v1)

- Auto-apply / WhatsApp messaging recruiters / paying fees
- DOCX export
- True ATS vendor score simulation
- Assisted form-fill integrations

## Success criteria

- Linked user gets fit + PDF after a non-scam check on Telegram and web.
- Unlinked user still gets full scam verification.
- Official apply button only when `officialListing` has a trusted apply URL.
- Copy stays simple English.
